import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { addItem, removeItem, updateQty, setDiscount, setPayment, clearCart, setCustomer } from '../store/slices/cartSlice'
import api from '../services/api'
import Receipt from '../components/Receipt'
import { useReactToPrint } from 'react-to-print'

export default function POSScreen() {
  const dispatch = useAppDispatch()
  const { items, discount, taxRate, payment_method, customer_id } = useAppSelector(s => s.cart)
  const { data: settings } = useAppSelector(s => s.settings)
  const cur = settings.currency || '₹'

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [barcode, setBarcode] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ content: () => receiptRef.current })

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt = (subtotal * discount) / 100
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100
  const total = subtotal - discountAmt + taxAmt

  const loadProducts = () => api.get('/products?limit=200').then(r => {
    setProducts(r.data.products)
    const cats = [...new Set<string>(r.data.products.map((p: any) => p.category).filter(Boolean))]
    setCategories(cats)
  })

  useEffect(() => {
    loadProducts()
    api.get('/customers').then(r => setCustomers(r.data))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); barcodeRef.current?.focus() }
      if (e.key === 'F10') { e.preventDefault(); handleCheckout() }
      if (e.key === 'Escape') dispatch(clearCart())
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [items, amountPaid])

  const handleBarcodeEnter = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !barcode.trim()) return
    try {
      const { data } = await api.get(`/products/barcode/${barcode.trim()}`)
      dispatch(addItem({ product_id: data.id, name: data.name, price: Number(data.price), stock: data.stock }))
      setBarcode('')
    } catch { alert('Product not found') }
  }

  const filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    const mc = !catFilter || p.category === catFilter
    return ms && mc
  })

  const handleCheckout = async () => {
    if (items.length === 0) return alert('Cart is empty')
    const paid = parseFloat(amountPaid)
    if (payment_method === 'cash' && (!paid || paid < total)) return alert('Enter valid amount paid')
    setProcessing(true)
    try {
      const { data } = await api.post('/orders', {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
        subtotal, discount: discountAmt, tax: taxAmt, total,
        payment_method, amount_paid: paid || total,
        customer_id: customer_id || null,
      })
      setLastOrder(data); setShowReceipt(true)
      dispatch(clearCart()); setAmountPaid('')
      loadProducts()
    } catch (err: any) { alert(err.response?.data?.message || 'Checkout failed') }
    finally { setProcessing(false) }
  }

  return (
    <div className="row g-0" style={{ height: 'calc(100vh - var(--nav-h) - 2rem)' }}>
      {/* LEFT: Products */}
      <div className="col-md-7 d-flex flex-column pe-3">
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <input ref={barcodeRef} className="form-control" style={{ maxWidth: 180 }}
            placeholder="Barcode (F2)" value={barcode}
            onChange={e => setBarcode(e.target.value)} onKeyDown={handleBarcodeEnter} />
          <input className="form-control" placeholder="Search products..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ maxWidth: 160 }} value={catFilter}
            onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="row g-2 overflow-auto flex-grow-1">
          {filtered.map((p: any) => (
            <div key={p.id} className="col-6 col-lg-4 col-xl-3">
              <div className={`card pos-card h-100 ${p.stock === 0 ? 'out-of-stock' : ''}`}
                onClick={() => p.stock > 0 && dispatch(addItem({ product_id: p.id, name: p.name, price: Number(p.price), stock: p.stock }))}>
                <div className="card-body p-2 text-center">
                  {p.image
                    ? <img src={p.image} alt="" className="img-fluid mb-1" style={{ height: 56, objectFit: 'cover' }} />
                    : <div className="bg-light rounded mb-1 d-flex align-items-center justify-content-center" style={{ height: 56 }}>
                        <i className="bi bi-box-seam text-muted fs-4"></i>
                      </div>}
                  <div className="small fw-semibold text-truncate">{p.name}</div>
                  <div className="text-primary fw-bold small">{cur}{Number(p.price).toFixed(2)}</div>
                  <span className={`badge ${p.stock === 0 ? 'bg-danger' : p.stock <= 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                    {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="col-md-5 d-flex flex-column">
        <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <span className="fw-bold"><i className="bi bi-cart3 me-2"></i>Cart ({items.length})</span>
            <button className="btn btn-sm btn-outline-light" onClick={() => dispatch(clearCart())}>
              <i className="bi bi-trash"></i> Clear
            </button>
          </div>

          <div className="p-2 border-bottom">
            <select className="form-select form-select-sm" value={customer_id || ''}
              onChange={e => dispatch(setCustomer(e.target.value ? parseInt(e.target.value) : null))}>
              <option value="">Walk-in Customer</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} – {c.phone}</option>)}
            </select>
          </div>

          <div className="overflow-auto flex-grow-1 p-2">
            {items.length === 0
              ? <div className="text-center text-muted py-5">
                  <i className="bi bi-cart-x display-4"></i>
                  <p className="mt-2">Cart is empty</p>
                  <small>Click products or scan barcode (F2)</small>
                </div>
              : items.map(item => (
                <div key={item.product_id} className="cart-row py-2 d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                    <div className="small fw-semibold">{item.name}</div>
                    <div className="text-muted small">{cur}{item.price.toFixed(2)} each</div>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button className="btn btn-sm btn-outline-secondary px-2 py-0"
                      onClick={() => dispatch(updateQty({ product_id: item.product_id, qty: item.quantity - 1 }))}>−</button>
                    <span className="px-2 fw-bold">{item.quantity}</span>
                    <button className="btn btn-sm btn-outline-secondary px-2 py-0"
                      onClick={() => dispatch(updateQty({ product_id: item.product_id, qty: item.quantity + 1 }))}>+</button>
                  </div>
                  <div className="text-end" style={{ minWidth: 70 }}>
                    <div className="fw-bold small">{cur}{(item.price * item.quantity).toFixed(2)}</div>
                    <button className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => dispatch(removeItem(item.product_id))}>
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Totals + Payment */}
          <div className="p-3 border-top bg-light">
            <div className="d-flex justify-content-between mb-1 small">
              <span>Subtotal</span><span>{cur}{subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between mb-1 small">
              <span>Discount</span>
              <div className="d-flex align-items-center gap-1">
                <input type="number" className="form-control form-control-sm" style={{ width: 55 }}
                  value={discount} min={0} max={100}
                  onChange={e => dispatch(setDiscount(Number(e.target.value)))} />
                <span>%</span>
                <span className="text-danger">−{cur}{discountAmt.toFixed(2)}</span>
              </div>
            </div>
            <div className="d-flex justify-content-between mb-1 small">
              <span>GST ({taxRate}%)</span><span>+{cur}{taxAmt.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2">
              <span>TOTAL</span><span className="text-primary">{cur}{total.toFixed(2)}</span>
            </div>

            <div className="btn-group w-100 my-2">
              {(['cash','card','upi'] as const).map(m => (
                <button key={m} className={`btn btn-sm ${payment_method === m ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => dispatch(setPayment(m))}>
                  <i className={`bi ${m==='cash'?'bi-cash':m==='card'?'bi-credit-card':'bi-phone'} me-1`}></i>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {payment_method === 'cash' && (
              <div className="d-flex gap-2 mb-2">
                <input type="number" className="form-control form-control-sm" placeholder="Amount paid"
                  value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <span className="text-success small align-self-center text-nowrap">
                    Change: {cur}{(parseFloat(amountPaid) - total).toFixed(2)}
                  </span>
                )}
              </div>
            )}

            <button className="btn btn-success w-100 fw-bold" onClick={handleCheckout}
              disabled={processing || items.length === 0}>
              {processing ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle me-2"></i>}
              PAY (F10)
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold text-success"><i className="bi bi-check-circle me-2"></i>Order Complete</h6>
                <button className="btn-close" onClick={() => setShowReceipt(false)}></button>
              </div>
              <div className="modal-body">
                <div ref={receiptRef}><Receipt order={lastOrder} settings={settings} /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <i className="bi bi-printer me-1"></i>Print
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReceipt(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
