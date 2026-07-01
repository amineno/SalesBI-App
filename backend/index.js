const env = require('./config/env');
const pool = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');
const PORT = env.port;

const http = require('http');
const socketService = require('./services/socketService');
const cache = require('./utils/cache');

const server = http.createServer(app);

// Initialize Services
socketService.init(server);
cache.init();

pool.testConnection()
    .then(() => {
        server.listen(PORT, () => {
            logger.info('Server started with Socket.IO', { port: PORT, environment: env.nodeEnv });
        });
    })
    .catch((error) => {
        logger.error('Server startup failed', { error: error.message });
        process.exit(1);
    });
