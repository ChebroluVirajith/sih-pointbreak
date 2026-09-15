import React, { useState } from 'react';
import { 
  X, 
  ArrowDown, 
  Database, 
  Key, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Server, 
  FileCode2, 
  Activity, 
  CheckCircle2
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-900">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Federated Interoperability Architecture
              </h2>
              <p className="text-xs text-slate-500">
                End-to-End Reference Topology & Canonical Data Highway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Architecture Flow Diagram */}
        <div className="flex flex-col items-center gap-3.5 py-2">
          
          {/* 1. CITIZEN / GOV OFFICER */}
          <div 
            onClick={() => setActiveStep('actor')}
            className={`w-full max-w-md p-3 rounded-xl text-center border cursor-pointer transition-all ${
              activeStep === 'actor'
                ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">User Layer</div>
            <div className="text-xs font-bold flex items-center justify-center gap-2">
              CITIZEN / GOV OFFICER
            </div>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-red-500" />

          {/* 2. KEYCLOAK / FEDERATED IDENTITY */}
          <div 
            onClick={() => setActiveStep('keycloak')}
            className={`w-full max-w-md p-3 rounded-xl text-center border cursor-pointer transition-all ${
              activeStep === 'keycloak'
                ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">Identity & Access</div>
            <div className="text-xs font-bold flex items-center justify-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-red-600" />
              KEYCLOAK / FEDERATED IDENTITY
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              SSO • OIDC / OAuth2 • Roles • Token Verification
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-mono">
            <ArrowDown className="w-3 h-3 text-red-500" />
            <span>Access Token (JWT)</span>
            <ArrowDown className="w-3 h-3 text-red-500" />
          </div>

          {/* 3. REACT PORTAL */}
          <div 
            onClick={() => setActiveStep('react')}
            className={`w-full max-w-lg p-3 rounded-xl text-center border cursor-pointer transition-all ${
              activeStep === 'react'
                ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">Unified Frontend</div>
            <div className="text-xs font-bold flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              REACT PORTAL (Citizen + Dept UI)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Single-Window Form • DEPA Consent Modal • Live Application Tracker
            </div>
          </div>

          <div className="text-[10px] text-red-600 font-mono flex items-center gap-1">
            <ArrowDown className="w-3 h-3 text-red-500" />
            <span>HTTPS / REST JSON</span>
            <ArrowDown className="w-3 h-3 text-red-500" />
          </div>

          {/* 4. FASTAPI GATEWAY */}
          <div 
            onClick={() => setActiveStep('gateway')}
            className={`w-full max-w-xl p-3 rounded-xl text-center border cursor-pointer transition-all ${
              activeStep === 'gateway'
                ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">API Gateway Layer</div>
            <div className="text-xs font-bold flex items-center justify-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-red-600" />
              FASTAPI GATEWAY
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Authentication • Authorization • Routing • Rate Limiting
            </div>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-red-500" />

          {/* 5. INTEROPERABILITY ENGINE */}
          <div 
            onClick={() => setActiveStep('engine')}
            className={`w-full max-w-3xl p-4.5 rounded-2xl border transition-all cursor-pointer ${
              activeStep === 'engine'
                ? 'bg-red-50/60 border-red-500 shadow-sm'
                : 'bg-slate-50/80 border-slate-200 hover:border-red-300'
            }`}
          >
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-white px-3 py-0.5 rounded-full border border-red-200 shadow-sm">
                INTEROPERABILITY ENGINE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> Consent Management
                </div>
                <div className="text-[11px] text-slate-500">
                  DEPA-compliant time-bound consent artifacts & cryptographic signatures.
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                  <FileCode2 className="w-3.5 h-3.5 text-red-600" /> Data Transformation & Canonical Model
                </div>
                <div className="text-[11px] text-slate-500">
                  Heterogeneous format translation: converts XML/SOAP & SQL into unified JSON-LD.
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                  <Cpu className="w-3.5 h-3.5 text-red-600" /> Identity Mapping (MDM)
                </div>
                <div className="text-[11px] text-slate-500">
                  Global ID (Aadhaar/National ID) to Local Department ID mapping with fuzzy resolution.
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                  <Activity className="w-3.5 h-3.5 text-red-600" /> Workflow + Event Orchestration
                </div>
                <div className="text-[11px] text-slate-500">
                  Autonomous state-machine coordinating multi-department approval pipelines.
                </div>
              </div>
            </div>

            <div className="p-2 bg-white border border-slate-200 rounded-lg text-center text-xs font-mono text-red-700 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
              <span>Validation • SHA-256 Audit Logs • System Health Monitoring</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <ArrowDown className="w-3 h-3 text-slate-400" />
            <span>ADAPTER LAYER CONNECTORS</span>
            <ArrowDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* 6. ADAPTERS & LEGACY DATABASES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
            
            {/* Education */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <div className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
                Education Adapter
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-800 font-semibold my-1">
                <Database className="w-3.5 h-3.5 text-red-600" />
                PostgreSQL Education DB
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Marks, Enrollment, Board Token
              </div>
            </div>

            {/* Municipal */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <div className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
                Municipal Adapter
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-800 font-semibold my-1">
                <Database className="w-3.5 h-3.5 text-red-600" />
                MySQL Municipal DB
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Property Tax, Ward Domicile
              </div>
            </div>

            {/* Welfare */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <div className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
                Welfare Adapter
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-800 font-semibold my-1">
                <Server className="w-3.5 h-3.5 text-red-600" />
                Legacy SOAP / XML System
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Ration Card, DBT Subsidies
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
