import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    notice: null,
    socketState: "offline",
  },
  reducers: {
    setNotice(state, action) {
      state.notice = action.payload;
    },
    clearNotice(state) {
      state.notice = null;
    },
    setSocketState(state, action) {
      state.socketState = action.payload;
    },
  },
});

export const { setNotice, clearNotice, setSocketState } = uiSlice.actions;
export default uiSlice.reducer;
