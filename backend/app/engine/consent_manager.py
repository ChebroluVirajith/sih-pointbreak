import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.models.canonical import ConsentArtifact, ConsentScope, ConsentStatus, DepartmentType

# In-Memory Active & Historic Consent Store
CONSENT_STORE: Dict[str, ConsentArtifact] = {}

class ConsentManagerEngine:
    """
    DEPA (Data Empowerment and Protection Architecture) & MeitY Consent Manager.
    Issues, validates, and manages time-bound, purpose-specific consent artifacts.
    """

    def generate_digital_signature(self, citizen_id: str, requester: str, timestamp: str) -> str:
        raw_msg = f"{citizen_id}:{requester}:{timestamp}:GOV-DEPA-SECURE-KEY"
        return "SIG-SHA256-" + hashlib.sha256(raw_msg.encode()).hexdigest()[:24].upper()

    def create_consent_artifact(
        self,
        global_citizen_id: str,
        citizen_name: str,
        requester_service: str,
        scopes: List[Dict[str, Any]],
        validity_hours: int = 48
    ) -> ConsentArtifact:
        consent_id = f"CNS-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=validity_hours)

        consent_scopes = [
            ConsentScope(
                department=DepartmentType(s["department"]),
                fields_requested=s["fields_requested"],
                purpose=s.get("purpose", f"Verification for {requester_service}")
            )
            for s in scopes
        ]

        signature = self.generate_digital_signature(global_citizen_id, requester_service, now.isoformat())

        artifact = ConsentArtifact(
            consent_id=consent_id,
            global_citizen_id=global_citizen_id,
            citizen_name=citizen_name,
            requester_service=requester_service,
            scopes=consent_scopes,
            status=ConsentStatus.ACTIVE,
            created_at=now,
            expires_at=expires_at,
            digital_signature=signature
        )

        CONSENT_STORE[consent_id] = artifact
        return artifact

    def validate_consent(self, consent_id: str, requested_department: str) -> bool:
        artifact = CONSENT_STORE.get(consent_id)
        if not artifact:
            return False
        
        if artifact.status != ConsentStatus.ACTIVE:
            return False

        if datetime.utcnow() > artifact.expires_at:
            artifact.status = ConsentStatus.EXPIRED
            return False

        # Check if department is authorized in scopes
        dept_enum = DepartmentType(requested_department.upper())
        allowed_depts = [scope.department for scope in artifact.scopes]
        return dept_enum in allowed_depts

    def revoke_consent(self, consent_id: str, global_citizen_id: str) -> bool:
        artifact = CONSENT_STORE.get(consent_id)
        if not artifact or artifact.global_citizen_id != global_citizen_id:
            return False
        
        artifact.status = ConsentStatus.REVOKED
        return True

    def get_citizen_consents(self, global_citizen_id: str) -> List[ConsentArtifact]:
        return [c for c in CONSENT_STORE.values() if c.global_citizen_id == global_citizen_id]

    def get_consent_by_id(self, consent_id: str) -> Optional[ConsentArtifact]:
        return CONSENT_STORE.get(consent_id)

consent_manager = ConsentManagerEngine()
