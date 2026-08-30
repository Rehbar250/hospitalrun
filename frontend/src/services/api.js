const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getHeaders(),
  });

  // Handle 401 - auto logout on token expiry
  if (res.status === 401) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Patients
  getPatients: (params = '') => request(`/patients${params ? '?' + params : ''}`),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: (params = '') => request(`/doctors${params ? '?' + params : ''}`),
  getDoctor: (id) => request(`/doctors/${id}`),
  createDoctor: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  updateDoctor: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Appointments
  getAppointments: (params = '') => request(`/appointments${params ? '?' + params : ''}`),
  getAppointment: (id) => request(`/appointments/${id}`),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  // Lab Reports
  getLabReports: (params = '') => request(`/lab-reports${params ? '?' + params : ''}`),
  createLabReport: (data) => request('/lab-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateLabReport: (id, data) => request(`/lab-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Medicines
  getMedicines: (params = '') => request(`/medicines${params ? '?' + params : ''}`),
  createMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Prescriptions
  getPrescriptions: (params = '') => request(`/prescriptions${params ? '?' + params : ''}`),
  createPrescription: (data) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),

  // Billing
  getBilling: (params = '') => request(`/billing${params ? '?' + params : ''}`),
  createBilling: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  updateBilling: (id, data) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id, data) => request(`/billing/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params = '') => request(`/notifications${params ? '?' + params : ''}`),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  generateNotifications: () => request('/notifications/generate', { method: 'POST' }),

  // Settings
  getProfile: () => request('/settings/profile'),
  updateProfile: (data) => request('/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/settings/password', { method: 'PUT', body: JSON.stringify(data) }),
  getSystemSettings: () => request('/settings/system'),
  updateSystemSettings: (data) => request('/settings/system', { method: 'PUT', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params = '') => request(`/audit-logs${params}`),
  getAuditLogStats: () => request('/audit-logs/stats'),

  // Vitals & Forgot Password
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  getPatientVitals: (id) => request(`/patients/${id}/vitals`),
  addPatientVitals: (id, data) => request(`/patients/${id}/vitals`, { method: 'POST', body: JSON.stringify(data) }),

  // Clinical Intelligence
  checkPrescription: (data) => request('/clinical/check-prescription', { method: 'POST', body: JSON.stringify(data) }),
  checkVitals: (data) => request('/clinical/check-vitals', { method: 'POST', body: JSON.stringify(data) }),
  getReadmissionRisk: (patientId) => request(`/clinical/readmission-risk/${patientId}`),
  getLabAnomalies: () => request('/clinical/lab-anomalies'),
  analyzeNotes: (text) => request('/clinical/analyze-notes', { method: 'POST', body: JSON.stringify({ text }) }),
  getClinicalDashboard: () => request('/clinical/dashboard'),
  getAppointmentInsights: (id) => request(`/clinical/appointment-insights/${id}`),
};
