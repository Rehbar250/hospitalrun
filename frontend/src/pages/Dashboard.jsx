import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { formatDateTime } from '../utils/format';
import {
  Users, Stethoscope, CalendarDays, FlaskConical, Pill, Receipt,
  TrendingUp, Clock, Plus, UserPlus, Activity, ArrowRight
} from 'lucide-react';

// Animated counter hook
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target == null || target === 0) { setCount(0); return; }
    const startTime = performance.now();
    const startVal = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return count;
}

function AnimatedStat({ value }) {
  const animated = useCountUp(value || 0);
  return <>{animated}</>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboardStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const stats = data?.stats || {};
  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'blue' },
    { label: 'Active Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'teal' },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: CalendarDays, color: 'purple' },
    { label: 'Pending Lab Reports', value: stats.pendingLabReports, icon: FlaskConical, color: 'amber' },
    { label: 'Low Stock Medicines', value: stats.lowStockMedicines, icon: Pill, color: 'red' },
    { label: 'Pending Bills', value: stats.pendingBills, icon: Receipt, color: 'green' },
  ];

  const quickActions = [
    { label: 'New Patient', icon: UserPlus, color: 'var(--primary)', path: '/patients' },
    { label: 'Book Appointment', icon: CalendarDays, color: 'var(--accent)', path: '/appointments' },
    { label: 'Add Lab Report', icon: FlaskConical, color: 'var(--warning)', path: '/lab-reports' },
    { label: 'Create Bill', icon: Receipt, color: 'var(--success)', path: '/billing' },
  ];

  // Mock data for department breakdown (derived from stats)
  const departments = [
    { name: 'General', value: Math.max(stats.totalAppointments * 0.35, 1), color: 'var(--primary)' },
    { name: 'Cardiology', value: Math.max(stats.totalAppointments * 0.2, 1), color: 'var(--danger)' },
    { name: 'Orthopedics', value: Math.max(stats.totalAppointments * 0.15, 1), color: 'var(--accent)' },
    { name: 'Pediatrics', value: Math.max(stats.totalAppointments * 0.18, 1), color: 'var(--warning)' },
    { name: 'Neurology', value: Math.max(stats.totalAppointments * 0.12, 1), color: '#7c3aed' },
  ];
  const maxDeptValue = Math.max(...departments.map(d => d.value), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>Dashboard</h2>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} />
            Last updated: {formatDateTime(new Date())}
          </span>
        </div>
      </div>

      {/* Animated Stat Cards */}
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-info">
              <h4>{stat.label}</h4>
              <div className="stat-value"><AnimatedStat value={stat.value} /></div>
            </div>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        {quickActions.map((action, i) => (
          <button
            key={i}
            className="quick-action-card"
            onClick={() => navigate(action.path)}
          >
            <div className="quick-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
              <action.icon size={22} />
            </div>
            <span className="quick-action-label">{action.label}</span>
            <ArrowRight size={16} className="quick-action-arrow" />
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header">
            <h3><Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Upcoming Appointments</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/appointments')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentAppointments || []).map(apt => (
                  <tr key={apt.id}>
                    <td className="font-semibold">{apt.patient?.firstName} {apt.patient?.lastName}</td>
                    <td>Dr. {apt.doctor?.lastName}</td>
                    <td>{formatDateTime(apt.dateTime)}</td>
                    <td><span className={`badge ${apt.status.toLowerCase().replace('_', '-')}`}>{apt.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
                {(!data?.recentAppointments?.length) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No upcoming appointments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue & Department Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Revenue & Analytics</h3>
          </div>
          <div className="card-body">
            {/* Revenue Display */}
            <div className="revenue-display">
              <div className="revenue-amount">
                ₹{Number(stats.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted">Total Revenue Collected</div>
            </div>

            {/* Department Breakdown Chart */}
            <div style={{ marginTop: 28 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--gray-700)' }}>
                Department Breakdown
              </h4>
              <div className="dept-chart">
                {departments.map((dept, i) => (
                  <div key={i} className="dept-chart-row">
                    <span className="dept-chart-label">{dept.name}</span>
                    <div className="dept-chart-bar-track">
                      <div
                        className="dept-chart-bar-fill"
                        style={{
                          width: `${(dept.value / maxDeptValue) * 100}%`,
                          background: dept.color,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    </div>
                    <span className="dept-chart-value">{Math.round(dept.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Patients */}
            <div style={{ marginTop: 28 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Recent Patients</h4>
              {(data?.recentPatients || []).map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--gray-100)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--primary-100)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 13
                  }}>
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold" style={{ fontSize: 14 }}>{p.firstName} {p.lastName}</div>
                    <div className="text-sm text-muted">{p.patientId}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
