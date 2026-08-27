import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search, Plus, X } from 'lucide-react';

export default function Doctors() {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', specialization: '', phone: '', email: '', qualification: '', consultationFee: '', status: 'ACTIVE' });

  const load = () => {
    setLoading(true);
    api.getDoctors(search ? `search=${search}` : '')
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEditing(null); setForm({ firstName: '', lastName: '', specialization: '', phone: '', email: '', qualification: '', consultationFee: '', status: 'ACTIVE' }); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ firstName: d.firstName, lastName: d.lastName, specialization: d.specialization, phone: d.phone, email: d.email, qualification: d.qualification || '', consultationFee: d.consultationFee || '', status: d.status }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updateDoctor(editing.id, form);
      else await api.createDoctor(form);
      setShowModal(false); load();
      toast.success(editing ? 'Doctor updated successfully' : 'Doctor added successfully');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Doctors</h2>
          <p className="text-sm text-muted">{doctors.length} doctors registered</p>
        </div>
        <div className="flex gap-3">
          <div className="search-bar"><Search /><input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Doctor</button>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {doctors.map(d => (
            <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEdit(d)}>
              <div className="card-body">
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                    {d.firstName[0]}{d.lastName[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold" style={{ fontSize: 16 }}>Dr. {d.firstName} {d.lastName}</div>
                    <div className="text-sm text-muted">{d.specialization}</div>
                  </div>
                  <span className={`badge ${d.status.toLowerCase().replace('_', '-')}`}>{d.status.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><span className="text-muted">ID:</span> <strong>{d.doctorId}</strong></div>
                  <div><span className="text-muted">Fee:</span> <strong>₹{d.consultationFee}</strong></div>
                  <div><span className="text-muted">Phone:</span> {d.phone}</div>
                  <div><span className="text-muted">Qual:</span> {d.qualification || 'N/A'}</div>
                </div>
              </div>
            </div>
          ))}
          {!doctors.length && <div className="empty-state"><h3>No doctors found</h3></div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Specialization *</label><input className="form-input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Qualification</label><input className="form-input" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Consultation Fee (₹)</label><input type="number" className="form-input" value={form.consultationFee} onChange={e => setForm({...form, consultationFee: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="ACTIVE">Active</option><option value="ON_LEAVE">On Leave</option><option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
