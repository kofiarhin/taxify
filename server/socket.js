const { Server } = require("socket.io");
const { env } = require("./config/env");

let io = null;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("socket.state", { connected: true, socketId: socket.id });
  });

  return io;
}

function getIO() {
  return io;
}

function emitDomainEvent(eventName, payload) {
  if (!io) {
    return;
  }
  io.emit(eventName, payload);
}

module.exports = {
  initializeSocket,
  getIO,
  emitDomainEvent,
};
