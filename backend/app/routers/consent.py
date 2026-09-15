from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.security import get_current_user
from app.engine.consent_manager import consent_manager
from app.engine.audit_logger import audit_logger
from app.models.canonical import ConsentArtifact

router = APIRouter(prefix="/consent", tags=["DEPA / MeitY Consent Management"])

class CreateConsentRequest(BaseModel):
    requester_service: str
    scopes: List[Dict[str, Any]]
    validity_hours: Optional[int] = 48

@router.post("/grant", response_model=ConsentArtifact)
async def grant_consent(
    req: CreateConsentRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    global_id = current_user.get("global_citizen_id", "AID-9823-4412-7601")
    citizen_name = current_user.get("name", "Citizen")

    artifact = consent_manager.create_consent_artifact(
        global_citizen_id=global_id,
        citizen_name=citizen_name,
        requester_service=req.requester_service,
        scopes=req.scopes,
        validity_hours=req.validity_hours or 48
    )

    # Log to tamper-evident audit ledger
    audit_logger.log_event(
        actor_id=global_id,
        actor_role="CITIZEN",
        action_type="CONSENT_GRANTED",
        source_system="REACT_PORTAL_CONSENT_VAULT",
        target_system="CONSENT_MANAGER",
        global_citizen_id=global_id,
        payload_data=artifact.model_dump(),
        consent_id=artifact.consent_id,
        status="SUCCESS",
        details={"requester": req.requester_service, "scopes_count": len(req.scopes)}
    )

    return artifact

@router.get("/my-consents", response_model=List[ConsentArtifact])
async def get_my_consents(current_user: Dict[str, Any] = Depends(get_current_user)):
    global_id = current_user.get("global_citizen_id", "AID-9823-4412-7601")
    return consent_manager.get_citizen_consents(global_id)

@router.post("/revoke/{consent_id}")
async def revoke_consent(
    consent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    global_id = current_user.get("global_citizen_id", "AID-9823-4412-7601")
    success = consent_manager.revoke_consent(consent_id, global_id)
    if not success:
        raise HTTPException(status_code=400, detail="Consent artifact not found or does not belong to citizen")
    
    audit_logger.log_event(
        actor_id=global_id,
        actor_role="CITIZEN",
        action_type="CONSENT_REVOKED",
        source_system="REACT_PORTAL_CONSENT_VAULT",
        target_system="CONSENT_MANAGER",
        global_citizen_id=global_id,
        payload_data={"consent_id": consent_id, "status": "REVOKED"},
        consent_id=consent_id,
        status="SUCCESS"
    )

    return {"status": "SUCCESS", "message": f"Consent artifact {consent_id} revoked successfully"}
