import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GraduationCap, 
  HeartHandshake, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  RefreshCw
} from 'lucide-react';
import { api } from '../api';

export default function OfficerPortal({ currentUser, token, onNotify }) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Action state
  const [actionComments, setActionComments] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  useEffect(() => {
    // Default department filter based on officer role
    if (currentUser?.role === 'EDUCATION_OFFICER') setSelectedDept('EDUCATION');
    else if (currentUser?.role === 'MUNICIPAL_OFFICER') setSelectedDept('MUNICIPAL');
    else if (currentUser?.role === 'WELFARE_OFFICER') setSelectedDept('WELFARE');
    else setSelectedDept('ALL');
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      loadQueue();
    }
  }, [token, selectedDept]);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      if (selectedDept === 'ALL') {
        const apps = await api.getMyApplications(token);
        setApplications(apps);
      } else {
        const apps = await api.getDepartmentQueue(token, selectedDept);
        setApplications(apps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!selectedApp) return;
    setIsPerformingAction(true);
    try {
      let dept = 'EDUCATION';
      if (currentUser?.role === 'MUNICIPAL_OFFICER' || selectedDept === 'MUNICIPAL') dept = 'MUNICIPAL';
      else if (currentUser?.role === 'WELFARE_OFFICER' || selectedDept === 'WELFARE') dept = 'WELFARE';

      const comments = actionComments || `${actionType} by ${currentUser.name} after canonical verification.`;

      await api.advanceWorkflow(token, {
        application_id: selectedApp.application_id,
        department: dept,
        action: actionType,
        comments
      });

      onNotify('Action Recorded', `Application ${selectedApp.application_id} marked as ${actionType}.`);
      setSelectedApp(null);
      setActionComments('');
      loadQueue();
    } catch (err) {
      onNotify('Action Error', err.message);
    } finally {
      setIsPerformingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              Officer Verification Console
            </span>
            <span className="text-xs text-slate-500">
              Logged in: <span className="font-semibold text-slate-800">{currentUser?.name}</span>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Federated Verification & Approval Queue
          </h2>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {['ALL', 'EDUCATION', 'MUNICIPAL', 'WELFARE'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDept === dept
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dept}
            </button>
          ))}
          <button
            onClick={loadQueue}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg ml-0.5"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Queue & Dossier Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Queue List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Pending Applications ({applications.length})</span>
            <span className="text-[10px] text-red-600 font-mono">Live Queue</span>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">All applications verified</div>
              <p className="text-[11px] text-slate-500 mt-0.5">No pending items in this department queue.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {applications.map((app) => (
                <div
                  key={app.application_id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    selectedApp?.application_id === app.application_id
                      ? 'bg-red-50/50 border-red-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{app.citizen_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {app.application_id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-1">
                    {app.scheme_name}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>Quality Score: <strong className="text-red-700">{app.quality_report?.overall_quality_score}%</strong></span>
                    <span className="font-mono">{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dossier Detail & Endorsement Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 animate-in fade-in">
              
              {/* Dossier Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-mono text-red-600 font-semibold">
                    Application ID: {selectedApp.application_id}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedApp.citizen_name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Scheme: {selectedApp.scheme_name}
                  </div>
                </div>

                {/* Data Quality Pill */}
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Data Integrity</div>
                  <div className="text-lg font-black text-red-600">
                    {selectedApp.quality_report?.overall_quality_score}%
                  </div>
                </div>
              </div>

              {/* Cross-Department Federated Canonical Records */}
              <div className="space-y-3">
                
                {/* Academic Record */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-red-600" /> Higher Education Registry (PostgreSQL)
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">Verified Board Token</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Degree: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.academic_details?.degree}</span></div>
                    <div>CGPA: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.academic_details?.cgpa_percentage} / 10.0</span></div>
                    <div>University: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.academic_details?.institution}</span></div>
                    <div>Passing Year: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.academic_details?.year_of_passing}</span></div>
                  </div>
                </div>

                {/* Municipal Record */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-red-600" /> Municipal Corporation Registry (MySQL)
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">Tax Cleared</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Ward: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.municipal_details?.ward_number}</span></div>
                    <div>Domicile Duration: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.municipal_details?.domicile_years} Years</span></div>
                    <div className="col-span-2">Address: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.municipal_details?.address_line}, {selectedApp.federated_data?.municipal_details?.city}</span></div>
                  </div>
                </div>

                {/* Welfare Record */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <span className="flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-red-600" /> Social Welfare Registry (Legacy SOAP/XML)
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">Envelope Parsed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Category: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.welfare_details?.category}</span></div>
                    <div>Annual Income: <span className="font-semibold text-slate-900">₹ {selectedApp.federated_data?.welfare_details?.family_annual_income?.toLocaleString()}</span></div>
                    <div>Ration Card: <span className="font-mono font-semibold text-slate-900">{selectedApp.federated_data?.welfare_details?.ration_card_number}</span></div>
                    <div>Subsidies Active: <span className="font-semibold text-slate-900">{selectedApp.federated_data?.welfare_details?.existing_subsidies_active ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>

              </div>

              {/* Endorsement Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Officer Endorsement Remarks:
                  </label>
                  <input
                    type="text"
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    placeholder="e.g., Verified against canonical data ledger. Approved for next stage."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleAction('REJECTED')}
                    disabled={isPerformingAction}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction('VERIFIED')}
                    disabled={isPerformingAction}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify & Endorse Application
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Eye className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">Select an application from queue</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Review the cross-department dossier and endorse workflow advancement.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
