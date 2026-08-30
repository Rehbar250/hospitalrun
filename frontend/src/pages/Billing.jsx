import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/rbac';
import { Plus, X, CreditCard } from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState({ invoices: [], total: 0 });
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'CASH' });
  const [form, setForm] = useState({ patientId: '', paymentMethod: 'CASH', items: [{ description: '', amount: '', quantity: 1, type: 'OTHER' }] });

  const canManageBilling = hasRole(user, ROLES.ADMIN, ROLES.RECEPTIONIST);

  const load = () => {
    setLoading(true);
    api.getBilling(statusFilter ? `status=${statusFilter}` : '').then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { api.getPatients().then(d => setPatients(d.patients)).catch(console.error); }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: '', quantity: 1, type: 'OTHER' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => { const items = [...form.items]; items[i][field] = val; setForm({ ...form, items }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.createBilling(form); setShowModal(false); load(); toast.success('Invoice created successfully'); } catch (err) { toast.error(err.message); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try { await api.recordPayment(showPayModal.id, payForm); setShowPayModal(null); load(); toast.success('Payment recorded successfully'); } catch (err) { toast.error(err.message); }
  };

  const calcTotal = () => form.items.reduce((s, i) => s + (parseFloat(i.amount || 0) * parseInt(i.quantity || 1)), 0);
  const itemTypes = ['CONSULTATION', 'LAB_TEST', 'MEDICINE', 'PROCEDURE', 'OTHER'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Billing</h2>
          <p className="text-sm text-muted">{data.total} invoices</p>
        </div>
        <div className="flex gap-3">
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="CANCELLED">Cancelled</option>
          </select>
          {canManageBilling && (
            <button className="btn btn-primary" onClick={() => { setForm({ patientId: '', paymentMethod: 'CASH', items: [{ description: '', amount: '', quantity: 1, type: 'OTHER' }] }); setShowModal(true); }}><Plus size={18} /> New Invoice</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <table>
              <thead><tr><th>Invoice ID</th><th>Patient</th><th>Total</th><th>Paid</th><th>Balance</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceId}</td>
                    <td className="font-semibold">{inv.patient?.firstName} {inv.patient?.lastName}</td>
                    <td>₹{Number(inv.totalAmount).toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>₹{Number(inv.paidAmount).toLocaleString()}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>₹{(Number(inv.totalAmount) - Number(inv.paidAmount)).toLocaleString()}</td>
                    <td>{inv.paymentMethod || '-'}</td>
                    <td><span className={`badge ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                    <td>
                      {canManageBilling && inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                        <button className="btn btn-success btn-sm" onClick={() => { setShowPayModal(inv); setPayForm({ amount: Number(inv.totalAmount) - Number(inv.paidAmount), paymentMethod: inv.paymentMethod || 'CASH' }); }}>
                          <CreditCard size={14} /> Pay
                        </button>
                      ) : (
                        <span className="text-sm text-muted">{inv.status === 'PAID' ? 'Settled' : 'View Only'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!data.invoices.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No invoices found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header"><h3>New Invoice</h3><button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Patient *</label>
                    <select className="form-select" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} required>
                      <option value="">Select</option>{patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Payment Method</label>
                    <select className="form-select" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      <option value="CASH">Cash</option><option value="CARD">Card</option><option value="UPI">UPI</option><option value="INSURANCE">Insurance</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="flex justify-between items-center mb-4">
                    <label className="form-label" style={{ margin: 0 }}>Line Items</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                      <div><label className="form-label">Description</label><input className="form-input" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required /></div>
                      <div><label className="form-label">Amount (₹)</label><input type="number" className="form-input" value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} required /></div>
                      <div><label className="form-label">Qty</label><input type="number" className="form-input" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" /></div>
                      <div><label className="form-label">Type</label><select className="form-select" value={item.type} onChange={e => updateItem(i, 'type', e.target.value)}>{itemTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
                      <button type="button" className="btn-icon" onClick={() => removeItem(i)} style={{ marginBottom: 4 }}><X size={16} /></button>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 800, marginTop: 12, color: 'var(--primary)' }}>Total: ₹{calcTotal().toLocaleString()}</div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Invoice</button></div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header"><h3>Record Payment — {showPayModal.invoiceId}</h3><button className="btn-icon" onClick={() => setShowPayModal(null)}><X size={20} /></button></div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <p className="text-sm mb-4">Balance: <strong style={{ color: 'var(--danger)' }}>₹{(Number(showPayModal.totalAmount) - Number(showPayModal.paidAmount)).toLocaleString()}</strong></p>
                <div className="form-group"><label className="form-label">Amount (₹) *</label><input type="number" step="0.01" className="form-input" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Payment Method</label>
                  <select className="form-select" value={payForm.paymentMethod} onChange={e => setPayForm({...payForm, paymentMethod: e.target.value})}>
                    <option value="CASH">Cash</option><option value="CARD">Card</option><option value="UPI">UPI</option><option value="INSURANCE">Insurance</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowPayModal(null)}>Cancel</button><button type="submit" className="btn btn-success">Confirm Payment</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
