import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/rbac';
import { Search, Plus, X, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/format';

export default function Pharmacy() {
  const { user } = useAuth();
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', manufacturer: '', category: '', price: '', stock: '', expiryDate: '', description: '' });

  const canManageStock = hasRole(user, ROLES.ADMIN, ROLES.PHARMACIST);

  const load = () => {
    setLoading(true);
    api.getMedicines(search ? `search=${search}` : '')
      .then(setMedicines).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEditing(null); setForm({ name: '', manufacturer: '', category: '', price: '', stock: '', expiryDate: '', description: '' }); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ name: m.name, manufacturer: m.manufacturer || '', category: m.category || '', price: m.price || '', stock: m.stock || '', expiryDate: m.expiryDate?.split('T')[0] || '', description: m.description || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updateMedicine(editing.id, form);
      else await api.createMedicine(form);
      setShowModal(false); load();
      toast.success(editing ? 'Medicine updated successfully' : 'Medicine added successfully');
    } catch (err) { toast.error(err.message); }
  };

  const lowStock = medicines.filter(m => m.stock <= 10);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Pharmacy</h2>
          <p className="text-sm text-muted">{medicines.length} medicines in inventory</p>
        </div>
        <div className="flex gap-3">
          <div className="search-bar"><Search /><input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {canManageStock && (
            <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Medicine</button>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: 'var(--warning-light)', border: '1px solid #fbbf24', borderRadius: 'var(--border-radius-sm)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="var(--warning)" />
          <span style={{ fontSize: 14, color: 'var(--warning)' }}><strong>{lowStock.length} medicine(s)</strong> with low stock (≤10 units)</span>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Manufacturer</th><th>Price</th><th>Stock</th><th>Expiry</th><th>Actions</th></tr></thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold">{m.name}</td>
                    <td><span className="badge active">{m.category || 'General'}</span></td>
                    <td>{m.manufacturer || 'N/A'}</td>
                    <td>₹{m.price}</td>
                    <td>
                      <span style={{ color: m.stock <= 10 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                        {m.stock} {m.stock <= 10 && '⚠️'}
                      </span>
                    </td>
                    <td>{m.expiryDate ? formatDate(m.expiryDate) : 'N/A'}</td>
                    <td>
                      {canManageStock ? (
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      ) : (
                        <span className="text-sm text-muted">Catalog</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!medicines.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No medicines found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Medicine' : 'Add Medicine'}</h3><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Manufacturer</label><input className="form-input" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Price (₹)</label><input type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Stock</label><input type="number" className="form-input" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Expiry Date</label><input type="date" className="form-input" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Medicine'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
