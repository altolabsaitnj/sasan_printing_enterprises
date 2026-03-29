import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { logout } from '../store/slices/authSlice'
import { toggleTheme } from '../store/slices/settingsSlice'

const nav = [
  { to: '/', icon: 'bi-speedometer2', label: 'Dashboard', exact: true },
  { to: '/pos', icon: 'bi-cart3', label: 'POS Billing' },
  { to: '/products', icon: 'bi-box-seam', label: 'Products' },
  { to: '/orders', icon: 'bi-receipt', label: 'Orders' },
  { to: '/customers', icon: 'bi-people', label: 'Customers' },
  { to: '/reports', icon: 'bi-bar-chart-line', label: 'Reports' },
  { to: '/users', icon: 'bi-person-gear', label: 'Users', admin: true },
  { to: '/settings', icon: 'bi-gear', label: 'Settings', admin: true },
]

export default function Layout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const { theme, data: settings } = useAppSelector(s => s.settings)

  return (
    <div className="d-flex">
      <nav className="sidebar d-flex flex-column py-3">
        <div className="px-3 mb-3">
          <h5 className="text-white fw-bold mb-0">
            <i className="bi bi-shop me-2 text-primary"></i>
            {settings.storeName || 'POS'}
          </h5>
        </div>
        <ul className="nav flex-column flex-grow-1">
          {nav.filter(n => !n.admin || user?.role === 'admin').map(item => (
            <li key={item.to} className="nav-item">
              <NavLink to={item.to} end={item.exact}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <i className={`bi ${item.icon} me-2`}></i>{item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="px-3 mt-auto">
          <div className="text-muted small mb-2">
            <i className="bi bi-person-circle me-1"></i>
            <span className="text-white">{user?.name || user?.username}</span>
            <span className="badge bg-secondary ms-1">{user?.role}</span>
          </div>
          <button className="btn btn-sm btn-outline-secondary w-100 mb-1" onClick={() => dispatch(toggleTheme())}>
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} me-1`}></i>
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button className="btn btn-sm btn-outline-danger w-100"
            onClick={() => { dispatch(logout()); navigate('/login') }}>
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </nav>

      <div className="main-content flex-grow-1">
        <nav className="navbar bg-white border-bottom px-4 sticky-top" style={{ height: 'var(--nav-h)' }}>
          <Clock />
          <span className="ms-auto text-muted small">
            <i className="bi bi-database me-1 text-success"></i>SQL Server
          </span>
        </nav>
        <div className="p-4"><Outlet /></div>
      </div>
    </div>
  )
}

function Clock() {
  const [t, setT] = React.useState(new Date())
  React.useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return <span className="text-muted small"><i className="bi bi-clock me-1"></i>{t.toLocaleDateString()} {t.toLocaleTimeString()}</span>
}

import React from 'react'
