import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import navigationReducer from "./navigation/navigationSlice";
import uiReducer from "./ui/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    navigation: navigationReducer,
    ui: uiReducer,
  },
});
