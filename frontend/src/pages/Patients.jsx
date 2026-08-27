import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search, Plus, X, UserPlus, Eye } from 'lucide-react';

export default function Patients() {
  const toast = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });

  const load = () => {
    setLoading(true);
    api.getPatients(search ? `search=${search}` : '')
      .then(data => { setPatients(data.patients); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dateOfBirth?.split('T')[0] || '', gender: p.gender, phone: p.phone, email: p.email || '', address: p.address || '', allergies: p.allergies || '', medicalHistory: p.medicalHistory || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updatePatient(editing.id, form);
      else await api.createPatient(form);
      setShowModal(false);
      load();
      toast.success(editing ? 'Patient updated successfully' : 'Patient added successfully');
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try { await api.deletePatient(id); load(); toast.success('Patient deleted successfully'); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Patients</h2>
          <p className="text-sm text-muted">{total} total patients</p>
        </div>
        <div className="flex gap-3">
          <div className="search-bar">
            <Search />
            <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Patient</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th><th>Name</th><th>Gender</th><th>Phone</th>
                  <th>Age</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold" style={{ color: 'var(--primary)' }}>{p.patientId}</td>
                    <td className="font-semibold">{p.firstName} {p.lastName}</td>
                    <td>{p.gender}</td>
                    <td>{p.phone}</td>
                    <td>{p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / 31557600000) : '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/patients/${p.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> View</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!patients.length && <tr><td colSpan={6} className="empty-state">No patients found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <textarea className="form-textarea" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Medical History</label>
                  <textarea className="form-textarea" value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
