import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { fetchSettings } from '../store/slices/settingsSlice'

export default function Settings() {
  const dispatch = useAppDispatch()
  const { data } = useAppSelector(s => s.settings)
  const [form, setForm] = useState<any>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(data) }, [data])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put('/settings', form)
      dispatch(fetchSettings())
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { alert(err.response?.data?.message || 'Error') }
  }

  const field = (key: string, label: string, type = 'text') => (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input type={type} className="form-control" value={form[key]||''}
        onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div>
      <h4 className="fw-bold mb-4">Settings</h4>
      {saved && <div className="alert alert-success">Settings saved!</div>}
      <form onSubmit={save}>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3"><i className="bi bi-shop me-2"></i>Store Info</h6>
                {field('storeName','Store Name')}
                {field('storeAddress','Address')}
                {field('storePhone','Phone')}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3"><i className="bi bi-percent me-2"></i>Tax & Currency</h6>
                {field('currency','Currency Symbol')}
                {field('taxRate','GST/Tax Rate (%)', 'number')}
                <div className="mb-3">
                  <label className="form-label">Receipt Footer</label>
                  <textarea className="form-control" rows={3} value={form.receiptFooter||''}
                    onChange={e => setForm((f: any) => ({ ...f, receiptFooter: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-primary"><i className="bi bi-save me-1"></i>Save Settings</button>
        </div>
      </form>
    </div>
  )
}
