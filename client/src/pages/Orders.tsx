import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import { useAppSelector } from '../hooks/redux'
import Receipt from '../components/Receipt'
import { useReactToPrint } from 'react-to-print'

export default function Orders() {
  const { data: settings } = useAppSelector(s => s.settings)
  const cur = settings.currency || '₹'
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pmFilter, setPmFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ content: () => receiptRef.current })

  const load = async () => {
    const p = new URLSearchParams({ page: String(page), limit: '20' })
    if (startDate) p.set('startDate', startDate)
    if (endDate) p.set('endDate', endDate)
    if (pmFilter) p.set('payment_method', pmFilter)
    const { data } = await api.get(`/orders?${p}`)
    setOrders(data.orders); setTotal(data.total)
  }

  useEffect(() => { load() }, [page, startDate, endDate, pmFilter])

  const view = async (id: number) => {
    const { data } = await api.get(`/orders/${id}`)
    setSelected(data)
  }

  return (
    <div>
      <h4 className="fw-bold mb-4">Orders</h4>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-3"><input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="col-md-3"><input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            <div className="col-md-2">
              <select className="form-select" value={pmFilter} onChange={e => setPmFilter(e.target.value)}>
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary" onClick={() => { setStartDate(''); setEndDate(''); setPmFilter('') }}>Clear</button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td><code>{o.order_number}</code></td>
                    <td className="small">{new Date(o.created_at).toLocaleString()}</td>
                    <td>{o.customer_name || 'Walk-in'}</td>
                    <td>{o.item_count}</td>
                    <td className="fw-bold">{cur}{Number(o.total).toFixed(2)}</td>
                    <td><span className="badge bg-info text-dark">{o.payment_method?.toUpperCase()}</span></td>
                    <td><span className={`badge ${o.status==='completed'?'bg-success':'bg-warning text-dark'}`}>{o.status}</span></td>
                    <td><button className="btn btn-sm btn-outline-primary" onClick={() => view(o.id)}><i className="bi bi-eye"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Total: {total}</span>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={page===1} onClick={() => setPage(p=>p-1)}>Prev</button>
              <button className="btn btn-outline-secondary" disabled={orders.length<20} onClick={() => setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal show d-block" style={{ background:'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Invoice – {selected.order_number}</h6>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                <div ref={receiptRef}><Receipt order={selected} settings={settings} /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary btn-sm" onClick={handlePrint}><i className="bi bi-printer me-1"></i>Print</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
