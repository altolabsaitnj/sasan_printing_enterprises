import { useEffect, useState } from 'react'
import api from '../services/api'

const empty = { username:'', name:'', password:'', role:'cashier', isActive: true }

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(empty)

  const load = () => api.get('/users').then(r => setUsers(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (u: any) => { setEditing(u); setForm({ username:u.username, name:u.name||'', password:'', role:u.role, isActive:u.isActive }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) await api.put(`/users/${editing.id}`, payload)
      else await api.post('/users', payload)
      setShowModal(false); load()
    } catch (err: any) { alert(err.response?.data?.message || 'Error') }
  }

  const del = async (id: number) => {
    if (!confirm('Delete user?')) return
    await api.delete(`/users/${id}`); load()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm((prev: any) => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Users</h4>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-1"></i>Add User</button>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td><code>{u.username}</code></td>
                  <td>{u.name}</td>
                  <td><span className={`badge ${u.role==='admin'?'bg-danger':'bg-primary'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.isActive?'bg-success':'bg-secondary'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(u.id)}><i className="bi bi-trash"></i></button>
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
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} User</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={f('username')} required /></div>
                  <div className="mb-3"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={f('name')} /></div>
                  <div className="mb-3"><label className="form-label">{editing ? 'New Password (blank = keep)' : 'Password *'}</label>
                    <input type="password" className="form-control" value={form.password} onChange={f('password')} required={!editing} /></div>
                  <div className="mb-3"><label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={f('role')}>
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select></div>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="ua" checked={form.isActive}
                      onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="ua">Active</label>
                  </div>
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
    </div>
  )
}
