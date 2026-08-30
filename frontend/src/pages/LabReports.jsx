import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/rbac';
import { Plus, X, Eye, Edit3 } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function LabReports() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState({ reports: [], total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(null);
  const [form, setForm] = useState({ patientId: '', doctorId: '', testName: '', testDescription: '' });
  const [resultForm, setResultForm] = useState({ result: '', status: '' });

  const canOrderTests = hasRole(user, ROLES.ADMIN, ROLES.DOCTOR);
  const canEnterResults = hasRole(user, ROLES.ADMIN, ROLES.LAB_TECH);

  const load = () => {
    setLoading(true);
    api.getLabReports(statusFilter ? `status=${statusFilter}` : '').then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
    api.getPatients().then(d => setPatients(d.patients)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.createLabReport(form); setShowModal(false); load(); toast.success('Lab report created'); } catch (err) { toast.error(err.message); }
  };

  const handleResultUpdate = async (e) => {
    e.preventDefault();
    try { await api.updateLabReport(showResultModal.id, resultForm); setShowResultModal(null); load(); toast.success('Lab report updated'); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Lab Reports</h2>
          <p className="text-sm text-muted">{data.total} reports</p>
        </div>
        <div className="flex gap-3">
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option>
          </select>
          {canOrderTests && (
            <button className="btn btn-primary" onClick={() => { setForm({ patientId: '', doctorId: '', testName: '', testDescription: '' }); setShowModal(true); }}><Plus size={18} /> New Report</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Report ID</th><th>Patient</th><th>Doctor</th><th>Test</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.reports.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.reportId}</td>
                    <td className="font-semibold">{r.patient?.firstName} {r.patient?.lastName}</td>
                    <td>Dr. {r.doctor?.lastName}</td>
                    <td>{r.testName}</td>
                    <td>{formatDate(r.testDate)}</td>
                    <td><span className={`badge ${r.status.toLowerCase().replace('_', '-')}`}>{r.status.replace('_', ' ')}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowResultModal(r); setResultForm({ result: r.result || '', status: r.status }); }}>
                        {canEnterResults && r.status !== 'COMPLETED' ? 'Update' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!data.reports.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No lab reports found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Lab Report</h3><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} required>
                    <option value="">Select</option>{patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Ordering Doctor *</label>
                  <select className="form-select" value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})} required>
                    <option value="">Select</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Test Name *</label><input className="form-input" value={form.testName} onChange={e => setForm({...form, testName: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.testDescription} onChange={e => setForm({...form, testDescription: e.target.value})} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Report</button></div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="modal-overlay" onClick={() => setShowResultModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Report: {showResultModal.reportId}</h3><button className="btn-icon" onClick={() => setShowResultModal(null)}><X size={20} /></button></div>
            <form onSubmit={handleResultUpdate}>
              <div className="modal-body">
                <p className="text-sm text-muted mb-4"><strong>Test:</strong> {showResultModal.testName}</p>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={resultForm.status} onChange={e => setResultForm({...resultForm, status: e.target.value})} disabled={!canEnterResults}>
                    <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Result</label><textarea className="form-textarea" value={resultForm.result} onChange={e => setResultForm({...resultForm, result: e.target.value})} rows={4} placeholder={canEnterResults ? "Enter test results..." : "No results entered yet."} readOnly={!canEnterResults} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowResultModal(null)}>Close</button>
                {canEnterResults && <button type="submit" className="btn btn-primary">Save Results</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
