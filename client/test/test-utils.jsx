import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "../src/redux/auth/authSlice";
import navigationReducer from "../src/redux/navigation/navigationSlice";
import uiReducer from "../src/redux/ui/uiSlice";

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      navigation: navigationReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: {
        token: null,
        user: null,
        status: "idle",
        error: null,
        ...preloadedState.auth,
      },
      navigation: {
        sidebarOpen: false,
        ...preloadedState.navigation,
      },
      ui: {
        notice: null,
        socketState: "offline",
        ...preloadedState.ui,
      },
    },
  });
}

export function renderWithProviders(
  ui,
  { route = "/", preloadedState = {}, store = createTestStore(preloadedState) } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </Provider>
    ),
  };
}
