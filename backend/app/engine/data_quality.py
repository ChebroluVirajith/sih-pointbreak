from typing import List, Optional
from app.models.canonical import (
    CanonicalCitizenProfile,
    CanonicalAcademicRecord,
    CanonicalMunicipalRecord,
    CanonicalWelfareRecord,
    DataQualityReport
)
from app.engine.identity_mapper import identity_mapper

class DataQualityEngine:
    """
    Data Quality & Discrepancy Prevention Engine.
    Executes cross-department validation rules, fuzzy name reconciliation, and integrity checks.
    """

    def evaluate_quality(
        self,
        master_name: str,
        academic: Optional[CanonicalAcademicRecord],
        municipal: Optional[CanonicalMunicipalRecord],
        welfare: Optional[CanonicalWelfareRecord]
    ) -> DataQualityReport:
        mismatches: List[str] = []
        warnings: List[str] = []
        scores: List[float] = []

        # 1. Academic Name Similarity
        if academic:
            sim = identity_mapper.calculate_name_similarity(master_name, academic.student_name)
            scores.append(sim)
            if sim < 70.0:
                mismatches.append(f"High name mismatch in Education DB: '{academic.student_name}' vs master '{master_name}' ({sim}%)")
            elif sim < 90.0:
                warnings.append(f"Minor name variation in Education DB: '{academic.student_name}' ({sim}% similarity)")
            
            if not academic.is_verified_by_board:
                warnings.append("Education record lacks secondary digital board authentication token")

        # 2. Municipal Name Similarity & Domicile check
        if municipal:
            sim = identity_mapper.calculate_name_similarity(master_name, municipal.owner_name)
            scores.append(sim)
            if sim < 70.0:
                mismatches.append(f"High name mismatch in Municipal DB: '{municipal.owner_name}' vs master '{master_name}' ({sim}%)")
            elif sim < 90.0:
                warnings.append(f"Minor name variation in Municipal DB: '{municipal.owner_name}' ({sim}% similarity)")

            if municipal.property_tax_clearance_status != "PAID_NO_DUES":
                warnings.append(f"Municipal property tax status: {municipal.property_tax_clearance_status}")

        # 3. Welfare Name Similarity & Income check
        if welfare:
            sim = identity_mapper.calculate_name_similarity(master_name, welfare.beneficiary_name)
            scores.append(sim)
            if sim < 70.0:
                mismatches.append(f"High name mismatch in Welfare Registry: '{welfare.beneficiary_name}' vs master '{master_name}' ({sim}%)")
            
            if welfare.category == "BPL" and welfare.family_annual_income > 250000.0:
                warnings.append("Declared income exceeds standard BPL threshold, requires officer review")

        avg_similarity = round(sum(scores) / len(scores), 1) if scores else 100.0
        
        # Calculate overall quality score (deduct for mismatches and warnings)
        penalty = (len(mismatches) * 25.0) + (len(warnings) * 5.0)
        overall_score = max(0.0, min(100.0, avg_similarity - penalty))

        is_valid = len(mismatches) == 0 and overall_score >= 60.0

        return DataQualityReport(
            overall_quality_score=round(overall_score, 1),
            name_similarity_score=avg_similarity,
            mismatches=mismatches,
            warnings=warnings,
            is_valid_for_auto_processing=is_valid
        )

data_quality_engine = DataQualityEngine()
