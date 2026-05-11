import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import App from '../src/App';
import { AppShell } from '../src/components/shared/AppShell';
import { AppProviders } from '../src/redux/providers';
import { SocketContext } from '../src/realtime/socketContext';

const renderShellWithStatus = (status) => {
  const store = configureStore({
    reducer: {
      auth: () => ({
        user: { role: 'ADMIN', name: 'Mara Ellison' },
        token: 'token'
      })
    }
  });

  return render(
    <Provider store={store}>
      <SocketContext.Provider value={{ socket: null, status }}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </SocketContext.Provider>
    </Provider>
  );
};

describe('Taxify client shell', () => {
  test('renders the login experience by default', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(screen.getByRole('heading', { name: /live taxi operations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders realtime connection states in the app shell', () => {
    const connected = renderShellWithStatus('connected');
    expect(screen.getByRole('status', { name: /realtime connected/i })).toBeInTheDocument();
    connected.unmount();

    const reconnecting = renderShellWithStatus('reconnecting');
    expect(screen.getByRole('status', { name: /realtime reconnecting/i })).toBeInTheDocument();
    reconnecting.unmount();

    renderShellWithStatus('offline');
    expect(screen.getByRole('status', { name: /realtime offline/i })).toBeInTheDocument();
  });
});
