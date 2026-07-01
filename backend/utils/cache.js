const redis = require('redis');
const env = require('../config/env');
const logger = require('./logger');

class CacheService {
    constructor() {
        this.client = null;
        this.isEnabled = false;
    }

    async init() {
        try {
            this.client = redis.createClient({
                url: `redis://${env.redisHost}:${env.redisPort}`,
                password: env.redisPassword
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error', { error: err.message });
                this.isEnabled = false;
            });

            await this.client.connect();
            this.isEnabled = true;
            logger.info('Redis cache initialized successfully');
        } catch (err) {
            logger.warn('Failed to connect to Redis, caching will be disabled', { error: err.message });
            this.isEnabled = false;
        }
    }

    async get(key) {
        if (!this.isEnabled) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            logger.error('Cache get failed', { key, error: err.message });
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        if (!this.isEnabled) return;
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: ttl
            });
        } catch (err) {
            logger.error('Cache set failed', { key, error: err.message });
        }
    }

    async del(key) {
        if (!this.isEnabled) return;
        try {
            await this.client.del(key);
        } catch (err) {
            logger.error('Cache delete failed', { key, error: err.message });
        }
    }

    async delByPrefix(prefix) {
        if (!this.isEnabled) return;
        try {
            const keys = await this.client.keys(`${prefix}*`);
            if (keys.length > 0) {
                await this.client.del(keys);
                logger.info(`Deleted ${keys.length} keys with prefix: ${prefix}`);
            }
        } catch (err) {
            logger.error('Cache delByPrefix failed', { prefix, error: err.message });
        }
    }

    async flush() {
        if (!this.isEnabled) return;
        try {
            await this.client.flushAll();
            logger.info('Cache flushed successfully');
        } catch (err) {
            logger.error('Cache flush failed', { error: err.message });
        }
    }
}

module.exports = new CacheService();
