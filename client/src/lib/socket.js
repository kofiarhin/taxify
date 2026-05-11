import { io } from 'socket.io-client';

export const resolveSocketOrigin = (
  apiUrl = import.meta.env.VITE_API_URL,
  fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : ''
) => {
  if (!apiUrl) return fallbackOrigin;
  return new URL(apiUrl, fallbackOrigin).origin;
};

export const createSocketConnection = (token, options = {}) => {
  if (!token) return null;

  return io(options.origin || resolveSocketOrigin(), {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    transports: ['websocket', 'polling']
  });
};
