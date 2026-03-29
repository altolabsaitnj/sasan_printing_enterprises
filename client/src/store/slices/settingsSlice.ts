import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

interface SettingsState { data: Record<string, string>; theme: 'light' | 'dark' }

const initialState: SettingsState = {
  data: { storeName: 'POS System', currency: '₹', taxRate: '18', receiptFooter: 'Thank you!' },
  theme: (localStorage.getItem('pos_theme') as 'light' | 'dark') || 'light',
}

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const { data } = await api.get('/settings'); return data
})

const settingsSlice = createSlice({
  name: 'settings', initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('pos_theme', state.theme)
      document.documentElement.setAttribute('data-theme', state.theme)
    },
  },
  extraReducers: b => {
    b.addCase(fetchSettings.fulfilled, (s, a) => { s.data = a.payload })
  },
})

export const { toggleTheme } = settingsSlice.actions
export default settingsSlice.reducer
