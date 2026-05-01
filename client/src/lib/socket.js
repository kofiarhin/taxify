import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "";
const socketBaseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(socketBaseUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }

  return socket;
}
