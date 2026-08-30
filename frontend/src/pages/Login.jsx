import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ROLES, ROLE_INFO } from '../utils/rbac';
import { Heart, AlertCircle, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

const DEMO_ROLES = [
  { role: ROLES.ADMIN, email: 'admin@hospitalrun.io', pass: 'admin123', label: 'Admin', icon: '👑', desc: 'Full System & Audit Access' },
  { role: ROLES.DOCTOR, email: 'dr.sharma@hospitalrun.io', pass: 'doctor123', label: 'Doctor', icon: '👨‍⚕️', desc: 'Clinical Notes, Prescriptions, AI' },
  { role: ROLES.NURSE, email: 'nurse@hospitalrun.io', pass: 'nurse123', label: 'Nurse', icon: '👩‍⚕️', desc: 'Vitals & Appointments' },
  { role: ROLES.RECEPTIONIST, email: 'receptionist@hospitalrun.io', pass: 'reception123', label: 'Reception', icon: '🏢', desc: 'Patient Intake & Billing' },
  { role: ROLES.PHARMACIST, email: 'pharmacist@hospitalrun.io', pass: 'pharma123', label: 'Pharmacist', icon: '💊', desc: 'Medicines & Dispensing' },
  { role: ROLES.LAB_TECH, email: 'labtech@hospitalrun.io', pass: 'labtech123', label: 'Lab Tech', icon: '🧪', desc: 'Diagnostic Test Results' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@hospitalrun.io');
  const [password, setPassword] = useState('admin123');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleQuickLogin = async (demoEmail, demoPass, roleLabel) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      toast.success(`Signed in as ${roleLabel}`);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      toast.success(res.message, 6000);
      setForgotMode(false);
      setForgotEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">
          <div className="logo-icon"><Heart size={28} /></div>
          <h1>HospitalRun</h1>
          <p>Hospital Information System • Multi-Role RBAC</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!forgotMode ? (
          <>
            {/* Quick 1-Click Role Login Chips */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-muted, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={14} color="#eab308" /> Demo Role Quick Sign-In
                </span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>Click to switch</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}>
                {DEMO_ROLES.map((r) => {
                  const isSelected = email === r.email;
                  const info = ROLE_INFO[r.role];
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleQuickLogin(r.email, r.pass, r.label)}
                      title={`${r.label}: ${r.desc}`}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${info.color}` : '1px solid var(--border-color, #e2e8f0)',
                        background: isSelected ? info.bgColor : 'var(--card-bg, #ffffff)',
                        color: isSelected ? info.color : 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color, #e2e8f0)' }} />
              <span style={{ padding: '0 10px' }}>or sign in with credentials</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color, #e2e8f0)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@hospitalrun.io"
                  required
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-light, #3b82f6)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ marginTop: 6 }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px 20px' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">Recovery Email Address</label>
              <input
                type="email"
                className="form-input"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setForgotMode(false); setError(''); }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
