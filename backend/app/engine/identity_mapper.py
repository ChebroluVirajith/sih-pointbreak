from typing import Optional, Dict, Any, List
import difflib

# Master Data Management (MDM) Global-to-Local Identity Registry
# Maps Global Citizen ID (e.g., Aadhaar / DigiLocker ID) to legacy department identifiers
MASTER_IDENTITY_INDEX: Dict[str, Dict[str, Any]] = {
    "AID-9823-4412-7601": {
        "global_id": "AID-9823-4412-7601",
        "canonical_name": "Challa Virajith",
        "dob": "2003-08-14",
        "gender": "Male",
        "email": "virajith@citizen.gov.in",
        "phone": "+91-9876543210",
        "department_mappings": {
            "EDUCATION": "EDU-ROLL-102",
            "MUNICIPAL": "MUNI-PROP-889",
            "WELFARE": "WEL-RATION-441"
        }
    },
    "AID-1122-3344-5566": {
        "global_id": "AID-1122-3344-5566",
        "canonical_name": "Priya Sharma",
        "dob": "2002-11-05",
        "gender": "Female",
        "email": "priya.sharma@citizen.gov.in",
        "phone": "+91-9123456780",
        "department_mappings": {
            "EDUCATION": "EDU-ROLL-205",
            "MUNICIPAL": "MUNI-PROP-331",
            "WELFARE": "WEL-RATION-809"
        }
    }
}

class IdentityMapperEngine:
    """
    Master Data Management (MDM) & Identity Resolution.
    Provides deterministic and probabilistic (fuzzy) resolution of citizen identifiers across siloed registries.
    """
    
    def resolve_department_id(self, global_citizen_id: str, department: str) -> Optional[str]:
        citizen_entry = MASTER_IDENTITY_INDEX.get(global_citizen_id)
        if not citizen_entry:
            return None
        return citizen_entry.get("department_mappings", {}).get(department.upper())

    def get_citizen_master_record(self, global_citizen_id: str) -> Optional[Dict[str, Any]]:
        return MASTER_IDENTITY_INDEX.get(global_citizen_id)

    def calculate_name_similarity(self, name_a: str, name_b: str) -> float:
        """
        Fuzzy match ratio to resolve variations (e.g., 'Challa Virajith' vs 'Virajith Ch')
        """
        clean_a = " ".join(sorted(name_a.lower().replace(".", " ").split()))
        clean_b = " ".join(sorted(name_b.lower().replace(".", " ").split()))
        return round(difflib.SequenceMatcher(None, clean_a, clean_b).ratio() * 100, 2)

    def get_all_registered_citizens(self) -> List[Dict[str, Any]]:
        return list(MASTER_IDENTITY_INDEX.values())

identity_mapper = IdentityMapperEngine()
