import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  UserCheck, 
  Cpu, 
  ChevronDown,
  Building2,
  GraduationCap,
  HeartHandshake,
  Key
} from 'lucide-react';

export default function Header({ 
  currentUser, 
  personas, 
  onSelectPersona, 
  activeTab, 
  setActiveTab,
  onOpenArchModal 
}) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'CITIZEN':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Citizen</span>;
      case 'EDUCATION_OFFICER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-red-600" /> Education Officer</span>;
      case 'MUNICIPAL_OFFICER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-red-600" /> Municipal Officer</span>;
      case 'WELFARE_OFFICER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"><HeartHandshake className="w-3.5 h-3.5 text-red-600" /> Welfare Officer</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> System Admin</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & National Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-600/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Gov<span className="text-red-600">Connect</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">SIH 2026</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Federated Interoperability & Canonical Service Delivery
              </p>
            </div>
          </div>

          {/* Minimal Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'citizen'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Portal
            </button>
            <button
              onClick={() => setActiveTab('officer')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'officer'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Officer Verification
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interop Command & Audit
            </button>
          </div>

          {/* Controls: Architecture Modal + Keycloak SSO Persona */}
          <div className="flex items-center gap-2.5">
            
            <button
              onClick={onOpenArchModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              title="View Architecture Topology"
            >
              <Cpu className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden lg:inline">Topology</span>
            </button>

            {/* Persona Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer shadow-sm transition-all">
                <div className="w-5 h-5 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-200">
                  <Key className="w-3 h-3" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">
                    {currentUser?.name?.split(' ')[0] || 'User'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 text-slate-900">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 mb-1">
                  Keycloak Federated SSO Roles
                </div>
                {personas.map((p) => (
                  <button
                    key={p.username}
                    onClick={() => onSelectPersona(p.username)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all flex flex-col gap-0.5 ${
                      currentUser?.username === p.username
                        ? 'bg-red-50 text-red-700 font-semibold border border-red-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{p.name}</span>
                      {currentUser?.username === p.username && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
