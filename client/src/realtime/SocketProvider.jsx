import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { createSocketConnection } from '../lib/socket';
import { useRealtimeBookings } from '../hooks/useRealtimeBookings';
import { SocketContext } from './socketContext';

function RealtimeBookingSubscriber() {
  useRealtimeBookings();
  return null;
}

export function SocketProvider({ children }) {
  const token = useSelector((state) => state.auth.token);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('offline');

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    if (!token) {
      setStatus('offline');
      return undefined;
    }

    const nextSocket = createSocketConnection(token);
    socketRef.current = nextSocket;
    setSocket(nextSocket);
    setStatus('reconnecting');

    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('offline');
    const handleReconnectAttempt = () => setStatus('reconnecting');
    const handleConnectError = () => setStatus('offline');

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);
    nextSocket.on('connect_error', handleConnectError);
    nextSocket.io.on('reconnect_attempt', handleReconnectAttempt);
    nextSocket.io.on('reconnect', handleConnect);
    nextSocket.io.on('reconnect_error', handleReconnectAttempt);
    nextSocket.connect();

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.off('connect_error', handleConnectError);
      nextSocket.io.off('reconnect_attempt', handleReconnectAttempt);
      nextSocket.io.off('reconnect', handleConnect);
      nextSocket.io.off('reconnect_error', handleReconnectAttempt);
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket, status }), [socket, status]);

  return (
    <SocketContext.Provider value={value}>
      <RealtimeBookingSubscriber />
      {children}
    </SocketContext.Provider>
  );
}
