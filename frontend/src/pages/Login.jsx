import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Heart, AlertCircle, ArrowLeft } from 'lucide-react';

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
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon"><Heart size={28} /></div>
          <h1>HospitalRun</h1>
          <p>Hospital Management System</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!forgotMode ? (
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
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-light)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: 'auto'
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

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--gray-500)' }}>
          Default: admin@hospitalrun.io / admin123
        </p>
      </div>
    </div>
  );
}
