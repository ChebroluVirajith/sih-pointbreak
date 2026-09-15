from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class RoleEnum(str, Enum):
    CITIZEN = "CITIZEN"
    EDUCATION_OFFICER = "EDUCATION_OFFICER"
    MUNICIPAL_OFFICER = "MUNICIPAL_OFFICER"
    WELFARE_OFFICER = "WELFARE_OFFICER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"

class DepartmentType(str, Enum):
    EDUCATION = "EDUCATION"
    MUNICIPAL = "MUNICIPAL"
    WELFARE = "WELFARE"
    REVENUE = "REVENUE"
    INTEROP_CORE = "INTEROP_CORE"

class ConsentStatus(str, Enum):
    REQUESTED = "REQUESTED"
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

class ApplicationStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_EDUCATION_VERIFICATION = "PENDING_EDUCATION_VERIFICATION"
    PENDING_MUNICIPAL_VERIFICATION = "PENDING_MUNICIPAL_VERIFICATION"
    PENDING_WELFARE_APPROVAL = "PENDING_WELFARE_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"

# ==================== CANONICAL DATA MODELS ====================

class CanonicalAcademicRecord(BaseModel):
    student_name: str
    roll_number: str
    institution: str
    degree: str
    year_of_passing: int
    cgpa_percentage: float
    is_verified_by_board: bool
    source_system: str = "PostgreSQL-EducationDB"

class CanonicalMunicipalRecord(BaseModel):
    owner_name: str
    property_or_assessment_id: str
    ward_number: str
    address_line: str
    city: str
    pincode: str
    property_tax_clearance_status: str
    domicile_years: int
    source_system: str = "MySQL-MunicipalDB"

class CanonicalWelfareRecord(BaseModel):
    beneficiary_name: str
    ration_card_number: str
    category: str # BPL, EWS, GENERAL
    family_annual_income: float
    existing_subsidies_active: bool
    source_system: str = "Legacy-SOAP-XML-WelfareRegistry"

class CanonicalCitizenProfile(BaseModel):
    global_citizen_id: str # Aadhaar/APAAR/National ID
    full_name: str
    date_of_birth: str
    gender: str
    email: str
    phone: str
    academic_details: Optional[CanonicalAcademicRecord] = None
    municipal_details: Optional[CanonicalMunicipalRecord] = None
    welfare_details: Optional[CanonicalWelfareRecord] = None
    last_federated_sync: datetime = Field(default_factory=datetime.utcnow)

# ==================== CONSENT & GOVERNANCE ====================

class ConsentScope(BaseModel):
    department: DepartmentType
    fields_requested: List[str]
    purpose: str

class ConsentArtifact(BaseModel):
    consent_id: str
    global_citizen_id: str
    citizen_name: str
    requester_service: str
    scopes: List[ConsentScope]
    status: ConsentStatus = ConsentStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    digital_signature: str

class DataQualityReport(BaseModel):
    overall_quality_score: float # 0 to 100
    name_similarity_score: float
    mismatches: List[str] = []
    warnings: List[str] = []
    is_valid_for_auto_processing: bool

# ==================== WORKFLOW & AUDIT ====================

class DepartmentActionLog(BaseModel):
    department: DepartmentType
    officer_name: str
    action: str # VERIFIED, REJECTED, FLAGGED
    comments: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UnifiedApplication(BaseModel):
    application_id: str
    scheme_code: str
    scheme_name: str
    global_citizen_id: str
    citizen_name: str
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    consent_id: str
    federated_data: CanonicalCitizenProfile
    quality_report: DataQualityReport
    department_logs: List[DepartmentActionLog] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLogEntry(BaseModel):
    log_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_id: str
    actor_role: str
    action_type: str # DATA_EXCHANGE, CONSENT_GRANTED, CONSENT_REVOKED, VERIFICATION, AUTO_TRANSFORMATION
    source_system: str
    target_system: str
    global_citizen_id: str
    payload_hash: str
    consent_id: Optional[str] = None
    status: str # SUCCESS, DENIED, ERROR
    details: Dict[str, Any] = {}
