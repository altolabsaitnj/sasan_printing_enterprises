interface Props { order: any; settings: Record<string, string> }

export default function Receipt({ order, settings }: Props) {
  const cur = settings.currency || '₹'
  return (
    <div className="receipt-area p-2">
      <div className="text-center mb-2">
        <div className="fw-bold fs-6">{settings.storeName || 'POS Store'}</div>
        <div className="small">{settings.storeAddress}</div>
        <div className="small">{settings.storePhone}</div>
        <div className="border-top border-bottom my-1 py-1 small">
          <div>Order: {order.order_number}</div>
          <div>{new Date(order.created_at).toLocaleString()}</div>
          {order.cashier_name && <div>Cashier: {order.cashier_name}</div>}
          {order.customer_name && <div>Customer: {order.customer_name}</div>}
        </div>
      </div>
      <table className="table table-sm table-borderless mb-1" style={{ fontSize: 11 }}>
        <thead><tr><th>Item</th><th className="text-center">Qty</th><th className="text-end">Amt</th></tr></thead>
        <tbody>
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-end">{cur}{Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-top pt-1" style={{ fontSize: 11 }}>
        <div className="d-flex justify-content-between"><span>Subtotal</span><span>{cur}{Number(order.subtotal).toFixed(2)}</span></div>
        {Number(order.discount) > 0 && <div className="d-flex justify-content-between text-danger"><span>Discount</span><span>-{cur}{Number(order.discount).toFixed(2)}</span></div>}
        <div className="d-flex justify-content-between"><span>GST/Tax</span><span>{cur}{Number(order.tax).toFixed(2)}</span></div>
        <div className="d-flex justify-content-between fw-bold border-top mt-1 pt-1">
          <span>TOTAL</span><span>{cur}{Number(order.total).toFixed(2)}</span>
        </div>
        {order.payment && <>
          <div className="d-flex justify-content-between"><span>Paid ({order.payment_method?.toUpperCase()})</span><span>{cur}{Number(order.payment.amount_paid).toFixed(2)}</span></div>
          {Number(order.payment.balance) > 0 && <div className="d-flex justify-content-between"><span>Change</span><span>{cur}{Number(order.payment.balance).toFixed(2)}</span></div>}
        </>}
      </div>
      <div className="text-center mt-2 small border-top pt-1">{settings.receiptFooter || 'Thank you!'}</div>
    </div>
  )
}
