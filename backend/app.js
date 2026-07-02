const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const logger = require('./utils/logger');
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const searchRoutes = require('./routes/searchRoutes');
const orderRoutes = require('./routes/orderRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const path = require('path');
const cache = require('./utils/cache');
const app = express();

// Initialize Services (Async)
cache.init().catch(err => logger.error('Cache initialization failed', { error: err.message }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
    origin: env.nodeEnv === 'production' ? true : env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
        logger.info('HTTP request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip
        });
    });

    next();
});

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: env.nodeEnv === 'development' ? 1000 : 100
});

app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        api: 'UP',
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv
    });
});

const migrationService = require('./services/migrationService');

app.get('/api/diag', async (req, res) => {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        
        const details = {};
        for (const table of tableList) {
            const [columns] = await pool.query(`DESCRIBE ${table}`);
            details[table] = columns.map(c => ({
                name: c.Field,
                type: c.Type,
                null: c.Null,
                key: c.Key,
                default: c.Default
            }));
        }

        const cache = require('./utils/cache');
        const cacheStatus = cache.isEnabled ? 'CONNECTED' : 'DISABLED';

        const [[adminUser]] = await pool.query('SELECT email FROM users WHERE email = ?', ['nouiouidev404@dev.com']);
        const [allRoles] = await pool.query('SELECT * FROM roles');

        res.json({
            status: 'OK',
            database: env.dbName,
            cache: cacheStatus,
            userCheck: adminUser ? 'FOUND' : 'NOT_FOUND',
            roles: allRoles.map(r => r.name),
            tableCount: tableList.length,
            structure: details,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: error.message,
            stack: env.nodeEnv === 'production' ? undefined : error.stack
        });
    }
});

app.get('/api/admin/migrate-all', async (req, res) => {
    try {
        const results = await migrationService.runAll();
        res.json({ 
            message: 'Migration process finished', 
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: error.message 
        });
    }
});

app.get('/ready', async (req, res) => {
    try {
        const dbStatus = await pool.getDatabaseStatus();

        res.json({
            status: 'READY',
            api: 'UP',
            database: dbStatus.status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'NOT_READY',
            api: 'UP',
            database: 'DOWN',
            timestamp: new Date().toISOString()
        });
    }
});

app.use((err, req, res, next) => {
    const errorDescription = {
        error: 'Something went wrong!',
        message: err.message,
        path: req.originalUrl,
        method: req.method
    };

    if (env.nodeEnv !== 'production') {
        errorDescription.stack = err.stack;
    }

    logger.error('Unhandled application error', {
        ...errorDescription,
        stack: err.stack
    });
    
    res.status(500).json(errorDescription);
});

module.exports = app;
