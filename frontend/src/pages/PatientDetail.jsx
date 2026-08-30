import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { hasRole, ROLES } from '../utils/rbac';
import { formatDate, formatDateTime } from '../utils/format';
import {
  ArrowLeft, CalendarDays, FlaskConical, Pill, Receipt,
  Activity, Plus, Clock, FileText, CheckCircle, AlertTriangle, Heart, X
} from 'lucide-react';

const tabs = [
  { id: 'vitals', label: 'Clinical Vitals', icon: Activity },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'labReports', label: 'Lab Reports', icon: FlaskConical },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'billing', label: 'Billing Invoices', icon: Receipt },
];

export default function PatientDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const canRecordVitals = hasRole(user, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE);

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vitals');

  // Vitals form state
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    temperature: '',
    bloodPress: '',
    pulseRate: '',
    spo2: '',
    weight: '',
  });

  const loadPatient = () => {
    setLoading(true);
    api.getPatient(id)
      .then(setPatient)
      .catch(err => {
        toast.error('Failed to load patient history.');
        navigate('/patients');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  const handleAddVitals = async (e) => {
    e.preventDefault();
    try {
      await api.addPatientVitals(id, vitalForm);
      toast.success('Vital signs recorded successfully.');
      setShowVitalModal(false);
      setVitalForm({ temperature: '', bloodPress: '', pulseRate: '', spo2: '', weight: '' });
      loadPatient();
    } catch (err) {
      toast.error(err.message || 'Failed to record vitals.');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!patient) return null;

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000)
    : '-';

  // Helper for checking abnormal vitals
  const checkVitalsAlert = (vital) => {
    const alerts = [];
    if (vital.temperature > 38.0) alerts.push('Fever (>38°C)');
    if (vital.temperature < 35.0) alerts.push('Hypothermia (<35°C)');
    if (vital.spo2 < 95) alerts.push('Low Oxygen Saturation (<95% SPO2)');
    if (vital.pulseRate > 100) alerts.push('Tachycardia (>100 bpm)');
    if (vital.pulseRate < 60) alerts.push('Bradycardia (<60 bpm)');
    
    // BP parsing (e.g. 140/90)
    const bpParts = vital.bloodPress.split('/');
    if (bpParts.length === 2) {
      const systolic = parseInt(bpParts[0]);
      const diastolic = parseInt(bpParts[1]);
      if (systolic >= 140 || diastolic >= 90) alerts.push('Hypertension (≥140/90)');
      if (systolic < 90 || diastolic < 60) alerts.push('Hypotension (<90/60)');
    }
    return alerts;
  };

  return (
    <div>
      {/* Header & Back Button */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/patients')} style={{ padding: 8 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Patient Details</h2>
            <p className="text-sm text-muted">ID: {patient.patientId}</p>
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-50)', letterSpacing: 0.5 }}>Demographics</h4>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{patient.firstName} {patient.lastName}</div>
              <div style={{ marginTop: 4, fontSize: 14 }}>{patient.gender} · {age} years</div>
              <div style={{ marginTop: 4, fontSize: 14, color: 'var(--gray-500)' }}>DOB: {formatDate(patient.dateOfBirth)}</div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-50)', letterSpacing: 0.5 }}>Contact Details</h4>
              <div style={{ marginTop: 8, fontSize: 14 }}>📞 {patient.phone}</div>
              <div style={{ marginTop: 4, fontSize: 14 }}>✉️ {patient.email || 'No email registered'}</div>
              <div style={{ marginTop: 4, fontSize: 14, color: 'var(--gray-500)' }}>📍 {patient.address || 'No address provided'}</div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-50)', letterSpacing: 0.5 }}>Clinical Remarks</h4>
              <div style={{ marginTop: 8, fontSize: 14, color: patient.allergies ? 'var(--danger)' : 'inherit' }}>
                ⚠️ <strong>Allergies:</strong> {patient.allergies || 'None reported'}
              </div>
              <div style={{ marginTop: 4, fontSize: 14 }}>
                📋 <strong>History:</strong> {patient.medicalHistory || 'No medical history reported'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="settings-layout" style={{ gridTemplateColumns: '220px 1fr' }}>
        <div className="settings-sidebar">
          {tabs.map(tab => (
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
          {/* 1. Clinical Vitals Tab */}
          {activeTab === 'vitals' && (
            <div className="card">
              <div className="card-header">
                <h3>Vitals Monitoring History</h3>
                {canRecordVitals && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowVitalModal(true)}>
                    <Plus size={16} /> Record Vitals
                  </button>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Recorded Date</th>
                      <th>Temp (°C)</th>
                      <th>BP (mmHg)</th>
                      <th>Pulse (bpm)</th>
                      <th>SPO2 (%)</th>
                      <th>Weight (kg)</th>
                      <th>Recorded By</th>
                      <th>Health Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patient.vitals || []).map((v) => {
                      const alerts = checkVitalsAlert(v);
                      return (
                        <tr key={v.id}>
                          <td>{formatDateTime(v.createdAt)}</td>
                          <td style={{ fontWeight: 600, color: v.temperature > 38.0 ? 'var(--danger)' : 'inherit' }}>
                            {v.temperature.toFixed(1)}°C
                          </td>
                          <td>{v.bloodPress}</td>
                          <td>{v.pulseRate} bpm</td>
                          <td style={{ fontWeight: 600, color: v.spo2 < 95 ? 'var(--danger)' : 'inherit' }}>
                            {v.spo2}%
                          </td>
                          <td>{v.weight ? `${v.weight} kg` : '-'}</td>
                          <td>{v.recordedBy}</td>
                          <td>
                            {alerts.length > 0 ? (
                              <span className="badge cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title={alerts.join(', ')}>
                                <AlertTriangle size={12} /> Abnormal
                              </span>
                            ) : (
                              <span className="badge completed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={12} /> Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!patient.vitals?.length && (
                      <tr>
                        <td colSpan={8} className="empty-state" style={{ padding: 32 }}>
                          No vital sign records found. Record vitals using the button above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="card">
              <div className="card-header">
                <h3>Appointments History</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patient.appointments || []).map(a => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{a.appointmentId}</td>
                        <td>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</td>
                        <td>{a.doctor?.specialization}</td>
                        <td>{formatDateTime(a.dateTime)}</td>
                        <td>{a.type}</td>
                        <td>
                          <span className={`badge ${a.status.toLowerCase().replace('_', '-')}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!patient.appointments?.length && (
                      <tr>
                        <td colSpan={6} className="empty-state" style={{ padding: 32 }}>
                          No appointments found for this patient.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Lab Reports Tab */}
          {activeTab === 'labReports' && (
            <div className="card">
              <div className="card-header">
                <h3>Lab Findings & Diagnostics</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Test Name</th>
                      <th>Ordered Date</th>
                      <th>Status</th>
                      <th>Findings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patient.labReports || []).map(r => (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.reportId}</td>
                        <td className="font-semibold">{r.testName}</td>
                        <td>{formatDate(r.testDate)}</td>
                        <td>
                          <span className={`badge ${r.status.toLowerCase().replace('_', '-')}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>
                          {r.result || 'Awaiting laboratory completion.'}
                        </td>
                      </tr>
                    ))}
                    {!patient.labReports?.length && (
                      <tr>
                        <td colSpan={5} className="empty-state" style={{ padding: 32 }}>
                          No lab test history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="card">
              <div className="card-header">
                <h3>Prescribed Medications</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: 16 }}>
                  {(patient.prescriptions || []).map(prx => (
                    <div key={prx.id} className="card" style={{ marginBottom: 16, border: '1px solid var(--gray-200)' }}>
                      <div className="card-header" style={{ padding: '12px 16px' }}>
                        <div>
                          <strong>{prx.prescriptionId}</strong> · Diagnosed: {prx.diagnosis || 'General Checkup'}
                        </div>
                        <span className="text-sm text-muted">
                          {formatDate(prx.createdAt)}
                        </span>
                      </div>
                      <div className="card-body" style={{ padding: 16 }}>
                        <table style={{ border: 'none' }}>
                          <thead>
                            <tr style={{ background: 'none' }}>
                              <th style={{ padding: '6px 0' }}>Medicine Name</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(prx.items || []).map(item => (
                              <tr key={item.id} style={{ background: 'none' }}>
                                <td style={{ padding: '8px 0', fontWeight: 600 }}>{item.medicine?.name}</td>
                                <td>{item.dosage}</td>
                                <td>{item.frequency}</td>
                                <td>{item.duration} Days</td>
                                <td>{item.instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {prx.notes && (
                          <div style={{ marginTop: 12, padding: 8, background: 'var(--gray-50)', borderRadius: 4, fontSize: 13 }}>
                            💬 <strong>Doctor Notes:</strong> {prx.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!patient.prescriptions?.length && (
                    <div className="empty-state" style={{ padding: 32 }}>
                      No prescription history found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Billing Invoices Tab */}
          {activeTab === 'billing' && (
            <div className="card">
              <div className="card-header">
                <h3>Invoices & Billing History</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Paid Amount</th>
                      <th>Balance Due</th>
                      <th>Method</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(patient.billings || []).map(inv => {
                      const balance = inv.totalAmount - inv.paidAmount;
                      return (
                        <tr key={inv.id}>
                          <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceId}</td>
                          <td>{formatDate(inv.createdAt)}</td>
                          <td>₹{inv.totalAmount.toLocaleString()}</td>
                          <td style={{ color: 'var(--success)' }}>₹{inv.paidAmount.toLocaleString()}</td>
                          <td style={{ color: balance > 0 ? 'var(--danger)' : 'inherit', fontWeight: 600 }}>
                            ₹{balance.toLocaleString()}
                          </td>
                          <td>{inv.paymentMethod || '-'}</td>
                          <td>
                            <span className={`badge ${inv.status.toLowerCase()}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!patient.billings?.length && (
                      <tr>
                        <td colSpan={7} className="empty-state" style={{ padding: 32 }}>
                          No invoice billing records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Vitals Dialog Modal */}
      {showVitalModal && (
        <div className="modal-overlay" onClick={() => setShowVitalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Record Patient Vital Signs</h3>
              <button className="btn-icon" onClick={() => setShowVitalModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddVitals}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Body Temperature (°C) *</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 36.8"
                      className="form-input"
                      value={vitalForm.temperature}
                      onChange={e => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Pressure (mmHg) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 120/80"
                      className="form-input"
                      value={vitalForm.bloodPress}
                      onChange={e => setVitalForm({ ...vitalForm, bloodPress: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pulse Rate (bpm) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      className="form-input"
                      value={vitalForm.pulseRate}
                      onChange={e => setVitalForm({ ...vitalForm, pulseRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SPO2 Level (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 98"
                      className="form-input"
                      value={vitalForm.spo2}
                      onChange={e => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 68.5"
                    className="form-input"
                    value={vitalForm.weight}
                    onChange={e => setVitalForm({ ...vitalForm, weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowVitalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vitals</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
