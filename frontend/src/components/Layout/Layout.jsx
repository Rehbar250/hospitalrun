import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  FlaskConical, Pill, Receipt, LogOut, Heart, Bell,
  Sun, Moon, Monitor, Settings, Shield, PanelLeftClose,
  PanelLeft, ChevronRight, X, Check, CheckCheck, Brain
} from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '../../utils/format';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'Management' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
  { section: 'Clinical' },
  { to: '/lab-reports', icon: FlaskConical, label: 'Lab Reports' },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  { to: '/clinical-intelligence', icon: Brain, label: 'AI Intelligence' },
  { section: 'Finance' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { section: 'System' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/audit-log', icon: Shield, label: 'Audit Log', adminOnly: true },
];

const breadcrumbMap = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/doctors': 'Doctors',
  '/lab-reports': 'Lab Reports',
  '/pharmacy': 'Pharmacy',
  '/billing': 'Billing',
  '/settings': 'Settings',
  '/audit-log': 'Audit Log',
  '/clinical-intelligence': 'AI Clinical Intelligence',
};

const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, showPanel, setShowPanel, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const ThemeIcon = themeIcons[theme] || Monitor;

  // Build breadcrumb
  let currentPage = breadcrumbMap[location.pathname];
  if (!currentPage) {
    if (location.pathname.startsWith('/patients/')) {
      currentPage = 'Patient Details';
    } else {
      currentPage = 'Page';
    }
  }

  const notifTypeIcons = {
    LOW_STOCK: '📦',
    LAB_RESULT: '🧪',
    BILLING_DUE: '💰',
    APPOINTMENT_REMINDER: '📅',
    SYSTEM: '🔔',
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Heart size={22} /></div>
          {!collapsed && (
            <div>
              <h1>HospitalRun</h1>
              <span>Management System</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item, i) =>
            item.section ? (
              !collapsed && <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && item.label}
              </NavLink>
            )
          )}

          <div style={{ flex: 1 }} />

          <button className="sidebar-link" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            {!collapsed && 'Collapse'}
          </button>

          <button className="sidebar-link" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
            <LogOut size={20} />
            {!collapsed && 'Logout'}
          </button>
        </nav>
      </aside>

      <div className={`main-content ${collapsed ? 'main-content-expanded' : ''}`}>
        <header className="header">
          <div className="header-left">
            {/* Breadcrumb */}
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <span className="breadcrumb-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <LayoutDashboard size={14} />
                Home
              </span>
              {location.pathname !== '/' && (
                <>
                  <ChevronRight size={14} className="breadcrumb-sep" />
                  <span className="breadcrumb-item breadcrumb-current">{currentPage}</span>
                </>
              )}
            </nav>
          </div>
          <div className="header-right">
            {/* Theme Toggle */}
            <button
              className="btn-icon header-action-btn"
              onClick={toggleTheme}
              title={`Theme: ${theme}`}
              aria-label={`Current theme: ${theme}. Click to toggle.`}
            >
              <ThemeIcon size={20} />
            </button>

            {/* Notifications Bell */}
            <div className="notification-bell-wrapper">
              <button
                className="btn-icon header-action-btn"
                onClick={() => setShowPanel(!showPanel)}
                aria-label={`${unreadCount} unread notifications`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {/* Notification Panel */}
              {showPanel && (
                <>
                  <div className="notification-overlay" onClick={() => setShowPanel(false)} />
                  <div className="notification-panel">
                    <div className="notification-panel-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button className="btn btn-outline btn-sm" onClick={markAllRead}>
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-panel-body">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">
                          <Bell size={32} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <div
                            key={n.id}
                            className={`notification-item ${n.isRead ? '' : 'unread'}`}
                            onClick={() => {
                              if (!n.isRead) markAsRead(n.id);
                              if (n.link) { navigate(n.link); setShowPanel(false); }
                            }}
                          >
                            <span className="notification-type-icon">
                              {notifTypeIcons[n.type] || '🔔'}
                            </span>
                            <div className="notification-content">
                              <div className="notification-title">{n.title}</div>
                              <div className="notification-message">{n.message}</div>
                              <div className="notification-time">
                                {formatTimeAgo(n.createdAt)}
                              </div>
                            </div>
                            {!n.isRead && <div className="notification-dot" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="header-user" onClick={() => navigate('/settings')}>
              <div className="header-user-avatar">{getInitials(user?.name)}</div>
              <div className="header-user-info">
                <div className="header-user-name">{user?.name}</div>
                <div className="header-user-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}
