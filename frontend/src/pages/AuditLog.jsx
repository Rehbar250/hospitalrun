import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/format';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Shield, Plus, Pencil, Trash2, LogIn, Key,
  Activity, Calendar
} from 'lucide-react';

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogIn,
  PASSWORD_CHANGE: Key,
};

const actionColors = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'teal',
  LOGOUT: 'amber',
  PASSWORD_CHANGE: 'purple',
};

export default function AuditLog() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (filters.action) params.set('action', filters.action);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const data = await api.getAuditLogs('?' + params.toString());
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getAuditLogStats();
      setStats(data);
    } catch (err) {
      // Stats are non-critical
    }
  };

  useEffect(() => { load(); }, [page, filters]);
  useEffect(() => { loadStats(); }, []);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDateTime(d);
  };

  const clearFilters = () => {
    setFilters({ action: '', resourceType: '', search: '', startDate: '', endDate: '' });
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Audit Log</h2>
          <p className="text-sm text-muted">{total} total activities recorded</p>
        </div>
        <div className="flex gap-3">
          <div className="search-bar">
            <Search />
            <input placeholder="Search activities..."
              value={filters.search}
              onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            />
          </div>
          <button className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} /> Filters
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-info">
            <h4>Total Activities</h4>
            <div className="stat-value">{stats.totalLogs || 0}</div>
          </div>
          <div className="stat-icon blue"><Activity size={22} /></div>
        </div>
        <div className="stat-card green">
          <div className="stat-info">
            <h4>Today</h4>
            <div className="stat-value">{stats.todayLogs || 0}</div>
          </div>
          <div className="stat-icon green"><Calendar size={22} /></div>
        </div>
        <div className="stat-card teal">
          <div className="stat-info">
            <h4>Creates</h4>
            <div className="stat-value">{stats.actionCounts?.CREATE || 0}</div>
          </div>
          <div className="stat-icon teal"><Plus size={22} /></div>
        </div>
        <div className="stat-card amber">
          <div className="stat-info">
            <h4>Updates</h4>
            <div className="stat-value">{stats.actionCounts?.UPDATE || 0}</div>
          </div>
          <div className="stat-icon amber"><Pencil size={22} /></div>
        </div>
        <div className="stat-card red">
          <div className="stat-info">
            <h4>Deletes</h4>
            <div className="stat-value">{stats.actionCounts?.DELETE || 0}</div>
          </div>
          <div className="stat-icon red"><Trash2 size={22} /></div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Action</label>
                <select className="form-select" value={filters.action} onChange={e => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}>
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="PASSWORD_CHANGE">Password Change</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Resource</label>
                <select className="form-select" value={filters.resourceType} onChange={e => { setFilters({ ...filters, resourceType: e.target.value }); setPage(1); }}>
                  <option value="">All Resources</option>
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Appointment">Appointment</option>
                  <option value="LabReport">Lab Report</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Billing">Billing</option>
                  <option value="Settings">Settings</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={filters.startDate} onChange={e => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={filters.endDate} onChange={e => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Timeline */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <Shield size={48} />
              <h3>No audit logs found</h3>
              <p>Activity logs will appear here as actions are performed in the system.</p>
            </div>
          ) : (
            <div className="audit-timeline">
              {logs.map(log => {
                const ActionIcon = actionIcons[log.action] || Activity;
                const color = actionColors[log.action] || 'blue';
                return (
                  <div key={log.id} className="audit-item">
                    <div className={`audit-icon ${color}`}>
                      <ActionIcon size={16} />
                    </div>
                    <div className="audit-content">
                      <div className="audit-header">
                        <span className="audit-user">{log.userName}</span>
                        <span className={`badge ${color === 'green' ? 'completed' : color === 'red' ? 'cancelled' : color === 'amber' ? 'in-progress' : 'scheduled'}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="audit-details">
                        {log.details || `${log.action} ${log.resourceType}`}
                        {log.resourceId && <span className="audit-resource-id">#{log.resourceId}</span>}
                      </div>
                      <div className="audit-meta">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span> · {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="pagination-info">Page {page} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
