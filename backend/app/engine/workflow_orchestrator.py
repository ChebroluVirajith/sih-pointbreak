import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.models.canonical import (
    UnifiedApplication,
    ApplicationStatus,
    DepartmentType,
    DepartmentActionLog,
    CanonicalCitizenProfile,
    DataQualityReport
)
from app.engine.audit_logger import audit_logger

# In-Memory Unified Application Store
APPLICATION_STORE: Dict[str, UnifiedApplication] = {}

class WorkflowOrchestratorEngine:
    """
    Configurable Workflow & Event Orchestration.
    Coordinates multi-department verification pipelines without manual citizen intervention.
    """

    def create_application(
        self,
        scheme_code: str,
        scheme_name: str,
        global_citizen_id: str,
        citizen_name: str,
        consent_id: str,
        federated_profile: CanonicalCitizenProfile,
        quality_report: DataQualityReport
    ) -> UnifiedApplication:
        app_id = f"APP-SIH-{uuid.uuid4().hex[:6].upper()}"
        
        # Initial status is PENDING_EDUCATION_VERIFICATION or SUBMITTED
        initial_status = ApplicationStatus.PENDING_EDUCATION_VERIFICATION

        app = UnifiedApplication(
            application_id=app_id,
            scheme_code=scheme_code,
            scheme_name=scheme_name,
            global_citizen_id=global_citizen_id,
            citizen_name=citizen_name,
            status=initial_status,
            consent_id=consent_id,
            federated_data=federated_profile,
            quality_report=quality_report,
            department_logs=[
                DepartmentActionLog(
                    department=DepartmentType.INTEROP_CORE,
                    officer_name="Federated Orchestrator Engine",
                    action="APPLICATION_INITIATED",
                    comments=f"Auto-generated via Consent ID {consent_id}. Canonical Data verified."
                )
            ]
        )

        APPLICATION_STORE[app_id] = app

        # Log to Audit Ledger
        audit_logger.log_event(
            actor_id=global_citizen_id,
            actor_role="CITIZEN",
            action_type="APPLICATION_SUBMITTED",
            source_system="REACT_PORTAL",
            target_system="WORKFLOW_ORCHESTRATOR",
            global_citizen_id=global_citizen_id,
            payload_data=app.model_dump(),
            consent_id=consent_id,
            status="SUCCESS",
            details={"application_id": app_id, "scheme": scheme_name}
        )

        return app

    def advance_workflow_step(
        self,
        application_id: str,
        department: DepartmentType,
        officer_name: str,
        action: str, # "VERIFIED", "REJECTED", "ESCALATED"
        comments: str
    ) -> Optional[UnifiedApplication]:
        app = APPLICATION_STORE.get(application_id)
        if not app:
            return None

        # Add department log
        app.department_logs.append(
            DepartmentActionLog(
                department=department,
                officer_name=officer_name,
                action=action,
                comments=comments,
                timestamp=datetime.utcnow()
            )
        )
        app.updated_at = datetime.utcnow()

        if action == "REJECTED":
            app.status = ApplicationStatus.REJECTED
        else:
            # Multi-department Pipeline Progression:
            # Education -> Municipal -> Welfare -> Disbursed/Approved
            if app.status == ApplicationStatus.PENDING_EDUCATION_VERIFICATION:
                app.status = ApplicationStatus.PENDING_MUNICIPAL_VERIFICATION
            elif app.status == ApplicationStatus.PENDING_MUNICIPAL_VERIFICATION:
                app.status = ApplicationStatus.PENDING_WELFARE_APPROVAL
            elif app.status == ApplicationStatus.PENDING_WELFARE_APPROVAL:
                app.status = ApplicationStatus.APPROVED
            elif app.status == ApplicationStatus.APPROVED:
                app.status = ApplicationStatus.DISBURSED

        # Audit the state transition
        audit_logger.log_event(
            actor_id=officer_name,
            actor_role=department.value + "_OFFICER",
            action_type=f"WORKFLOW_ACTION_{action}",
            source_system=department.value + "_PORTAL",
            target_system="WORKFLOW_ORCHESTRATOR",
            global_citizen_id=app.global_citizen_id,
            payload_data={"application_id": application_id, "action": action, "new_status": app.status.value},
            consent_id=app.consent_id,
            status="SUCCESS",
            details={"comments": comments}
        )

        return app

    def get_applications(
        self,
        citizen_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[UnifiedApplication]:
        apps = list(APPLICATION_STORE.values())
        if citizen_id:
            apps = [a for a in apps if a.global_citizen_id == citizen_id]
        if status_filter:
            apps = [a for a in apps if a.status.value == status_filter]
        if department:
            if department == "EDUCATION":
                apps = [a for a in apps if a.status in [ApplicationStatus.PENDING_EDUCATION_VERIFICATION, ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED]]
            elif department == "MUNICIPAL":
                apps = [a for a in apps if a.status in [ApplicationStatus.PENDING_MUNICIPAL_VERIFICATION, ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED]]
            elif department == "WELFARE":
                apps = [a for a in apps if a.status in [ApplicationStatus.PENDING_WELFARE_APPROVAL, ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED]]
        
        # Sort descending by updated_at
        return sorted(apps, key=lambda x: x.updated_at, reverse=True)

    def get_application_by_id(self, application_id: str) -> Optional[UnifiedApplication]:
        return APPLICATION_STORE.get(application_id)

workflow_orchestrator = WorkflowOrchestratorEngine()
