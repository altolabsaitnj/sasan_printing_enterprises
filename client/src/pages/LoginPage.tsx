import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { login, clearError } from '../store/slices/authSlice'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useAppSelector(s => s.auth)
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' })

  useEffect(() => { if (token) navigate('/') }, [token])
  useEffect(() => () => { dispatch(clearError()) }, [])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ width: 400 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-shop display-4 text-primary"></i>
            <h3 className="mt-2 fw-bold">POS System</h3>
            <p className="text-muted small">SQL Server Edition</p>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={e => { e.preventDefault(); dispatch(login(form)) }}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input className="form-control" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              Sign In
            </button>
          </form>
          <div className="mt-3 text-center text-muted small">
            <div>admin / admin123 &nbsp;|&nbsp; cashier / cashier123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
