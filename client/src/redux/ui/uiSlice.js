import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    notice: null,
  },
  reducers: {
    setNotice(state, action) {
      state.notice = action.payload;
    },
    clearNotice(state) {
      state.notice = null;
    },
  },
});

export const { setNotice, clearNotice } = uiSlice.actions;
export default uiSlice.reducer;
