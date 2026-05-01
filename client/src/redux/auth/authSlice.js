import { createSlice } from "@reduxjs/toolkit";

const initialToken = window.localStorage.getItem("taxify_token");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken,
    user: null,
    status: initialToken ? "checking" : "idle",
    error: null,
  },
  reducers: {
    authRequestStarted(state) {
      state.status = "loading";
      state.error = null;
    },
    authResolved(state, action) {
      state.status = "authenticated";
      state.user = action.payload.user;
      state.token = action.payload.token ?? state.token;
      state.error = null;
    },
    authCheckFinished(state) {
      if (!state.user) {
        state.status = "idle";
      }
    },
    authFailed(state, action) {
      state.status = "idle";
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logoutSucceeded(state) {
      state.status = "idle";
      state.user = null;
      state.token = null;
      state.error = null;
    },
  },
});

export const {
  authRequestStarted,
  authResolved,
  authCheckFinished,
  authFailed,
  logoutSucceeded,
} = authSlice.actions;

export default authSlice.reducer;
