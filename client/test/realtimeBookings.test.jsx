import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createSocketConnection, resolveSocketOrigin } from '../src/lib/socket';
import { BOOKING_REALTIME_EVENTS, useRealtimeBookings } from '../src/hooks/useRealtimeBookings';
import { queryKeys } from '../src/hooks/queryKeys';
import { SocketProvider } from '../src/realtime/SocketProvider';
import { SocketContext } from '../src/realtime/socketContext';

const { ioMock, socketMock } = vi.hoisted(() => ({
  socketMock: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    io: {
      off: vi.fn(),
      on: vi.fn()
    }
  },
  ioMock: vi.fn(() => socketMock)
}));

vi.mock('socket.io-client', () => ({
  io: ioMock
}));

function HookHarness({ queryClient, socket }) {
  useRealtimeBookings();
  return null;
}

describe('realtime booking integration', () => {
  beforeEach(() => {
    ioMock.mockClear();
    socketMock.connect.mockClear();
    socketMock.disconnect.mockClear();
    socketMock.off.mockClear();
    socketMock.on.mockClear();
    socketMock.io.off.mockClear();
    socketMock.io.on.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('creates socket connections with the auth token and resolved API origin', () => {
    expect(resolveSocketOrigin('http://localhost:5000/api', 'http://localhost:5173')).toBe('http://localhost:5000');
    expect(resolveSocketOrigin('/api', 'https://app.taxify.test/bookings')).toBe('https://app.taxify.test');
    expect(createSocketConnection(null)).toBeNull();

    createSocketConnection('test-token', { origin: 'http://api.test' });

    expect(ioMock).toHaveBeenCalledWith(
      'http://api.test',
      expect.objectContaining({
        auth: { token: 'test-token' },
        autoConnect: false,
        reconnection: true
      })
    );
  });

  test('provider connects with the Redux auth token and disconnects on cleanup', async () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ token: 'redux-token', user: { role: 'CLIENT' } })
      }
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    const view = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <div>socket child</div>
          </SocketProvider>
        </QueryClientProvider>
      </Provider>
    );

    await waitFor(() => expect(socketMock.connect).toHaveBeenCalled());
    expect(ioMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'redux-token' } }));

    view.unmount();

    expect(socketMock.disconnect).toHaveBeenCalled();
  });

  test('subscribes to booking lifecycle events and removes handlers on unmount', () => {
    const socket = {
      on: vi.fn(),
      off: vi.fn()
    };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    const view = render(
      <QueryClientProvider client={queryClient}>
        <SocketContext.Provider value={{ socket, status: 'connected' }}>
          <HookHarness queryClient={queryClient} socket={socket} />
        </SocketContext.Provider>
      </QueryClientProvider>
    );

    expect(socket.on).toHaveBeenCalledTimes(BOOKING_REALTIME_EVENTS.length);
    expect(socket.on.mock.calls.map((call) => call[0])).toEqual(BOOKING_REALTIME_EVENTS);

    view.unmount();

    expect(socket.off).toHaveBeenCalledTimes(BOOKING_REALTIME_EVENTS.length);
    expect(socket.off.mock.calls.map((call) => call[0])).toEqual(BOOKING_REALTIME_EVENTS);
  });

  test('updates cached bookings and invalidates booking queries for lifecycle events', () => {
    const handlers = {};
    const socket = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: vi.fn()
    };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const queryKey = [...queryKeys.bookings, undefined];

    queryClient.setQueryData(queryKey, {
      bookings: [
        { _id: 'booking-1', status: 'QUEUED', pickupAddress: 'Old pickup', createdAt: '2026-05-14T09:00:00.000Z' },
        { _id: 'booking-2', status: 'QUEUED', pickupAddress: 'Other pickup', createdAt: '2026-05-14T08:00:00.000Z' }
      ]
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SocketContext.Provider value={{ socket, status: 'connected' }}>
          <HookHarness queryClient={queryClient} socket={socket} />
        </SocketContext.Provider>
      </QueryClientProvider>
    );

    handlers['booking:assigned']({
      type: 'booking:assigned',
      bookingId: 'booking-1',
      status: 'DRIVER_ASSIGNED',
      booking: {
        _id: 'booking-1',
        status: 'DRIVER_ASSIGNED',
        pickupAddress: 'New pickup',
        createdAt: '2026-05-14T09:00:00.000Z'
      },
      timestamp: new Date().toISOString()
    });

    expect(queryClient.getQueryData(queryKey).bookings[0]).toEqual(
      expect.objectContaining({ _id: 'booking-1', status: 'DRIVER_ASSIGNED', pickupAddress: 'New pickup' })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.bookings });
  });

  test('inserts new realtime bookings into cached lists without duplicating them', () => {
    const handlers = {};
    const socket = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: vi.fn()
    };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const queryKey = [...queryKeys.bookings, undefined];

    queryClient.setQueryData(queryKey, {
      bookings: [{ _id: 'booking-1', status: 'QUEUED', createdAt: '2026-05-14T09:00:00.000Z' }]
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SocketContext.Provider value={{ socket, status: 'connected' }}>
          <HookHarness queryClient={queryClient} socket={socket} />
        </SocketContext.Provider>
      </QueryClientProvider>
    );

    const payload = {
      type: 'booking:created',
      bookingId: 'booking-3',
      status: 'DRIVER_ASSIGNED',
      booking: { _id: 'booking-3', status: 'DRIVER_ASSIGNED', createdAt: '2026-05-14T10:00:00.000Z' },
      timestamp: new Date().toISOString()
    };

    handlers['booking:created'](payload);
    handlers['booking:created'](payload);

    expect(queryClient.getQueryData(queryKey).bookings.map((booking) => booking._id)).toEqual(['booking-3', 'booking-1']);
  });
});
