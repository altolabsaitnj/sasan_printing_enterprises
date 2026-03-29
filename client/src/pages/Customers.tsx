import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAppSelector } from '../hooks/redux'

const empty = { name:'', phone:'', email:'', address:'' }

export default function Customers() {
  const { data: settings } = useAppSelector(s => s.settings)
  const cur = settings.currency || '₹'
  const [customers, setCustomers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [history, setHistory] = useState<any>(null)

  const load = () => api.get('/customers').then(r => setCustomers(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (c: any) => { setEditing(c); setForm({ name:c.name, phone:c.phone||'', email:c.email||'', address:c.address||'' }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form)
      else await api.post('/customers', form)
      setShowModal(false); load()
    } catch (err: any) { alert(err.response?.data?.message || 'Error') }
  }

  const del = async (id: number) => {
    if (!confirm('Delete customer?')) return
    await api.delete(`/customers/${id}`); load()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Customers</h4>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-1"></i>Add Customer</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>Total Purchases</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.name}</td>
                  <td>{c.phone||'—'}</td>
                  <td>{c.email||'—'}</td>
                  <td className="fw-bold text-success">{cur}{Number(c.total_purchases).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={async () => { const {data} = await api.get(`/customers/${c.id}`); setHistory(data) }}><i className="bi bi-clock-history"></i></button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(c)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(c.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background:'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Customer</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={f('name')} required /></div>
                  <div className="mb-3"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={f('phone')} /></div>
                  <div className="mb-3"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={f('email')} /></div>
                  <div className="mb-3"><label className="form-label">Address</label><textarea className="form-control" rows={2} value={form.address} onChange={f('address')} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {history && (
        <div className="modal show d-block" style={{ background:'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Purchase History – {history.name}</h5>
                <button className="btn-close" onClick={() => setHistory(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col"><strong>Phone:</strong> {history.phone||'—'}</div>
                  <div className="col"><strong>Email:</strong> {history.email||'—'}</div>
                  <div className="col"><strong>Total:</strong> {cur}{Number(history.total_purchases).toFixed(2)}</div>
                </div>
                <table className="table table-sm">
                  <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Payment</th></tr></thead>
                  <tbody>
                    {history.orders?.map((o: any) => (
                      <tr key={o.id}>
                        <td><code>{o.order_number}</code></td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>{cur}{Number(o.total).toFixed(2)}</td>
                        <td>{o.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
