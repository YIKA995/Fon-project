const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('analysts');
    logger.info('Socket connected', { userId: socket.user.id });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: socket.user.id });
    });
  });

  return io;
}

function emitNewAlert(alert) {
  if (!io) return;
  io.to('analysts').emit('alert:new', alert);
}

function emitAssetStatusChange(asset) {
  if (!io) return;
  io.to('analysts').emit('asset:status', asset);
}

function emitNotification(userId, notification) {
  if (!io) return;
  io.to('analysts').emit('notification:new', { userId, notification });
}

module.exports = { initSocket, emitNewAlert, emitAssetStatusChange, emitNotification };
