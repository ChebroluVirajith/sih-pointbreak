from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.security import get_current_user, require_roles
from app.engine.workflow_orchestrator import workflow_orchestrator
from app.models.canonical import (
    UnifiedApplication,
    DepartmentType,
    CanonicalCitizenProfile,
    DataQualityReport
)

router = APIRouter(prefix="/applications", tags=["Unified Scheme Applications & Workflows"])

class SubmitApplicationRequest(BaseModel):
    scheme_code: str
    scheme_name: str
    consent_id: str
    federated_data: CanonicalCitizenProfile
    quality_report: DataQualityReport

class AdvanceWorkflowRequest(BaseModel):
    application_id: str
    department: DepartmentType
    action: str # "VERIFIED", "REJECTED", "ESCALATED"
    comments: str

@router.post("/submit", response_model=UnifiedApplication)
async def submit_application(
    req: SubmitApplicationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    global_id = current_user.get("global_citizen_id", "AID-9823-4412-7601")
    citizen_name = current_user.get("name", "Citizen")

    app = workflow_orchestrator.create_application(
        scheme_code=req.scheme_code,
        scheme_name=req.scheme_name,
        global_citizen_id=global_id,
        citizen_name=citizen_name,
        consent_id=req.consent_id,
        federated_profile=req.federated_data,
        quality_report=req.quality_report
    )
    return app

@router.get("/my-applications", response_model=List[UnifiedApplication])
async def get_my_applications(current_user: Dict[str, Any] = Depends(get_current_user)):
    global_id = current_user.get("global_citizen_id")
    # If officer or admin, return all; if citizen return citizen's
    if current_user.get("role") == "CITIZEN" and global_id:
        return workflow_orchestrator.get_applications(citizen_id=global_id)
    return workflow_orchestrator.get_applications()

@router.get("/department-queue/{department}", response_model=List[UnifiedApplication])
async def get_department_queue(
    department: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    dept_clean = department.upper()
    return workflow_orchestrator.get_applications(department=dept_clean)

@router.post("/workflow-action", response_model=UnifiedApplication)
async def advance_workflow(
    req: AdvanceWorkflowRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    officer_name = current_user.get("name", "Officer")
    updated = workflow_orchestrator.advance_workflow_step(
        application_id=req.application_id,
        department=req.department,
        officer_name=officer_name,
        action=req.action,
        comments=req.comments
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Application {req.application_id} not found")
    return updated

@router.get("/{application_id}", response_model=UnifiedApplication)
async def get_application_details(application_id: str):
    app = workflow_orchestrator.get_application_by_id(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app
