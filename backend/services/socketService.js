const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

class SocketService {
    constructor() {
        this.io = null;
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Authentication Middleware
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            try {
                const decoded = verifyAccessToken(token);
                socket.user = decoded;
                next();
            } catch (err) {
                logger.warn('Socket authentication failed', { error: err.message });
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            logger.info('User connected to socket', { 
                userId: socket.user.id, 
                socketId: socket.id 
            });

            // Join a personal room for targeted notifications
            socket.join(`user:${socket.user.id}`);

            // Join role-based rooms
            if (socket.user.role) {
                socket.join(`role:${socket.user.role}`);
            }

            socket.on('disconnect', () => {
                logger.info('User disconnected from socket', { 
                    userId: socket.user.id, 
                    socketId: socket.id 
                });
            });
        });

        logger.info('Socket.IO service initialized');
    }

    // Generic emit to all connected clients
    emit(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    // Targeted emit to a specific user
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }

    // Targeted emit to a specific role (e.g., 'Admin')
    emitToRole(role, event, data) {
        if (this.io) {
            this.io.to(`role:${role}`).emit(event, data);
        }
    }
}

module.exports = new SocketService();
