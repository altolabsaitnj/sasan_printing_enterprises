import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAppSelector } from '../hooks/redux'

const empty = { name:'', barcode:'', category:'', price:'', cost_price:'', stock:'', low_stock_alert:'10' }

export default function Products() {
  const { user } = useAppSelector(s => s.auth)
  const { data: settings } = useAppSelector(s => s.settings)
  const cur = settings.currency || '₹'
  const isAdmin = user?.role === 'admin'

  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(empty)
  const [imgFile, setImgFile] = useState<File|null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const p = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) p.set('search', search)
    const { data } = await api.get(`/products?${p}`)
    setProducts(data.products); setTotal(data.total)
  }

  useEffect(() => { load() }, [search, page])

  const openCreate = () => { setEditing(null); setForm(empty); setImgFile(null); setShowModal(true) }
  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ name:p.name, barcode:p.barcode||'', category:p.category||'', price:p.price, cost_price:p.cost_price||'', stock:p.stock, low_stock_alert:p.low_stock_alert||10 })
    setImgFile(null); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)))
      if (imgFile) fd.append('image', imgFile)
      if (editing) await api.put(`/products/${editing.id}`, fd)
      else await api.post('/products', fd)
      setShowModal(false); load()
    } catch (err: any) { alert(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Delete product?')) return
    await api.delete(`/products/${id}`); load()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm((prev: any) => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Products</h4>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-1"></i>Add Product</button>}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <input className="form-control" placeholder="Search name or barcode..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr><th>Product</th><th>Barcode</th><th>Category</th><th>Price</th><th>Stock</th>{isAdmin && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {p.image
                          ? <img src={p.image} alt="" style={{ width:36, height:36, objectFit:'cover', borderRadius:4 }} />
                          : <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width:36, height:36 }}><i className="bi bi-box-seam text-muted"></i></div>}
                        <span className="fw-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td><code>{p.barcode||'—'}</code></td>
                    <td>{p.category||'—'}</td>
                    <td>{cur}{Number(p.price).toFixed(2)}</td>
                    <td><span className={`badge ${p.stock===0?'bg-danger':p.stock<=p.low_stock_alert?'bg-warning text-dark':'bg-success'}`}>{p.stock}</span></td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(p)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => del(p.id)}><i className="bi bi-trash"></i></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">{total} products</span>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={page===1} onClick={() => setPage(p=>p-1)}>Prev</button>
              <button className="btn btn-outline-secondary" disabled={products.length<20} onClick={() => setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background:'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit' : 'Add'} Product</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label">Name *</label>
                      <input className="form-control" value={form.name} onChange={f('name')} required /></div>
                    <div className="col-md-6"><label className="form-label">Barcode</label>
                      <input className="form-control" value={form.barcode} onChange={f('barcode')} /></div>
                    <div className="col-md-4"><label className="form-label">Category</label>
                      <input className="form-control" value={form.category} onChange={f('category')} /></div>
                    <div className="col-md-4"><label className="form-label">Selling Price *</label>
                      <input type="number" step="0.01" className="form-control" value={form.price} onChange={f('price')} required /></div>
                    <div className="col-md-4"><label className="form-label">Cost Price</label>
                      <input type="number" step="0.01" className="form-control" value={form.cost_price} onChange={f('cost_price')} /></div>
                    <div className="col-md-4"><label className="form-label">Stock</label>
                      <input type="number" className="form-control" value={form.stock} onChange={f('stock')} /></div>
                    <div className="col-md-4"><label className="form-label">Low Stock Alert</label>
                      <input type="number" className="form-control" value={form.low_stock_alert} onChange={f('low_stock_alert')} /></div>
                    <div className="col-md-4"><label className="form-label">Image</label>
                      <input type="file" className="form-control" accept="image/*" onChange={e => setImgFile(e.target.files?.[0]||null)} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm me-1" />}
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
