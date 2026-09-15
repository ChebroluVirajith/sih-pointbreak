import asyncio
from typing import Optional, Dict, Any

# Mock MySQL Database Schema: municipal_urban_registry
# Columns: [prop_id, taxpayer_name, ward, street, locality, city_name, pin, tax_status, residence_duration]
MUNICIPAL_DB_RECORDS = {
    "MUNI-PROP-889": {
        "prop_id": "MUNI-PROP-889",
        "taxpayer_name": "Challa Virajith",
        "ward": "Ward 150 - Bellandur",
        "street": "14th Cross, Green Glen Layout",
        "locality": "Outer Ring Road",
        "city_name": "Bengaluru",
        "pin": "560103",
        "tax_status": "PAID_NO_DUES",
        "residence_duration": 6
    },
    "MUNI-PROP-331": {
        "prop_id": "MUNI-PROP-331",
        "taxpayer_name": "Priya Sharma",
        "ward": "Ward 42 - Kothrud",
        "street": "B-402, Shanti Vihar",
        "locality": "Paud Road",
        "city_name": "Pune",
        "pin": "411038",
        "tax_status": "PAID_NO_DUES",
        "residence_duration": 10
    }
}

class MunicipalAdapter:
    """
    Connects to MySQL Municipal Database.
    Exposes query interface for property, address, and residency verification.
    """
    def __init__(self):
        self.system_id = "MySQL-MunicipalDB"
        self.health_status = "HEALTHY"
        self.db_engine = "MySQL 8.0 InnoDB / Replicated Cluster"

    async def fetch_municipal_record(self, dept_local_id: str) -> Optional[Dict[str, Any]]:
        # Simulate asynchronous DB query
        await asyncio.sleep(0.04)
        raw_record = MUNICIPAL_DB_RECORDS.get(dept_local_id)
        if not raw_record:
            return None
        
        return {
            "source_type": "MYSQL_INNODB_ROW",
            "database": "municipal_urban_registry",
            "raw_payload": raw_record
        }

    async def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": "MunicipalAdapter",
            "backend": "MySQL Municipal Corporation DB",
            "status": "ONLINE",
            "latency_ms": 15,
            "records_indexed": len(MUNICIPAL_DB_RECORDS)
        }

municipal_adapter = MunicipalAdapter()
