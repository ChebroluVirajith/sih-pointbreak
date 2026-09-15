// Uses relative path through Vite proxy, ensuring seamless operation across Localhost & GitHub Codespaces
const API_BASE = '/api/v1';

export const api = {
  // Auth
  getPersonas: async () => {
    const res = await fetch(`${API_BASE}/auth/personas`);
    return res.json();
  },
  login: async (username) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  },

  // Consent
  grantConsent: async (token, payload) => {
    const res = await fetch(`${API_BASE}/consent/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getMyConsents: async (token) => {
    const res = await fetch(`${API_BASE}/consent/my-consents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  revokeConsent: async (token, consentId) => {
    const res = await fetch(`${API_BASE}/consent/revoke/${consentId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // Interoperability
  fetchFederatedDossier: async (token, payload) => {
    const res = await fetch(`${API_BASE}/interop/fetch-federated-dossier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Federated exchange error');
    }
    return res.json();
  },
  getPlaygroundData: async (department, citizenKey) => {
    const res = await fetch(`${API_BASE}/interop/raw-to-canonical-playground/${department}/${citizenKey}`);
    return res.json();
  },

  // Applications
  submitApplication: async (token, payload) => {
    const res = await fetch(`${API_BASE}/applications/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getMyApplications: async (token) => {
    const res = await fetch(`${API_BASE}/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  getDepartmentQueue: async (token, department) => {
    const res = await fetch(`${API_BASE}/applications/department-queue/${department}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  advanceWorkflow: async (token, payload) => {
    const res = await fetch(`${API_BASE}/applications/workflow-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Audit
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit/logs?limit=50`);
    return res.json();
  },
  verifyAuditHash: async (logId) => {
    const res = await fetch(`${API_BASE}/audit/verify-hash/${logId}`);
    return res.json();
  },

  // Monitoring
  getSystemHealth: async () => {
    const res = await fetch(`${API_BASE}/monitoring/system-health`);
    return res.json();
  }
};
