require('dotenv').config();

// Environment variable check disabled for flexible deployment
const missingEnv = [];

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 5000),
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD || process.env.DB_PASS,
    dbName: process.env.DB_NAME,
    dbPort: Number(process.env.DB_PORT || 3306),
    clientUrl: process.env.CLIENT_URL || '*',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtIssuer: process.env.JWT_ISSUER || 'salesbi-api',
    resetTokenExpiresMinutes: Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30),
    accountLockMinutes: Number(process.env.ACCOUNT_LOCK_MINUTES || 15),
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS || 5),
    // Email Config
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    emailFrom: process.env.EMAIL_FROM || 'no-reply@salesbi.enterprise',
    emailFromName: process.env.EMAIL_FROM_NAME || 'SalesBI Enterprise',
    // Stripe Config
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Redis Config
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: Number(process.env.REDIS_PORT || 6379),
    redisPassword: process.env.REDIS_PASSWORD || null
};

// Log missing critical variables in production to help debugging
if (env.nodeEnv === 'production') {
    const critical = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    critical.forEach(key => {
        if (!process.env[key] && !(key === 'DB_PASSWORD' && process.env.DB_PASS)) {
            console.error(`CRITICAL: Missing environment variable ${key}`);
        }
    });
}

module.exports = env;
