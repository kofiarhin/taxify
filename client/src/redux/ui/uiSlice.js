import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { lastToast: null },
  reducers: {
    setToast(state, action) {
      state.lastToast = action.payload;
    }
  }
});

export const { setToast } = uiSlice.actions;
export default uiSlice.reducer;
