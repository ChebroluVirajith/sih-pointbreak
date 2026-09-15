import xmltodict
from typing import Dict, Any, Optional
from app.models.canonical import (
    CanonicalAcademicRecord,
    CanonicalMunicipalRecord,
    CanonicalWelfareRecord,
    CanonicalCitizenProfile
)

class CanonicalTransformerEngine:
    """
    Data Transformation & Canonical Model mapping engine.
    Ingests disparate formats (PostgreSQL Relational, MySQL rows, SOAP/XML envelopes)
    and maps them to standardized, interoperable Canonical Data Models.
    """

    def transform_education_record(self, raw_data: Dict[str, Any]) -> Optional[CanonicalAcademicRecord]:
        """
        Transforms PostgreSQL SQL row dictionary into CanonicalAcademicRecord
        """
        if not raw_data or "raw_payload" not in raw_data:
            return None
        
        row = raw_data["raw_payload"]
        return CanonicalAcademicRecord(
            student_name=row.get("full_name", ""),
            roll_number=row.get("student_id", ""),
            institution=row.get("university", ""),
            degree=row.get("prog_name", ""),
            year_of_passing=row.get("pass_year", 0),
            cgpa_percentage=float(row.get("gpa", 0.0)),
            is_verified_by_board=bool(row.get("board_auth_token")),
            source_system=raw_data.get("table", "PostgreSQL-EducationDB")
        )

    def transform_municipal_record(self, raw_data: Dict[str, Any]) -> Optional[CanonicalMunicipalRecord]:
        """
        Transforms MySQL row dictionary into CanonicalMunicipalRecord
        """
        if not raw_data or "raw_payload" not in raw_data:
            return None

        row = raw_data["raw_payload"]
        full_addr = f"{row.get('street', '')}, {row.get('locality', '')}"
        return CanonicalMunicipalRecord(
            owner_name=row.get("taxpayer_name", ""),
            property_or_assessment_id=row.get("prop_id", ""),
            ward_number=row.get("ward", ""),
            address_line=full_addr,
            city=row.get("city_name", ""),
            pincode=row.get("pin", ""),
            property_tax_clearance_status=row.get("tax_status", "UNKNOWN"),
            domicile_years=int(row.get("residence_duration", 0)),
            source_system=raw_data.get("database", "MySQL-MunicipalDB")
        )

    def transform_welfare_soap_xml(self, raw_data: Dict[str, Any]) -> Optional[CanonicalWelfareRecord]:
        """
        Parses Legacy SOAP/XML payload and transforms into CanonicalWelfareRecord
        """
        if not raw_data or "raw_xml" not in raw_data:
            return None

        xml_content = raw_data["raw_xml"]
        parsed = xmltodict.parse(xml_content)
        
        # Navigate SOAP Envelope Body -> GetBeneficiaryResponse -> BeneficiaryRecord
        body = parsed.get("soapenv:Envelope", {}).get("soapenv:Body", {})
        resp = body.get("welf:GetBeneficiaryResponse", {})
        rec = resp.get("welf:BeneficiaryRecord", {})

        if not rec:
            return None

        return CanonicalWelfareRecord(
            beneficiary_name=rec.get("welf:HeadOfFamilyName", ""),
            ration_card_number=rec.get("welf:RationCardId", ""),
            category=rec.get("welf:EconomicSocioCategory", "GENERAL"),
            family_annual_income=float(rec.get("welf:AnnualCertifiedIncomeINR", 0.0)),
            existing_subsidies_active=(rec.get("welf:ActiveDBTSubsidiesFlag", "false").lower() == "true"),
            source_system="Legacy-SOAP-XML-WelfareRegistry"
        )

canonical_transformer = CanonicalTransformerEngine()
