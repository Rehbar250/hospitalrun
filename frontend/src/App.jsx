import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import LabReports from './pages/LabReports';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import ClinicalIntelligence from './pages/ClinicalIntelligence';
import RoleRoute from './components/RoleRoute';
import { ROLES } from './utils/rbac';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  return user ? <Navigate to="/" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route element={<ProtectedRoute><NotificationProvider><Layout /></NotificationProvider></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST]}><Appointments /></RoleRoute>} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/lab-reports" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH]}><LabReports /></RoleRoute>} />
        <Route path="/pharmacy" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]}><Pharmacy /></RoleRoute>} />
        <Route path="/billing" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.RECEPTIONIST]}><Billing /></RoleRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/audit-log" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><AuditLog /></RoleRoute>} />
        <Route path="/clinical-intelligence" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]}><ClinicalIntelligence /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
