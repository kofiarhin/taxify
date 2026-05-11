import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('taxify_user') || 'null'),
  token: localStorage.getItem('taxify_token')
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('taxify_user', JSON.stringify(action.payload.user));
      localStorage.setItem('taxify_token', action.payload.token);
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('taxify_user');
      localStorage.removeItem('taxify_token');
    }
  }
});

export const { clearCredentials, setCredentials } = authSlice.actions;
export default authSlice.reducer;
