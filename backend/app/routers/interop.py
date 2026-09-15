from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.core.security import get_current_user
from app.adapters.education_adapter import education_adapter
from app.adapters.municipal_adapter import municipal_adapter
from app.adapters.welfare_adapter import welfare_adapter
from app.engine.identity_mapper import identity_mapper
from app.engine.consent_manager import consent_manager
from app.engine.transformer import canonical_transformer
from app.engine.data_quality import data_quality_engine
from app.engine.audit_logger import audit_logger
from app.models.canonical import (
    CanonicalCitizenProfile,
    DataQualityReport,
    DepartmentType
)

router = APIRouter(prefix="/interop", tags=["Federated Interoperability Engine"])

class FederatedFetchRequest(BaseModel):
    consent_id: str
    include_education: bool = True
    include_municipal: bool = True
    include_welfare: bool = True

class FederatedFetchResponse(BaseModel):
    citizen_profile: CanonicalCitizenProfile
    quality_report: DataQualityReport
    departments_queried: list
    audit_hash: str

@router.post("/fetch-federated-dossier", response_model=FederatedFetchResponse)
async def fetch_federated_dossier(
    req: FederatedFetchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    global_id = current_user.get("global_citizen_id", "AID-9823-4412-7601")
    master_info = identity_mapper.get_citizen_master_record(global_id)
    if not master_info:
        raise HTTPException(status_code=404, detail=f"Master identity {global_id} not registered in MDM")

    # 1. Validate Consent Token
    if req.include_education and not consent_manager.validate_consent(req.consent_id, "EDUCATION"):
        raise HTTPException(status_code=403, detail="Valid active consent not present for EDUCATION department")
    if req.include_municipal and not consent_manager.validate_consent(req.consent_id, "MUNICIPAL"):
        raise HTTPException(status_code=403, detail="Valid active consent not present for MUNICIPAL department")
    if req.include_welfare and not consent_manager.validate_consent(req.consent_id, "WELFARE"):
        raise HTTPException(status_code=403, detail="Valid active consent not present for WELFARE department")

    departments_queried = []
    academic_record = None
    municipal_record = None
    welfare_record = None

    # 2. Query Education Adapter (PostgreSQL)
    if req.include_education:
        edu_id = identity_mapper.resolve_department_id(global_id, "EDUCATION")
        if edu_id:
            raw_edu = await education_adapter.fetch_student_record(edu_id)
            if raw_edu:
                academic_record = canonical_transformer.transform_education_record(raw_edu)
                departments_queried.append("PostgreSQL-EducationDB")

    # 3. Query Municipal Adapter (MySQL)
    if req.include_municipal:
        muni_id = identity_mapper.resolve_department_id(global_id, "MUNICIPAL")
        if muni_id:
            raw_muni = await municipal_adapter.fetch_municipal_record(muni_id)
            if raw_muni:
                municipal_record = canonical_transformer.transform_municipal_record(raw_muni)
                departments_queried.append("MySQL-MunicipalDB")

    # 4. Query Welfare Adapter (Legacy SOAP/XML)
    if req.include_welfare:
        welfare_id = identity_mapper.resolve_department_id(global_id, "WELFARE")
        if welfare_id:
            raw_welfare = await welfare_adapter.fetch_welfare_soap_xml(welfare_id)
            if raw_welfare:
                welfare_record = canonical_transformer.transform_welfare_soap_xml(raw_welfare)
                departments_queried.append("Legacy-SOAP-XML-WelfareRegistry")

    # 5. Build Canonical Unified Profile
    profile = CanonicalCitizenProfile(
        global_citizen_id=global_id,
        full_name=master_info["canonical_name"],
        date_of_birth=master_info["dob"],
        gender=master_info["gender"],
        email=master_info["email"],
        phone=master_info["phone"],
        academic_details=academic_record,
        municipal_details=municipal_record,
        welfare_details=welfare_record
    )

    # 6. Run Data Quality & Anomaly Engine
    quality = data_quality_engine.evaluate_quality(
        master_name=profile.full_name,
        academic=academic_record,
        municipal=municipal_record,
        welfare=welfare_record
    )

    # 7. Immutable Audit Trail Entry
    audit_entry = audit_logger.log_event(
        actor_id=current_user.get("username", "citizen"),
        actor_role=current_user.get("role", "CITIZEN"),
        action_type="FEDERATED_DATA_EXCHANGE",
        source_system=",".join(departments_queried),
        target_system="CANONICAL_INTEROP_ENGINE",
        global_citizen_id=global_id,
        payload_data=profile.model_dump(),
        consent_id=req.consent_id,
        status="SUCCESS",
        details={"quality_score": quality.overall_quality_score, "departments": departments_queried}
    )

    return FederatedFetchResponse(
        citizen_profile=profile,
        quality_report=quality,
        departments_queried=departments_queried,
        audit_hash=audit_entry.payload_hash
    )

@router.get("/raw-to-canonical-playground/{department}/{citizen_key}")
async def raw_to_canonical_playground(department: str, citizen_key: str):
    """
    SIH Judging Showcase:
    Returns the exact RAW format (XML / SQL row) side-by-side with the Transformed Canonical JSON Model.
    """
    dept = department.upper()
    global_id = "AID-9823-4412-7601" if citizen_key == "virajith" else "AID-1122-3344-5566"
    
    if dept == "EDUCATION":
        local_id = identity_mapper.resolve_department_id(global_id, "EDUCATION")
        raw = await education_adapter.fetch_student_record(local_id)
        canonical = canonical_transformer.transform_education_record(raw)
        return {
            "department": "EDUCATION",
            "source_protocol": "Relational SQL (PostgreSQL)",
            "raw_representation": raw,
            "canonical_json_model": canonical
        }
    elif dept == "MUNICIPAL":
        local_id = identity_mapper.resolve_department_id(global_id, "MUNICIPAL")
        raw = await municipal_adapter.fetch_municipal_record(local_id)
        canonical = canonical_transformer.transform_municipal_record(raw)
        return {
            "department": "MUNICIPAL",
            "source_protocol": "Relational SQL (MySQL InnoDB)",
            "raw_representation": raw,
            "canonical_json_model": canonical
        }
    elif dept == "WELFARE":
        local_id = identity_mapper.resolve_department_id(global_id, "WELFARE")
        raw = await welfare_adapter.fetch_welfare_soap_xml(local_id)
        canonical = canonical_transformer.transform_welfare_soap_xml(raw)
        return {
            "department": "WELFARE",
            "source_protocol": "SOAP 1.2 / XML WSDL Web Service",
            "raw_representation": raw.get("raw_xml") if raw else None,
            "canonical_json_model": canonical
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid department specified")
