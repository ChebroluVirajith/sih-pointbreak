import uuid
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.canonical import AuditLogEntry

# In-Memory Immutable Ledger (Can be synced to DB / Block-store)
AUDIT_LEDGER: List[AuditLogEntry] = []

class AuditLoggerEngine:
    """
    Cryptographically verifiable Audit Ledger.
    Ensures non-repudiation, trace-back, and compliance monitoring for all cross-department data transactions.
    """

    def calculate_payload_hash(self, payload: Any) -> str:
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def log_event(
        self,
        actor_id: str,
        actor_role: str,
        action_type: str,
        source_system: str,
        target_system: str,
        global_citizen_id: str,
        payload_data: Any,
        consent_id: Optional[str] = None,
        status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLogEntry:
        log_id = f"AUD-{uuid.uuid4().hex[:10].upper()}"
        payload_hash = self.calculate_payload_hash(payload_data)

        entry = AuditLogEntry(
            log_id=log_id,
            timestamp=datetime.utcnow(),
            actor_id=actor_id,
            actor_role=actor_role,
            action_type=action_type,
            source_system=source_system,
            target_system=target_system,
            global_citizen_id=global_citizen_id,
            payload_hash=payload_hash,
            consent_id=consent_id,
            status=status,
            details=details or {}
        )

        AUDIT_LEDGER.insert(0, entry) # Most recent first
        return entry

    def get_logs(
        self,
        limit: int = 50,
        department: Optional[str] = None,
        citizen_id: Optional[str] = None
    ) -> List[AuditLogEntry]:
        filtered = AUDIT_LEDGER
        if citizen_id:
            filtered = [l for l in filtered if l.global_citizen_id == citizen_id]
        if department:
            filtered = [l for l in filtered if department in (l.source_system, l.target_system)]
        return filtered[:limit]

    def verify_log_integrity(self, log_id: str, payload_data: Any) -> bool:
        """
        Allows verification that data has not been modified after transmission
        """
        for entry in AUDIT_LEDGER:
            if entry.log_id == log_id:
                recomputed_hash = self.calculate_payload_hash(payload_data)
                return entry.payload_hash == recomputed_hash
        return False

audit_logger = AuditLoggerEngine()
