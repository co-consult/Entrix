"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_constants_1 = require("./redis.constants");
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    metrics = {
        hits: 0,
        misses: 0,
        errors: 0,
        totalOperations: 0
    };
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const config = this.configService.get(redis_constants_1.REDIS_CONFIG_NAMESPACE);
        const options = {
            host: config.host,
            port: config.port,
            db: config.db,
            password: config.password,
            tls: config.tls ? {} : undefined,
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            enableOfflineQueue: false,
        };
        this.client = new ioredis_1.default(options);
        this.client.on('connect', () => {
            this.logger.log('✅ Connexion Redis établie');
        });
        this.client.on('error', (err) => {
            this.metrics.errors++;
            this.logger.error('❌ Erreur Redis', err);
        });
        this.client.on('close', () => {
            this.logger.warn('🔌 Connexion Redis fermée');
        });
        this.client.on('reconnecting', () => {
            this.logger.warn('🔄 Tentative de reconnexion Redis...');
        });
        this.logger.log(`🚀 Redis connecté sur ${config.host}:${config.port} (DB: ${config.db})`);
    }
    getClient() {
        return this.client;
    }
    async set(key, value, ttlSeconds) {
        try {
            this.metrics.totalOperations++;
            if (ttlSeconds) {
                return await this.client.set(key, value, 'EX', ttlSeconds);
            }
            return await this.client.set(key, value);
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            this.metrics.totalOperations++;
            const value = await this.client.get(key);
            if (value) {
                this.metrics.hits++;
            }
            else {
                this.metrics.misses++;
            }
            return value;
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis GET error for key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            this.metrics.totalOperations++;
            return await this.client.del(key);
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }
    async setCache(key, value, ttlSeconds) {
        const cacheKey = `${redis_constants_1.REDIS_PREFIXES.CACHE}${key}`;
        await this.set(cacheKey, JSON.stringify(value), ttlSeconds || redis_constants_1.REDIS_TTL.CACHE_MEDIUM);
    }
    async getCache(key) {
        const cacheKey = `${redis_constants_1.REDIS_PREFIXES.CACHE}${key}`;
        const value = await this.get(cacheKey);
        return value ? JSON.parse(value) : null;
    }
    async delCache(key) {
        const cacheKey = `${redis_constants_1.REDIS_PREFIXES.CACHE}${key}`;
        return await this.del(cacheKey);
    }
    async acquireLock(key, ttlSeconds = redis_constants_1.REDIS_TTL.LOCK) {
        try {
            this.metrics.totalOperations++;
            const lockKey = `${redis_constants_1.REDIS_PREFIXES.LOCK}${key}`;
            const result = await this.client.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
            return result === 'OK';
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Lock acquisition error for key ${key}:`, error);
            return false;
        }
    }
    async releaseLock(key) {
        const lockKey = `${redis_constants_1.REDIS_PREFIXES.LOCK}${key}`;
        return await this.del(lockKey);
    }
    async withLock(key, callback, ttlSeconds = redis_constants_1.REDIS_TTL.LOCK) {
        const lockAcquired = await this.acquireLock(key, ttlSeconds);
        if (!lockAcquired) {
            throw new Error(`Could not acquire lock for key: ${key}`);
        }
        try {
            return await callback();
        }
        finally {
            await this.releaseLock(key);
        }
    }
    async setSession(sessionId, data, ttlSeconds = redis_constants_1.REDIS_TTL.SESSION) {
        const sessionKey = `${redis_constants_1.REDIS_PREFIXES.SESSION}${sessionId}`;
        await this.set(sessionKey, JSON.stringify(data), ttlSeconds);
    }
    async getSession(sessionId) {
        const sessionKey = `${redis_constants_1.REDIS_PREFIXES.SESSION}${sessionId}`;
        const data = await this.get(sessionKey);
        return data ? JSON.parse(data) : null;
    }
    async delSession(sessionId) {
        const sessionKey = `${redis_constants_1.REDIS_PREFIXES.SESSION}${sessionId}`;
        return await this.del(sessionKey);
    }
    async increment(key, ttlSeconds) {
        try {
            this.metrics.totalOperations++;
            const result = await this.client.incr(key);
            if (result === 1 && ttlSeconds) {
                await this.client.expire(key, ttlSeconds);
            }
            return result;
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis INCR error for key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            this.metrics.totalOperations++;
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis EXISTS error for key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            this.metrics.totalOperations++;
            const result = await this.client.expire(key, ttlSeconds);
            return result === 1;
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }
    async keys(pattern) {
        try {
            this.metrics.totalOperations++;
            return await this.client.keys(pattern);
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
            throw error;
        }
    }
    async cleanup(pattern) {
        try {
            const keys = await this.keys(pattern);
            if (keys.length === 0)
                return 0;
            this.metrics.totalOperations++;
            const result = await this.client.del(...keys);
            this.logger.log(`🧹 Nettoyage Redis: ${result} clés supprimées (pattern: ${pattern})`);
            return result;
        }
        catch (error) {
            this.metrics.errors++;
            this.logger.error(`Redis CLEANUP error for pattern ${pattern}:`, error);
            throw error;
        }
    }
    getMetrics() {
        const hitRate = this.metrics.totalOperations > 0
            ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
            : 0;
        return {
            ...this.metrics,
            hitRate: parseFloat(hitRate.toFixed(2)),
            errorRate: this.metrics.totalOperations > 0
                ? (this.metrics.errors / this.metrics.totalOperations) * 100
                : 0
        };
    }
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            errors: 0,
            totalOperations: 0
        };
    }
    async ping() {
        try {
            return await this.client.ping();
        }
        catch (error) {
            this.logger.error('Redis PING error:', error);
            throw error;
        }
    }
    async info() {
        try {
            return await this.client.info();
        }
        catch (error) {
            this.logger.error('Redis INFO error:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            const metrics = this.getMetrics();
            this.logger.log(`📊 Métriques Redis finales: ${JSON.stringify(metrics)}`);
            await this.client.quit();
            this.logger.log('🔒 Connexion Redis fermée proprement');
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map