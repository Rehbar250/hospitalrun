import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  User, Lock, Palette, Bell, Monitor, Sun, Moon,
  Save, Shield, Building2
} from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'system', label: 'System', icon: Building2, adminOnly: true },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '' });
  // Password state
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    lowStock: true,
    labResults: true,
    billingDue: true,
    appointments: true,
  });
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    hospitalName: 'HospitalRun',
    hospitalEmail: '',
    hospitalPhone: '',
    currency: '₹',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    loadProfile();
    if (user?.role === 'ADMIN') loadSystemSettings();
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile({ name: data.name, email: data.email });
    } catch (err) {
      toast.error('Failed to load profile');
    }
  };

  const loadSystemSettings = async () => {
    try {
      const data = await api.getSystemSettings();
      setSystemSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      // Settings may not exist yet, that's ok
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile(profile);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSystemSettings(systemSettings);
      toast.success('System settings updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Always use light theme' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Always use dark theme' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match your OS setting' },
  ];

  const filteredTabs = tabs.filter(t => !t.adminOnly || user?.role === 'ADMIN');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h2>
          <p className="text-sm text-muted">Manage your account and application preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3><User size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Profile Information</h3>
              </div>
              <form onSubmit={handleProfileSave}>
                <div className="card-body">
                  <div className="settings-avatar-section">
                    <div className="settings-avatar">
                      {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 700 }}>{profile.name}</h4>
                      <span className="badge active">{user?.role}</span>
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: 24 }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-input" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-header">
                <h3><Palette size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Appearance</h3>
              </div>
              <div className="card-body">
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Theme</h4>
                <div className="theme-options">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`theme-option ${theme === opt.value ? 'active' : ''}`}
                      onClick={() => setTheme(opt.value)}
                    >
                      <div className="theme-option-icon">
                        <opt.icon size={24} />
                      </div>
                      <div className="theme-option-label">{opt.label}</div>
                      <div className="theme-option-desc">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h3><Bell size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Notification Preferences</h3>
              </div>
              <div className="card-body">
                <div className="notif-prefs">
                  {[
                    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when medicine stock is low' },
                    { key: 'labResults', label: 'Lab Results Ready', desc: 'Notifications when lab reports are completed' },
                    { key: 'billingDue', label: 'Billing Due', desc: 'Alerts for pending bill payments' },
                    { key: 'appointments', label: 'Appointment Reminders', desc: 'Upcoming appointment notifications' },
                  ].map(pref => (
                    <label key={pref.key} className="notif-pref-item">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{pref.label}</div>
                        <div className="text-sm text-muted">{pref.desc}</div>
                      </div>
                      <div className={`toggle ${notifPrefs[pref.key] ? 'active' : ''}`} onClick={() => setNotifPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}>
                        <div className="toggle-knob" />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h3><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Change Password</h3>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-input" value={passwords.currentPassword}
                      onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" value={passwords.newPassword}
                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-input" value={passwords.confirmPassword}
                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required minLength={6} />
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--info-light)', borderRadius: 'var(--border-radius-sm)', fontSize: 13, color: 'var(--info)', marginTop: 8 }}>
                    💡 Password must be at least 6 characters long
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Lock size={16} /> {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* System Tab (Admin) */}
          {activeTab === 'system' && user?.role === 'ADMIN' && (
            <div className="card">
              <div className="card-header">
                <h3><Building2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />System Settings</h3>
              </div>
              <form onSubmit={handleSystemSave}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Hospital Name</label>
                    <input className="form-input" value={systemSettings.hospitalName}
                      onChange={e => setSystemSettings({ ...systemSettings, hospitalName: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input type="email" className="form-input" value={systemSettings.hospitalEmail}
                        onChange={e => setSystemSettings({ ...systemSettings, hospitalEmail: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Phone</label>
                      <input className="form-input" value={systemSettings.hospitalPhone}
                        onChange={e => setSystemSettings({ ...systemSettings, hospitalPhone: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Currency Symbol</label>
                      <input className="form-input" value={systemSettings.currency}
                        onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="form-select" value={systemSettings.timezone}
                        onChange={e => setSystemSettings({ ...systemSettings, timezone: e.target.value })}>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={16} /> {loading ? 'Saving...' : 'Save System Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
