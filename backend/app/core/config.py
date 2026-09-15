import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Government Federated Interoperability Framework"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih-2026-interoperability-federated-secret-key-998811")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for demo ease
    
    # Interop Settings
    ENABLE_AUDIT_HASHING: bool = True
    DEPA_CONSENT_VALIDATION: bool = True
    SIMULATE_NETWORK_LATENCY: bool = True

settings = Settings()
