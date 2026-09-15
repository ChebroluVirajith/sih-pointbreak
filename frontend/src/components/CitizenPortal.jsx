import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Shield, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Database, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Layers, 
  Check, 
  X, 
  Lock,
  Award
} from 'lucide-react';
import { api } from '../api';

const AVAILABLE_SCHEMES = [
  {
    code: 'SCH-TECH-GRANT-2026',
    title: 'National Higher Education & Research Fellowship 2026',
    department: 'Ministry of Education & Social Justice',
    stipend: '₹ 45,000 / month',
    description: 'Provides postgraduate and doctoral financial grants. Requires academic verification, municipal residency proof, and socio-economic category check.',
    departmentsRequired: [
      { name: 'Department of Higher Education', source: 'PostgreSQL Education DB', fields: ['Degree', 'CGPA Percentage', 'Roll Number', 'University'] },
      { name: 'Municipal Corporation', source: 'MySQL Municipal DB', fields: ['Property Address', 'Ward Number', 'Domicile Years'] },
      { name: 'Ministry of Social Welfare', source: 'Legacy SOAP/XML System', fields: ['BPL / EWS Category', 'Annual Certified Income', 'Ration Card ID'] }
    ]
  },
  {
    code: 'SCH-URBAN-MSME-2026',
    title: 'Smart City Urban Entrepreneurship & Domicile Subsidy',
    department: 'Urban Development & Welfare Dept',
    stipend: '₹ 2,50,000 Seed Fund',
    description: 'Direct capital support for state residents starting green urban ventures.',
    departmentsRequired: [
      { name: 'Municipal Corporation', source: 'MySQL Municipal DB', fields: ['Trade License', 'Property Tax Clearance', 'Ward Residence'] },
      { name: 'Ministry of Social Welfare', source: 'Legacy SOAP/XML System', fields: ['Economic Category', 'DBT Subsidy Status'] }
    ]
  }
];

export default function CitizenPortal({ currentUser, token, onNotify }) {
  const [activeSubTab, setActiveSubTab] = useState('schemes'); // 'schemes' | 'tracker' | 'consent_vault'
  const [selectedScheme, setSelectedScheme] = useState(AVAILABLE_SCHEMES[0]);
  
  // Consent flow states
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentGrantedArtifact, setConsentGrantedArtifact] = useState(null);
  const [isFetchingDossier, setIsFetchingDossier] = useState(false);
  const [federatedDossier, setFederatedDossier] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  
  // Data lists
  const [myApplications, setMyApplications] = useState([]);
  const [myConsents, setMyConsents] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  useEffect(() => {
    if (token) {
      loadCitizenData();
    }
  }, [token, currentUser]);

  const loadCitizenData = async () => {
    setIsLoadingApps(true);
    try {
      const apps = await api.getMyApplications(token);
      setMyApplications(apps);
      const consents = await api.getMyConsents(token);
      setMyConsents(consents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleOpenConsentFlow = (scheme) => {
    setSelectedScheme(scheme);
    setIsConsentModalOpen(true);
  };

  const handleGrantConsent = async () => {
    try {
      const scopes = [
        { department: 'EDUCATION', fields_requested: ['degree', 'cgpa', 'university'], purpose: `Verification for ${selectedScheme.title}` },
        { department: 'MUNICIPAL', fields_requested: ['address', 'ward', 'domicile_years'], purpose: `Verification for ${selectedScheme.title}` },
        { department: 'WELFARE', fields_requested: ['category', 'income', 'ration_card'], purpose: `Verification for ${selectedScheme.title}` }
      ];

      const artifact = await api.grantConsent(token, {
        requester_service: selectedScheme.title,
        scopes,
        validity_hours: 48
      });

      setConsentGrantedArtifact(artifact);
      setIsConsentModalOpen(false);
      onNotify('Consent Granted', `DEPA Consent Artifact ${artifact.consent_id} digitally signed.`);

      // Automatically trigger federated dossier fetch
      handleFetchFederatedData(artifact.consent_id);
    } catch (err) {
      onNotify('Consent Error', err.message);
    }
  };

  const handleFetchFederatedData = async (consentId) => {
    setIsFetchingDossier(true);
    try {
      const res = await api.fetchFederatedDossier(token, {
        consent_id: consentId,
        include_education: true,
        include_municipal: true,
        include_welfare: true
      });

      setFederatedDossier(res.citizen_profile);
      setQualityReport(res.quality_report);
      onNotify('Data Synchronized', 'Cross-department data fetched & mapped to Canonical Model successfully!');
    } catch (err) {
      onNotify('Fetch Error', err.message);
    } finally {
      setIsFetchingDossier(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!consentGrantedArtifact || !federatedDossier || !qualityReport) return;
    setIsSubmittingApp(true);
    try {
      const res = await api.submitApplication(token, {
        scheme_code: selectedScheme.code,
        scheme_name: selectedScheme.title,
        consent_id: consentGrantedArtifact.consent_id,
        federated_data: federatedDossier,
        quality_report: qualityReport
      });

      onNotify('Application Submitted!', `Application ${res.application_id} has entered the review pipeline.`);
      setConsentGrantedArtifact(null);
      setFederatedDossier(null);
      setQualityReport(null);
      setActiveSubTab('tracker');
      loadCitizenData();
    } catch (err) {
      onNotify('Submission Error', err.message);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    try {
      await api.revokeConsent(token, consentId);
      onNotify('Consent Revoked', `Consent token ${consentId} has been revoked.`);
      loadCitizenData();
    } catch (err) {
      onNotify('Revoke Error', err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING_EDUCATION_VERIFICATION':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">Step 1: Education Verification</span>;
      case 'PENDING_MUNICIPAL_VERIFICATION':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">Step 2: Municipal Verification</span>;
      case 'PENDING_WELFARE_APPROVAL':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-800 border border-purple-200">Step 3: Welfare Review</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'DISBURSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">Disbursed to Bank</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Citizen Welcome Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                Citizen Gateway
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Master ID: {currentUser?.global_citizen_id || 'AID-9823-4412-7601'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome, {currentUser?.name}
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Access government schemes without duplicate document uploads. Grant single-click digital consent to fetch your records securely across Education, Municipal, and Welfare registries.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('schemes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'schemes' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apply Scheme
            </button>
            <button
              onClick={() => setActiveSubTab('tracker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'tracker' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Application Tracker
              {myApplications.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {myApplications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('consent_vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'consent_vault' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Consent Vault
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: Scheme Catalog & Apply Flow */}
      {activeSubTab === 'schemes' && (
        <div className="space-y-6">
          
          {/* If Dossier is fetched and ready to review */}
          {federatedDossier ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              
              {/* Top Banner indicating Interoperability success */}
              <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-red-600 border border-red-200 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Cross-Department Data Auto-Populated
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-red-700 border border-red-200">
                        DEPA Token: {consentGrantedArtifact?.consent_id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Zero document uploads required. Data fetched from PostgreSQL, MySQL, and SOAP/XML registries.
                    </div>
                  </div>
                </div>

                {/* Data Quality Score */}
                {qualityReport && (
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Data Integrity Score</div>
                      <div className="text-lg font-extrabold text-red-600">
                        {qualityReport.overall_quality_score}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dossier Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Academic Record (PostgreSQL) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-red-600" /> Education Registry
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      PostgreSQL
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">Student Name:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.academic_details?.student_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Degree & Major:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.academic_details?.degree}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">University:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.academic_details?.institution}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">CGPA:</span>
                      <span className="font-bold text-red-600 text-sm">{federatedDossier.academic_details?.cgpa_percentage} / 10.0</span>
                    </div>
                  </div>
                </div>

                {/* 2. Municipal Record (MySQL) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-red-600" /> Municipal Corporation
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      MySQL InnoDB
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">Owner:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.municipal_details?.owner_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Ward & City:</span>
                      <p className="font-semibold text-slate-900">
                        {federatedDossier.municipal_details?.ward_number}, {federatedDossier.municipal_details?.city}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Address:</span>
                      <p className="font-semibold text-slate-900 text-[11px]">{federatedDossier.municipal_details?.address_line}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Tax Status:</span>
                      <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {federatedDossier.municipal_details?.property_tax_clearance_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Welfare Record (SOAP/XML) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-red-600" /> Social Welfare Registry
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      SOAP / XML
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">Beneficiary:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.welfare_details?.beneficiary_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Ration Card ID:</span>
                      <p className="font-semibold text-slate-900 font-mono">{federatedDossier.welfare_details?.ration_card_number}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-semibold text-slate-900">{federatedDossier.welfare_details?.category}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Income:</span>
                      <span className="font-bold text-slate-900 text-sm">₹ {federatedDossier.welfare_details?.family_annual_income.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setFederatedDossier(null);
                    setConsentGrantedArtifact(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={isSubmittingApp}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingApp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Available Schemes List */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {AVAILABLE_SCHEMES.map((scheme) => (
                <div 
                  key={scheme.code}
                  className="bg-white border border-slate-200/80 hover:border-red-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {scheme.department}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {scheme.stipend}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {scheme.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {scheme.description}
                    </p>

                    {/* Integrated Departments */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-red-600" /> Federated Data Sources:
                      </div>
                      <div className="space-y-1.5">
                        {scheme.departmentsRequired.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70">
                            <span className="text-slate-800 font-medium">{d.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{d.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenConsentFlow(scheme)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all group"
                    >
                      <span>Grant Consent & Apply</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Subtab 2: Unified Application Tracker */}
      {activeSubTab === 'tracker' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              Unified Application Pipeline Tracking
            </h3>
            <button
              onClick={loadCitizenData}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApps ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {myApplications.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No applications submitted yet</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Apply for a scheme from the schemes catalog to track progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div 
                  key={app.application_id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{app.scheme_name}</span>
                        <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {app.application_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Applied On: {new Date(app.created_at).toLocaleString()} • Consent Token: {app.consent_id}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Multi-Stage Pipeline Progress Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
                    
                    {/* Stage 1 */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                      <div className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" /> Stage 1: Submitted
                      </div>
                      <div className="text-slate-800 font-semibold">Consent & Auto-Fill</div>
                      <div className="text-[10px] text-slate-500 font-mono">DEPA Verified</div>
                    </div>

                    {/* Stage 2 */}
                    <div className={`p-3 rounded-xl border text-xs space-y-0.5 ${
                      app.status !== 'PENDING_EDUCATION_VERIFICATION' && app.status !== 'SUBMITTED'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-700">
                        {app.status !== 'PENDING_EDUCATION_VERIFICATION' && app.status !== 'SUBMITTED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                        )}
                        Stage 2: Education
                      </div>
                      <div className="text-slate-800 font-semibold">Academic Verification</div>
                      <div className="text-[10px] text-slate-500 font-mono">PostgreSQL Registry</div>
                    </div>

                    {/* Stage 3 */}
                    <div className={`p-3 rounded-xl border text-xs space-y-0.5 ${
                      ['PENDING_WELFARE_APPROVAL', 'APPROVED', 'DISBURSED'].includes(app.status)
                        ? 'bg-slate-50 border-slate-200'
                        : app.status === 'PENDING_MUNICIPAL_VERIFICATION'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-700">
                        {['PENDING_WELFARE_APPROVAL', 'APPROVED', 'DISBURSED'].includes(app.status) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        Stage 3: Municipal
                      </div>
                      <div className="text-slate-800 font-semibold">Domicile & Tax Check</div>
                      <div className="text-[10px] text-slate-500 font-mono">MySQL Database</div>
                    </div>

                    {/* Stage 4 */}
                    <div className={`p-3 rounded-xl border text-xs space-y-0.5 ${
                      ['APPROVED', 'DISBURSED'].includes(app.status)
                        ? 'bg-slate-50 border-slate-200'
                        : app.status === 'PENDING_WELFARE_APPROVAL'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-700">
                        {['APPROVED', 'DISBURSED'].includes(app.status) ? (
                          <Award className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        Stage 4: Welfare & DBT
                      </div>
                      <div className="text-slate-800 font-semibold">Disbursal Approval</div>
                      <div className="text-[10px] text-slate-500 font-mono">Legacy SOAP / XML</div>
                    </div>

                  </div>

                  {/* Endorsement Remarks Trail */}
                  {app.department_logs?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                        Department Audit & Endorsement Log:
                      </div>
                      <div className="space-y-1">
                        {app.department_logs.map((log, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                {log.department}
                              </span>
                              <span className="text-slate-800">{log.comments}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              By: {log.officer_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Consent Vault */}
      {activeSubTab === 'consent_vault' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                Citizen Digital Consent Vault (DEPA / MeitY Architecture)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, audit, and revoke data-sharing tokens at any time.
              </p>
            </div>
            <button
              onClick={loadCitizenData}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Vault
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {myConsents.map((c) => (
              <div 
                key={c.consent_id}
                className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.requester_service}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE' 
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
                    <span>Artifact ID: <span className="text-slate-800 font-semibold">{c.consent_id}</span></span>
                    <span>Issued: {new Date(c.created_at).toLocaleDateString()}</span>
                    <span>Signature: <span className="text-red-700">{c.digital_signature?.slice(0, 16)}...</span></span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-slate-500">Authorized Scopes:</span>
                    {c.scopes.map((s, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {s.department} ({s.fields_requested.join(', ')})
                      </span>
                    ))}
                  </div>
                </div>

                {c.status === 'ACTIVE' && (
                  <div>
                    <button
                      onClick={() => handleRevokeConsent(c.consent_id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Revoke Consent
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEPA Consent Modal */}
      {isConsentModalOpen && selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">DEPA Digital Consent Request</h3>
                  <p className="text-[11px] text-slate-500">Data Empowerment and Protection Architecture</p>
                </div>
              </div>
              <button
                onClick={() => setIsConsentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-red-50/60 border border-red-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">{selectedScheme.title}</span> requests permission to verify records from the following departmental databases:
              </div>

              <div className="space-y-2">
                {selectedScheme.departmentsRequired.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{d.name}</span>
                      <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {d.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Fields: {d.fields.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Validity Duration:</span>
                  <span className="text-slate-900 font-mono font-semibold">48 Hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Digital Signature:</span>
                  <span className="text-red-700 font-mono font-semibold">SHA-256 Non-Repudiation Key</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsConsentModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantConsent}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Grant Consent & Fetch Data
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
