import { useEffect, useState } from 'react'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import api from '../services/api'
import { useAppSelector } from '../hooks/redux'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const { data: s } = useAppSelector(st => st.settings)
  const cur = s.currency || '₹'
  const [summary, setSummary] = useState<any>(null)
  const [daily, setDaily] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/daily?days=14'),
      api.get('/reports/top-products?limit=5'),
      api.get('/reports/payment-breakdown'),
      api.get('/products/low-stock'),
    ]).then(([a,b,c,d,e]) => {
      setSummary(a.data); setDaily(b.data); setTop(c.data); setPayments(d.data); setLowStock(e.data)
    }).catch(() => {})
  }, [])

  const cards = [
    { label: "Today's Sales", val: summary?.today?.count||0, sub: `${cur}${Number(summary?.today?.revenue||0).toFixed(2)}`, icon:'bi-cart-check', color:'primary' },
    { label: 'This Week',     val: summary?.week?.count||0,  sub: `${cur}${Number(summary?.week?.revenue||0).toFixed(2)}`,  icon:'bi-calendar-week', color:'success' },
    { label: 'This Month',    val: summary?.month?.count||0, sub: `${cur}${Number(summary?.month?.revenue||0).toFixed(2)}`, icon:'bi-calendar-month', color:'info' },
    { label: 'Low Stock',     val: lowStock.length,          sub: 'Items need restock', icon:'bi-exclamation-triangle', color:'warning' },
  ]

  return (
    <div>
      <h4 className="fw-bold mb-4">Dashboard</h4>
      <div className="row g-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="col-md-3">
            <div className={`card border-0 bg-${c.color} bg-opacity-10`}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${c.color} bg-opacity-25 p-3`}>
                  <i className={`bi ${c.icon} fs-4 text-${c.color}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{c.label}</div>
                  <div className="fw-bold fs-4">{c.val}</div>
                  <div className="text-muted small">{c.sub}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Revenue (Last 14 Days)</h6>
              <Line data={{ labels: daily.map(d=>d.date), datasets:[{ label:'Revenue', data: daily.map(d=>Number(d.revenue)), borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,.1)', fill:true, tension:.4 }] }}
                options={{ responsive:true, plugins:{ legend:{ display:false } } }} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Payment Methods</h6>
              {payments.length > 0
                ? <Doughnut data={{ labels: payments.map(p=>p.payment_method?.toUpperCase()), datasets:[{ data: payments.map(p=>Number(p.total)), backgroundColor:['#0d6efd','#198754','#ffc107'] }] }} />
                : <p className="text-muted text-center mt-4">No data yet</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Top Products</h6>
              {top.length > 0
                ? <Bar data={{ labels: top.map(p=>p.product_name), datasets:[{ label:'Units Sold', data: top.map(p=>Number(p.total_qty)), backgroundColor:['#0d6efd','#198754','#0dcaf0','#ffc107','#dc3545'] }] }}
                    options={{ responsive:true, plugins:{ legend:{ display:false } } }} />
                : <p className="text-muted text-center mt-4">No data yet</p>}
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock</h6>
              {lowStock.length === 0
                ? <p className="text-muted">All products well stocked</p>
                : <div className="list-group list-group-flush">
                    {lowStock.slice(0,8).map((p:any) => (
                      <div key={p.id} className="list-group-item d-flex justify-content-between px-0">
                        <span className="small">{p.name}</span>
                        <span className="badge bg-warning text-dark">{p.stock} left</span>
                      </div>
                    ))}
                  </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
