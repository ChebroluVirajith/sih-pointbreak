import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CitizenPortal from './components/CitizenPortal';
import OfficerPortal from './components/OfficerPortal';
import AdminHub from './components/AdminHub';
import ArchitectureModal from './components/ArchitectureModal';
import { api } from './api';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [personas, setPersonas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'officer' | 'admin'
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  
  // Notification Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadInitialPersonas();
  }, []);

  const loadInitialPersonas = async () => {
    try {
      const data = await api.getPersonas();
      setPersonas(data);
      handleSelectPersona('citizen_virajith');
    } catch (err) {
      console.error("Failed to load personas:", err);
    }
  };

  const handleSelectPersona = async (username) => {
    try {
      const res = await api.login(username);
      setToken(res.access_token);
      setCurrentUser(res.user);

      if (res.user.role === 'CITIZEN') {
        setActiveTab('citizen');
      } else if (res.user.role.endsWith('_OFFICER')) {
        setActiveTab('officer');
      } else if (res.user.role === 'SYSTEM_ADMIN') {
        setActiveTab('admin');
      }

      showToast('Federated SSO Authenticated', `Switched persona to ${res.user.name} (${res.user.role})`);
    } catch (err) {
      showToast('Login Error', err.message, 'error');
    }
  };

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col selection:bg-red-600 selection:text-white">
      
      {/* Top Navigation & SSO Header */}
      <Header
        currentUser={currentUser}
        personas={personas}
        onSelectPersona={handleSelectPersona}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenArchModal={() => setIsArchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'citizen' && (
          <CitizenPortal 
            currentUser={currentUser} 
            token={token} 
            onNotify={showToast} 
          />
        )}
        
        {activeTab === 'officer' && (
          <OfficerPortal 
            currentUser={currentUser} 
            token={token} 
            onNotify={showToast} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminHub 
            onNotify={showToast} 
          />
        )}
      </main>

      {/* Architecture Topology Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* Minimal Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in">
          <div className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 max-w-md ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold">{toast.title}</div>
              <div className="text-xs text-slate-600 mt-0.5">{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart India Hackathon (SIH 2026) Prototype — Federated Interoperability Framework</span>
          <span className="font-mono text-[11px] text-red-600">Keycloak • FastAPI • Canonical JSON-LD • DEPA Consent</span>
        </div>
      </footer>

    </div>
  );
}
