import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  product_id: number; name: string; price: number; quantity: number; stock: number
}

interface CartState {
  items: CartItem[]
  discount: number
  taxRate: number
  customer_id: number | null
  payment_method: 'cash' | 'card' | 'upi'
}

const initialState: CartState = {
  items: [], discount: 0, taxRate: 18, customer_id: null, payment_method: 'cash'
}

const cartSlice = createSlice({
  name: 'cart', initialState,
  reducers: {
    addItem(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const ex = state.items.find(i => i.product_id === action.payload.product_id)
      if (ex) { if (ex.quantity < ex.stock) ex.quantity++ }
      else state.items.push({ ...action.payload, quantity: 1 })
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.product_id !== action.payload)
    },
    updateQty(state, action: PayloadAction<{ product_id: number; qty: number }>) {
      const item = state.items.find(i => i.product_id === action.payload.product_id)
      if (item) {
        if (action.payload.qty <= 0) state.items = state.items.filter(i => i.product_id !== action.payload.product_id)
        else if (action.payload.qty <= item.stock) item.quantity = action.payload.qty
      }
    },
    setDiscount(state, a: PayloadAction<number>) { state.discount = a.payload },
    setTaxRate(state, a: PayloadAction<number>) { state.taxRate = a.payload },
    setCustomer(state, a: PayloadAction<number | null>) { state.customer_id = a.payload },
    setPayment(state, a: PayloadAction<'cash'|'card'|'upi'>) { state.payment_method = a.payload },
    clearCart(state) { state.items = []; state.discount = 0; state.customer_id = null; state.payment_method = 'cash' },
  },
})

export const { addItem, removeItem, updateQty, setDiscount, setTaxRate, setCustomer, setPayment, clearCart } = cartSlice.actions
export default cartSlice.reducer
