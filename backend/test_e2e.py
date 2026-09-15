import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("=========================================================")
    print(" [*] RUNNING END-TO-END SIH PROTOTYPE INTEGRATION TEST")
    print("=========================================================")

    # 1. Test Auth & Personas
    print("\n[1/7] Testing Keycloak SSO & Personas...")
    resp = requests.get(f"{BASE_URL}/auth/personas")
    assert resp.status_code == 200, f"Failed: {resp.text}"
    personas = resp.json()
    print(f"  [OK] Fetched {len(personas)} demo personas")

    # Login as citizen_virajith
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "citizen_virajith"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Authenticated as Challa Virajith (Citizen)")

    # 2. Test Granting DEPA Consent
    print("\n[2/7] Testing DEPA Digital Consent Granting...")
    consent_payload = {
        "requester_service": "National Higher Education & Research Fellowship 2026",
        "scopes": [
            {"department": "EDUCATION", "fields_requested": ["degree", "cgpa", "university"], "purpose": "Academic verification"},
            {"department": "MUNICIPAL", "fields_requested": ["address", "ward", "domicile_years"], "purpose": "Residency check"},
            {"department": "WELFARE", "fields_requested": ["category", "income", "ration_card"], "purpose": "Socio-economic verification"}
        ],
        "validity_hours": 48
    }
    consent_resp = requests.post(f"{BASE_URL}/consent/grant", json=consent_payload, headers=headers)
    assert consent_resp.status_code == 200
    consent_data = consent_resp.json()
    consent_id = consent_data["consent_id"]
    print(f"  [OK] Issued Consent Artifact: {consent_id}")
    print(f"  [OK] Digital Signature: {consent_data['digital_signature']}")

    # 3. Test Federated Data Exchange (PostgreSQL + MySQL + SOAP/XML)
    print("\n[3/7] Testing Federated Interoperability Engine & Adapters...")
    fetch_payload = {
        "consent_id": consent_id,
        "include_education": True,
        "include_municipal": True,
        "include_welfare": True
    }
    fetch_resp = requests.post(f"{BASE_URL}/interop/fetch-federated-dossier", json=fetch_payload, headers=headers)
    assert fetch_resp.status_code == 200
    dossier = fetch_resp.json()
    profile = dossier["citizen_profile"]
    quality = dossier["quality_report"]

    print(f"  [OK] Queried Departments: {', '.join(dossier['departments_queried'])}")
    print(f"  [OK] Canonical Academic Record: {profile['academic_details']['degree']} ({profile['academic_details']['institution']}) - CGPA {profile['academic_details']['cgpa_percentage']}")
    print(f"  [OK] Canonical Municipal Record: {profile['municipal_details']['ward_number']}, {profile['municipal_details']['city']} - Tax: {profile['municipal_details']['property_tax_clearance_status']}")
    print(f"  [OK] Canonical Welfare Record (Parsed SOAP XML): Category {profile['welfare_details']['category']}, Income Rs {profile['welfare_details']['family_annual_income']}")
    print(f"  [OK] Data Quality Score: {quality['overall_quality_score']}% (Name similarity: {quality['name_similarity_score']}%)")

    # 4. Test Single-Window Application Submission
    print("\n[4/7] Submitting Application to Workflow Orchestrator...")
    app_payload = {
        "scheme_code": "SCH-TECH-GRANT-2026",
        "scheme_name": "National Higher Education & Research Fellowship 2026",
        "consent_id": consent_id,
        "federated_data": profile,
        "quality_report": quality
    }
    app_resp = requests.post(f"{BASE_URL}/applications/submit", json=app_payload, headers=headers)
    assert app_resp.status_code == 200
    application = app_resp.json()
    app_id = application["application_id"]
    print(f"  [OK] Application Created: {app_id} (Status: {application['status']})")

    # 5. Multi-Department Verification Steps
    print("\n[5/7] Advancing Multi-Department Verification Workflow...")
    
    # Education Officer Login & Endorsement
    edu_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "officer_edu"}).json()
    edu_headers = {"Authorization": f"Bearer {edu_login['access_token']}"}
    act1 = requests.post(f"{BASE_URL}/applications/workflow-action", json={
        "application_id": app_id,
        "department": "EDUCATION",
        "action": "VERIFIED",
        "comments": "Degree and 8.92 GPA verified against State Education Board database."
    }, headers=edu_headers).json()
    print(f"  [OK] Education Officer Endorsed -> Next Status: {act1['status']}")

    # Municipal Officer Login & Endorsement
    muni_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "officer_muni"}).json()
    muni_headers = {"Authorization": f"Bearer {muni_login['access_token']}"}
    act2 = requests.post(f"{BASE_URL}/applications/workflow-action", json={
        "application_id": app_id,
        "department": "MUNICIPAL",
        "action": "VERIFIED",
        "comments": "Bellandur Ward 150 domicile verified. Property tax cleared."
    }, headers=muni_headers).json()
    print(f"  [OK] Municipal Officer Endorsed -> Next Status: {act2['status']}")

    # Welfare Officer Login & Endorsement
    welf_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "officer_welfare"}).json()
    welf_headers = {"Authorization": f"Bearer {welf_login['access_token']}"}
    act3 = requests.post(f"{BASE_URL}/applications/workflow-action", json={
        "application_id": app_id,
        "department": "WELFARE",
        "action": "VERIFIED",
        "comments": "BPL ration card and income eligibility verified. Approved for direct benefit transfer."
    }, headers=welf_headers).json()
    print(f"  [OK] Welfare Officer Endorsed -> Final Status: {act3['status']}")

    # 6. Test Schema Transformation Playground
    print("\n[6/7] Testing Raw-to-Canonical Playground...")
    play_resp = requests.get(f"{BASE_URL}/interop/raw-to-canonical-playground/WELFARE/virajith")
    assert play_resp.status_code == 200
    play_data = play_resp.json()
    assert "soapenv:Envelope" in play_data["raw_representation"]
    assert play_data["canonical_json_model"]["category"] == "BPL"
    print("  [OK] SOAP XML successfully transformed into Canonical JSON-LD model")

    # 7. Test Cryptographic Audit Log & SHA-256 Checksum
    print("\n[7/7] Testing Cryptographic Audit Logs & SHA-256 Verification...")
    audit_resp = requests.get(f"{BASE_URL}/audit/logs?limit=5")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    latest_log = logs[0]
    print(f"  [OK] Latest Log: {latest_log['log_id']} - Action: {latest_log['action_type']}")
    
    verify_resp = requests.get(f"{BASE_URL}/audit/verify-hash/{latest_log['log_id']}")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    print(f"  [OK] SHA-256 Non-Repudiation Check: {verify_data['status']}")

    print("\n=========================================================")
    print(" [SUCCESS] ALL 7 TEST SUITES PASSED FLAWLESSLY!")
    print("=========================================================")

if __name__ == "__main__":
    run_tests()
