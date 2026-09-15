from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, consent, interop, applications, audit, monitoring
from app.engine.consent_manager import consent_manager
from app.engine.workflow_orchestrator import workflow_orchestrator
from app.engine.identity_mapper import identity_mapper
from app.engine.transformer import canonical_transformer
from app.engine.data_quality import data_quality_engine
from app.engine.audit_logger import audit_logger
from app.adapters.education_adapter import education_adapter
from app.adapters.municipal_adapter import municipal_adapter
from app.adapters.welfare_adapter import welfare_adapter
from app.models.canonical import CanonicalCitizenProfile, DepartmentType

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Federated Interoperability Engine & Service Delivery Architecture for SIH 2026",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React Frontend (vite default port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(consent.router, prefix=settings.API_V1_STR)
app.include_router(interop.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(monitoring.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def seed_initial_demo_data():
    """
    Pre-seeds an initial active consent, pre-fetched dossier, and sample applications
    so judges immediately see live audit trails, workflows, and charts upon startup.
    """
    try:
        # Pre-seed Priya Sharma application
        priya_consent = consent_manager.create_consent_artifact(
            global_citizen_id="AID-1122-3344-5566",
            citizen_name="Priya Sharma",
            requester_service="National Post-Graduate Technical Fellowship",
            scopes=[
                {"department": "EDUCATION", "fields_requested": ["degree", "cgpa", "university"]},
                {"department": "MUNICIPAL", "fields_requested": ["address", "domicile_years"]},
                {"department": "WELFARE", "fields_requested": ["category", "income"]}
            ],
            validity_hours=72
        )

        raw_edu = await education_adapter.fetch_student_record("EDU-ROLL-205")
        raw_muni = await municipal_adapter.fetch_municipal_record("MUNI-PROP-331")
        raw_welfare = await welfare_adapter.fetch_welfare_soap_xml("WEL-RATION-809")

        cademic = canonical_transformer.transform_education_record(raw_edu)
        muni = canonical_transformer.transform_municipal_record(raw_muni)
        welfare = canonical_transformer.transform_welfare_soap_xml(raw_welfare)

        profile = CanonicalCitizenProfile(
            global_citizen_id="AID-1122-3344-5566",
            full_name="Priya Sharma",
            date_of_birth="2002-11-05",
            gender="Female",
            email="priya.sharma@citizen.gov.in",
            phone="+91-9123456780",
            academic_details=cademic,
            municipal_details=muni,
            welfare_details=welfare
        )

        quality = data_quality_engine.evaluate_quality("Priya Sharma", cademic, muni, welfare)

        app_priya = workflow_orchestrator.create_application(
            scheme_code="SCH-TECH-FELLOW-2026",
            scheme_name="National Post-Graduate Technical Fellowship",
            global_citizen_id="AID-1122-3344-5566",
            citizen_name="Priya Sharma",
            consent_id=priya_consent.consent_id,
            federated_profile=profile,
            quality_report=quality
        )

        # Advance one step for Priya to show active pipeline
        workflow_orchestrator.advance_workflow_step(
            application_id=app_priya.application_id,
            department=DepartmentType.EDUCATION,
            officer_name="Dr. Ramesh Kumar",
            action="VERIFIED",
            comments="Academic credentials verified against State Board. CGPA 9.15 validated."
        )

        print("[STARTUP] Seeded initial demo interoperability data & audit entries successfully.")
    except Exception as e:
        print(f"[STARTUP ERROR] Seeding failed: {e}")

@app.get("/")
async def root():
    return {
        "message": "Government Multi-Department Interoperability & Federated Service Delivery Framework API is RUNNING",
        "docs": "/docs",
        "status": "HEALTHY",
        "version": settings.VERSION
    }
