import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, X, CalendarClock, CalendarPlus, Search, Sparkles, Brain, Loader2, Trash2 } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/format';

export default function Appointments() {
  const toast = useToast();
  const [data, setData] = useState({ appointments: [], total: 0 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', doctorId: '', dateTime: '', type: 'CHECKUP', notes: '' });

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ dateTime: '', doctorId: '', notes: '' });

  // Follow-up / next appointment modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ dateTime: '', doctorId: '', type: 'FOLLOW_UP', notes: '' });

  const [search, setSearch] = useState('');

  // AI Insights modal state
  const [showInsightsModal, setShowInsightsModal] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const openInsights = async (apt) => {
    setShowInsightsModal(apt);
    setLoadingInsights(true);
    setInsightsData(null);
    try {
      const data = await api.getAppointmentInsights(apt.id);
      setInsightsData(data);
    } catch (err) {
      toast.error('Failed to load clinical insights: ' + err.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  const load = () => {
    setLoading(true);
    const queryParts = [];
    if (statusFilter) queryParts.push(`status=${statusFilter}`);
    if (search) queryParts.push(`search=${search}`);
    const params = queryParts.join('&');
    api.getAppointments(params).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, search]);
  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
    api.getPatients().then(d => setPatients(d.patients)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.createAppointment(form); setShowModal(false); load(); toast.success('Appointment created successfully'); } catch (err) { toast.error(err.message); }
  };

  const updateStatus = async (id, status) => {
    try { await api.updateAppointmentStatus(id, status); load(); toast.success('Status updated'); } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.deleteAppointment(id);
      load();
      toast.success('Appointment deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Reschedule handler
  const openReschedule = (apt) => {
    setShowRescheduleModal(apt);
    // Pre-fill with existing values
    const existingDT = new Date(apt.dateTime);
    const localISO = new Date(existingDT.getTime() - existingDT.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setRescheduleForm({
      dateTime: localISO,
      doctorId: String(apt.doctorId),
      notes: apt.notes || '',
    });
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.updateAppointment(showRescheduleModal.id, {
        dateTime: rescheduleForm.dateTime,
        doctorId: rescheduleForm.doctorId,
        notes: rescheduleForm.notes,
        status: 'SCHEDULED',
      });
      setShowRescheduleModal(null);
      load();
      toast.success('Appointment rescheduled successfully');
    } catch (err) { toast.error(err.message); }
  };

  // Follow-up / Next appointment handler
  const openFollowUp = (apt) => {
    setShowFollowUpModal(apt);
    setFollowUpForm({
      dateTime: '',
      doctorId: String(apt.doctorId),
      type: 'FOLLOW_UP',
      notes: `Follow-up for ${apt.appointmentId}`,
    });
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.createAppointment({
        patientId: showFollowUpModal.patientId,
        doctorId: followUpForm.doctorId,
        dateTime: followUpForm.dateTime,
        type: followUpForm.type,
        notes: followUpForm.notes,
      });
      setShowFollowUpModal(null);
      load();
      toast.success('Follow-up appointment scheduled successfully');
    } catch (err) { toast.error(err.message); }
  };

  const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Appointments</h2>
          <p className="text-sm text-muted">{data.total} total appointments</p>
        </div>
        <div className="flex gap-3">
          <div className="search-bar">
            <Search size={16} />
            <input 
              placeholder="Search patients..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setForm({ patientId: '', doctorId: '', dateTime: '', type: 'CHECKUP', notes: '' }); setShowModal(true); }}><Plus size={18} /> New Appointment</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{a.appointmentId}</td>
                    <td className="font-semibold">{a.patient?.firstName} {a.patient?.lastName}</td>
                    <td>Dr. {a.doctor?.lastName}</td>
                    <td>{formatDateTime(a.dateTime)}</td>
                    <td>{a.type.replace('_', ' ')}</td>
                    <td><span className={`badge ${a.status.toLowerCase().replace('_', '-')}`}>{a.status.replace('_', ' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-select" value={a.status} onChange={e => updateStatus(a.id, e.target.value)} style={{ width: 130, padding: '4px 8px', fontSize: 12 }}>
                          {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        {(a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS') && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openReschedule(a)}
                            title="Reschedule this appointment"
                            style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <CalendarClock size={13} /> Reschedule
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openFollowUp(a)}
                          title="Schedule next appointment for this patient"
                          style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <CalendarPlus size={13} /> Next Appt
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openInsights(a)}
                          title="View AI Clinical Insights for this visit"
                          style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, borderColor: '#8b5cf6', color: '#8b5cf6' }}
                        >
                          <Sparkles size={13} /> AI Assist
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(a.id)}
                          title="Delete this appointment"
                          style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data.appointments.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No appointments found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Appointment</h3><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} required>
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Doctor *</label>
                  <select className="form-select" value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})} required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} - {d.specialization}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date & Time *</label><input type="datetime-local" className="form-input" value={form.dateTime} onChange={e => setForm({...form, dateTime: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="CHECKUP">Checkup</option><option value="FOLLOW_UP">Follow Up</option><option value="EMERGENCY">Emergency</option><option value="CONSULTATION">Consultation</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={20} style={{ color: 'var(--warning)' }} />
                Reschedule Appointment
              </h3>
              <button className="btn-icon" onClick={() => setShowRescheduleModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleReschedule}>
              <div className="modal-body">
                {/* Current appointment info */}
                <div style={{ background: 'var(--gray-50)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 16, border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Current Appointment</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
                    <span><strong>ID:</strong> {showRescheduleModal.appointmentId}</span>
                    <span><strong>Patient:</strong> {showRescheduleModal.patient?.firstName} {showRescheduleModal.patient?.lastName}</span>
                    <span><strong>Date:</strong> {formatDateTime(showRescheduleModal.dateTime)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Date & Time *</label>
                  <input type="datetime-local" className="form-input" value={rescheduleForm.dateTime}
                    onChange={e => setRescheduleForm({ ...rescheduleForm, dateTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <select className="form-select" value={rescheduleForm.doctorId} onChange={e => setRescheduleForm({ ...rescheduleForm, doctorId: e.target.value })}>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} - {d.specialization}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={rescheduleForm.notes}
                    onChange={e => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
                    placeholder="Reason for rescheduling..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowRescheduleModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarClock size={16} /> Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up / Next Appointment Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarPlus size={20} style={{ color: 'var(--success)' }} />
                Schedule Next Appointment
              </h3>
              <button className="btn-icon" onClick={() => setShowFollowUpModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleFollowUp}>
              <div className="modal-body">
                {/* Reference appointment info */}
                <div style={{ background: 'var(--primary-50)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 16, border: '1px solid var(--primary-200)' }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Scheduling follow-up for</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
                    <span><strong>Patient:</strong> {showFollowUpModal.patient?.firstName} {showFollowUpModal.patient?.lastName} ({showFollowUpModal.patient?.patientId})</span>
                    <span><strong>Previous:</strong> {showFollowUpModal.appointmentId} — {formatDate(showFollowUpModal.dateTime)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Next Appointment Date & Time *</label>
                  <input type="datetime-local" className="form-input" value={followUpForm.dateTime}
                    onChange={e => setFollowUpForm({ ...followUpForm, dateTime: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Doctor</label>
                    <select className="form-select" value={followUpForm.doctorId} onChange={e => setFollowUpForm({ ...followUpForm, doctorId: e.target.value })}>
                      {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} - {d.specialization}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Type</label>
                    <select className="form-select" value={followUpForm.type} onChange={e => setFollowUpForm({ ...followUpForm, type: e.target.value })}>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="CHECKUP">Checkup</option>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={followUpForm.notes}
                    onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                    placeholder="Follow-up notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowFollowUpModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarPlus size={16} /> Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Appointment Insights Modal */}
      {showInsightsModal && (
        <div className="modal-overlay" onClick={() => setShowInsightsModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}>
                <Brain size={20} className="ci-icon-pulse" />
                AI Clinical Assist
              </h3>
              <button className="btn-icon" onClick={() => setShowInsightsModal(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {loadingInsights ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <Loader2 size={32} className="ci-spin" style={{ color: '#8b5cf6' }} />
                </div>
              ) : insightsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Patient Info Header */}
                  <div style={{ background: 'var(--primary-50)', padding: 12, borderRadius: 8, border: '1px solid var(--primary-200)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                      {showInsightsModal.patient?.firstName} {showInsightsModal.patient?.lastName} ({showInsightsModal.patient?.patientId})
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                      Doctor: Dr. {showInsightsModal.doctor?.firstName} {showInsightsModal.doctor?.lastName} · Specialization: {showInsightsModal.doctor?.specialization}
                    </div>
                  </div>

                  {/* Attendance Risk */}
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Attendance / Compliance Risk</span>
                      <span className={`ci-severity-badge ${insightsData.noShowRisk > 60 ? 'critical' : insightsData.noShowRisk > 30 ? 'high' : 'low'}`}>
                        {insightsData.noShowRisk}% Risk
                      </span>
                    </h4>
                    <div className="ci-factor-bar-track" style={{ height: 10 }}>
                      <div className="ci-factor-bar-fill" style={{
                        width: `${insightsData.noShowRisk}%`,
                        background: insightsData.noShowRisk > 60 ? 'var(--danger)' : insightsData.noShowRisk > 30 ? '#f97316' : 'var(--success)'
                      }} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 6 }}>
                      {insightsData.noShowRisk > 50 
                        ? '⚠️ Patient shows higher probability of no-show/delay. Consider phone confirmation or early confirmation.' 
                        : '✅ Patient exhibits high compliance history and optimal scheduling slot.'}
                    </p>
                  </div>

                  {/* Doctor Load */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)', padding: 12, borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Doctor Daily Load</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{insightsData.doctorDailyLoad} appointments scheduled for today</div>
                    </div>
                    <span className={`ci-severity-badge ${insightsData.doctorLoadStatus === 'HIGH' ? 'critical' : insightsData.doctorLoadStatus === 'MODERATE' ? 'high' : 'low'}`}>
                      {insightsData.doctorLoadStatus}
                    </span>
                  </div>

                  {/* Pre-Visit Planning */}
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📋 AI Pre-Visit Checkup Plan</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {insightsData.checkupPlan.map((plan, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                          <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>•</span>
                          <span>{plan}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Duration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--gray-200)', paddingTop: 12 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Suggested Appointment Duration</span>
                    <strong style={{ color: 'var(--primary)' }}>{insightsData.suggestedDurationMins} minutes</strong>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)' }}>No data available.</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowInsightsModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
