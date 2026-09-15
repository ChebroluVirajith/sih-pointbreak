# GovConnect — Government Multi-Department Interoperability & Federated Service Delivery Framework

🏆 **Smart India Hackathon (SIH 2026) Prototype**

An enterprise-grade **Interoperability Framework, Middleware Layer, and Federated Service Delivery Architecture** enabling seamless, secure, standards-based cross-department information exchange without replacing legacy infrastructure.

---

## 🏛️ System Architecture Topology

The solution conforms strictly to the high-level federated service delivery architecture:

```
[ CITIZEN / GOV OFFICER ]
         │
         ▼
[ KEYCLOAK / FEDERATED IDENTITY ] (SSO • OIDC/OAuth2 • Roles • Token Verification)
         │ Access Token (JWT)
         ▼
[ REACT PORTAL ] (Citizen Single-Window + Department Officer UI + Admin Hub)
         │ HTTPS / REST JSON
         ▼
[ FASTAPI GATEWAY ] (Authentication • Authorization • Routing • Rate Limiting)
         │
         ▼
[ INTEROPERABILITY ENGINE ]
  ├── Consent Management (DEPA / MeitY-compliant, Time-bound & Digitally Signed)
  ├── Data Transformation & Canonical Model (W3C / IndEA JSON-LD Schemas)
  ├── Identity Mapping & MDM (Global Aadhaar/DigiLocker ID to Local Dept IDs + Fuzzy Match)
  ├── Workflow & Event Orchestration (Autonomous Multi-Department Approval Pipelines)
  └── Validation • SHA-256 Audit Logs • System Health Monitoring
         │
         ▼
[ ADAPTER LAYER CONNECTORS ]
  ├── Education Adapter  ────>  [ PostgreSQL Education Database ]
  ├── Municipal Adapter  ────>  [ MySQL Municipal Corporation DB ]
  └── Welfare Adapter    ────>  [ Legacy SOAP / XML Welfare Registry ]
```

---

## 🚀 Key Innovations & Features

1. **DEPA & MeitY Digital Consent Management**:
   - Citizen provides explicit, granular, time-bound consent before any department database is queried.
   - Generates cryptographically verifiable digital signature tokens.
   - Built-in Citizen Consent Vault with 1-click token revocation.

2. **Heterogeneous Data Transformation (Canonical Data Model)**:
   - Eliminates data silos by translating relational SQL tuples (PostgreSQL/MySQL) and Legacy SOAP 1.2 XML envelopes into standardized Canonical JSON-LD models.

3. **Master Data Management (MDM) & Fuzzy Identity Resolution**:
   - Resolves Global Citizen Identifiers (e.g. `AID-9823-4412-7601`) to siloed department-specific identifiers (`EDU-ROLL-102`, `MUNI-PROP-889`, `WEL-RATION-441`).
   - Fuzzy name similarity algorithm prevents duplicate rejections caused by minor spelling discrepancies.

4. **Multi-Department Workflow & Event Orchestration**:
   - Automated progression state machine: `Application Submitted` → `Education Verified` → `Municipal Endorsed` → `Welfare Approved & Disbursed`.

5. **Cryptographic Non-Repudiation Audit Ledger**:
   - Every single cross-department data exchange is recorded with SHA-256 payload checksums, actor identity, and timestamps.

---

## 💻 Quick Start & Running the Prototype

### Option 1: One-Click Startup (Windows)
Double-click `run_prototype.bat` or run:
```cmd
run_prototype.bat
```

### Option 2: Manual Terminal Startup

**Terminal 1 — Backend (FastAPI):**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
*API Swagger Documentation: `http://localhost:8000/docs`*

**Terminal 2 — Frontend (React + Vite):**
```bash
cd frontend
npm.cmd run dev
```
*Portal UI: `http://localhost:5173`*

---

## 🎭 Pre-Configured Demo Personas (Keycloak SSO Simulation)

| Persona Name | Username | Role / Department | Global ID |
| :--- | :--- | :--- | :--- |
| **Challa Virajith** | `citizen_virajith` | Citizen (Applicant) | `AID-9823-4412-7601` |
| **Priya Sharma** | `citizen_priya` | Citizen (Applicant) | `AID-1122-3344-5566` |
| **Dr. Ramesh Kumar** | `officer_edu` | Education Verification Officer | Higher Education Dept |
| **Ananya Sen** | `officer_muni` | Municipal Verification Officer | Municipal Corporation |
| **Suresh Patil** | `officer_welfare` | Social Welfare Officer | Ministry of Social Welfare |
| **Rajeev Mehta** | `admin_super` | System Interoperability Admin | Central Interop Hub |

---

## 🎯 Hackathon Presentation / Demo Flow for Judges

1. **Step 1: Citizen Single-Window Experience**
   - Log in as **Challa Virajith** (Citizen).
   - Select **National Higher Education & Research Fellowship 2026**.
   - Click **Grant Consent & Apply** → Observe the DEPA Consent Dialog detailing requested fields from Education, Municipal, and Welfare departments.
   - Click **Grant Consent & Fetch Data** → Observe instant zero-document auto-fill from PostgreSQL, MySQL, and Legacy SOAP/XML systems with 98% Data Integrity Score!
   - Click **Submit Application to Orchestrator**.

2. **Step 2: Department Verification Pipeline**
   - Switch persona to **Dr. Ramesh Kumar** (Education Officer) → Review Academic dossier & click **Verify & Endorse**.
   - Switch persona to **Ananya Sen** (Municipal Officer) → Review Municipal & property clearance → Click **Verify & Endorse**.
   - Switch persona to **Suresh Patil** (Welfare Officer) → Review BPL income → Click **Verify & Endorse**.

3. **Step 3: Interoperability Command & Audit Center**
   - Switch persona to **Rajeev Mehta** (System Admin) or open the **Interop Command & Audit** tab.
   - Show judges the **Live Schema Transformation Playground** (Side-by-side raw XML envelope vs Canonical JSON-LD).
   - Inspect the **Cryptographic Audit Log Ledger** and click **Verify Hash** to prove SHA-256 non-repudiation.
