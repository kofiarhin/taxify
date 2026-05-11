import { createContext, useContext } from 'react';

export const SocketContext = createContext({
  socket: null,
  status: 'offline'
});

export const useSocket = () => useContext(SocketContext);
