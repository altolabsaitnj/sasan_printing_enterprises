import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import api from '../services/api'
import { useAppSelector } from '../hooks/redux'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function Reports() {
  const { data: settings } = useAppSelector(s => s.settings)
  const cur = settings.currency || '₹'
  const [daily, setDaily] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [days, setDays] = useState(30)

  useEffect(() => {
    api.get(`/reports/daily?days=${days}`).then(r => setDaily(r.data))
    api.get('/reports/top-products?limit=10').then(r => setTop(r.data))
  }, [days])

  const totalRev = daily.reduce((s, d) => s + Number(d.revenue), 0)
  const totalOrd = daily.reduce((s, d) => s + Number(d.orders), 0)

  const exportCSV = () => {
    const rows = [['Date','Orders','Revenue'], ...daily.map(d => [d.date, d.orders, d.revenue])]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'sales-report.csv'; a.click()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Reports</h4>
        <button className="btn btn-outline-success" onClick={exportCSV}><i className="bi bi-download me-1"></i>Export CSV</button>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label:'Total Revenue', val:`${cur}${totalRev.toFixed(2)}`, color:'primary' },
          { label:'Total Orders',  val:totalOrd, color:'success' },
          { label:'Avg Order',     val:`${cur}${(totalOrd ? totalRev/totalOrd : 0).toFixed(2)}`, color:'info' },
        ].map(c => (
          <div key={c.label} className="col-md-4">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="text-muted small">{c.label}</div>
              <div className={`fw-bold fs-4 text-${c.color}`}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Daily Sales Trend</h6>
            <div className="btn-group btn-group-sm">
              {[7,14,30,90].map(d => (
                <button key={d} className={`btn ${days===d?'btn-primary':'btn-outline-primary'}`} onClick={() => setDays(d)}>{d}d</button>
              ))}
            </div>
          </div>
          <Line data={{
            labels: daily.map(d => d.date),
            datasets: [
              { label:`Revenue (${cur})`, data: daily.map(d => Number(d.revenue)), borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,.1)', fill:true, tension:.4, yAxisID:'y' },
              { label:'Orders', data: daily.map(d => Number(d.orders)), borderColor:'#198754', backgroundColor:'rgba(25,135,84,.1)', fill:true, tension:.4, yAxisID:'y1' },
            ]
          }} options={{ responsive:true, interaction:{ mode:'index', intersect:false },
            scales: {
              y:  { type:'linear', position:'left',  title:{ display:true, text:`Revenue (${cur})` } },
              y1: { type:'linear', position:'right', title:{ display:true, text:'Orders' }, grid:{ drawOnChartArea:false } },
            }
          }} />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Top Products</h6>
          {top.length > 0
            ? <Bar data={{ labels: top.map(p=>p.product_name), datasets:[
                { label:'Units Sold', data: top.map(p=>Number(p.total_qty)), backgroundColor:'#0d6efd' },
                { label:`Revenue (${cur})`, data: top.map(p=>Number(p.total_revenue)), backgroundColor:'#198754' },
              ]}} options={{ responsive:true }} />
            : <p className="text-muted text-center">No data yet</p>}
        </div>
      </div>
    </div>
  )
}
