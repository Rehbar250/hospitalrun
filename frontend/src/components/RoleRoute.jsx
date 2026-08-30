import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleInfo, hasRole } from '../utils/rbac';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = allowedRoles.length === 0 || hasRole(user, allowedRoles);

  if (!isAuthorized) {
    const userRoleInfo = getRoleInfo(user.role);
    const allowedRoleNames = allowedRoles.map(r => getRoleInfo(r).label).join(' or ');

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        textAlign: 'center',
        padding: '32px 16px',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--danger, #ef4444)',
          marginBottom: 20,
        }}>
          <ShieldAlert size={42} />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: 'var(--text, #0f172a)' }}>
          Access Restricted
        </h2>

        <p style={{ maxWidth: 480, fontSize: 15, color: 'var(--text-muted, #64748b)', lineHeight: 1.6, marginBottom: 20 }}>
          Your active role is <strong style={{ color: userRoleInfo.color }}>{userRoleInfo.fullName} ({user.role})</strong>.
          This module is reserved for <strong>{allowedRoleNames}</strong> personnel only.
        </p>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: 28,
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted, #64748b)' }}>
            Role-Based Access Control (RBAC) Policy Enforced Server & Client Side
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Go Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Home size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
