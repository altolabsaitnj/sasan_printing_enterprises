import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from './hooks/redux'
import { fetchSettings } from './store/slices/settingsSlice'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import POSScreen from './pages/POSScreen'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Users from './pages/Users'

function Guard({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, token } = useAppSelector(s => s.auth)
  if (!token || !user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const dispatch = useAppDispatch()
  const { theme } = useAppSelector(s => s.settings)
  const { token } = useAppSelector(s => s.auth)

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { if (token) dispatch(fetchSettings()) }, [token])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POSScreen />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Guard adminOnly><Settings /></Guard>} />
          <Route path="users" element={<Guard adminOnly><Users /></Guard>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
