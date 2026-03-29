import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

interface User { id: number; username: string; name: string; role: string }
interface AuthState { user: User | null; token: string | null; loading: boolean; error: string | null }

const initialState: AuthState = {
  user: localStorage.getItem('pos_user') ? JSON.parse(localStorage.getItem('pos_user')!) : null,
  token: localStorage.getItem('pos_token'),
  loading: false, error: null,
}

export const login = createAsyncThunk('auth/login',
  async (creds: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', creds)
      localStorage.setItem('pos_token', data.token)
      localStorage.setItem('pos_user', JSON.stringify(data.user))
      return data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    logout(state) {
      state.user = null; state.token = null
      localStorage.removeItem('pos_token'); localStorage.removeItem('pos_user')
    },
    clearError(state) { state.error = null },
  },
  extraReducers: b => {
    b.addCase(login.pending, s => { s.loading = true; s.error = null })
     .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token })
     .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload as string })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
