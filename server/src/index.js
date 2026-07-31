require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { initSocket } = require('./websocket/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Sentinel Africa API listening on port ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
