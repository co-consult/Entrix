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
var RateLimitingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const redis_constants_1 = require("../redis/redis.constants");
let RateLimitingService = RateLimitingService_1 = class RateLimitingService {
    redis;
    logger = new common_1.Logger(RateLimitingService_1.name);
    metrics = {
        totalRequests: 0,
        blockedRequests: 0,
        allowedRequests: 0,
        errorCount: 0,
    };
    DEFAULT_LIMIT = 100;
    DEFAULT_WINDOW_MS = 60000;
    DEFAULT_ALGORITHM = 'sliding_window';
    constructor(redis) {
        this.redis = redis;
    }
    async checkLimit(identifier, options = {}) {
        const limit = options.limit ?? this.DEFAULT_LIMIT;
        const windowMs = options.windowMs ?? this.DEFAULT_WINDOW_MS;
        const algorithm = options.algorithm ?? this.DEFAULT_ALGORITHM;
        this.metrics.totalRequests++;
        try {
            let result;
            switch (algorithm) {
                case 'sliding_window':
                    result = await this.slidingWindowCheck(identifier, limit, windowMs);
                    break;
                case 'token_bucket':
                    result = await this.tokenBucketCheck(identifier, limit, windowMs);
                    break;
                case 'fixed_window':
                    result = await this.fixedWindowCheck(identifier, limit, windowMs);
                    break;
                default:
                    result = await this.slidingWindowCheck(identifier, limit, windowMs);
            }
            if (result.allowed) {
                this.metrics.allowedRequests++;
            }
            else {
                this.metrics.blockedRequests++;
                this.logger.warn(`🚫 Rate limit exceeded for ${identifier}`, {
                    identifier,
                    limit,
                    remaining: result.remaining,
                    resetTime: new Date(result.resetTime),
                });
            }
            return result;
        }
        catch (error) {
            this.metrics.errorCount++;
            this.logger.error(`❌ Rate limiting error for ${identifier}:`, error);
            return {
                allowed: true,
                remaining: limit,
                resetTime: Date.now() + windowMs,
                totalRequests: 1,
            };
        }
    }
    async slidingWindowCheck(identifier, limit, windowMs) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}sliding:${identifier}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        const client = this.redis.getClient();
        const pipeline = client.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zcard(key);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.expire(key, Math.ceil(windowMs / 1000));
        const results = await pipeline.exec();
        if (!results) {
            throw new Error('Redis pipeline failed');
        }
        const currentCount = results[1][1];
        const allowed = currentCount < limit;
        if (!allowed) {
            await client.zpopmax(key);
        }
        return {
            allowed,
            remaining: Math.max(0, limit - currentCount - (allowed ? 1 : 0)),
            resetTime: now + windowMs,
            totalRequests: currentCount + (allowed ? 1 : 0),
        };
    }
    async tokenBucketCheck(identifier, limit, windowMs) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}bucket:${identifier}`;
        const now = Date.now();
        const client = this.redis.getClient();
        const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or limit
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calcul du refill
      local elapsed = now - lastRefill
      local refillRate = limit / window
      local newTokens = math.min(limit, tokens + (elapsed * refillRate))
      
      if newTokens >= 1 then
        newTokens = newTokens - 1
        redis.call('HMSET', key, 'tokens', newTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {1, newTokens, now + window}
      else
        redis.call('HMSET', key, 'tokens', newTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {0, 0, now + ((1 - newTokens) / refillRate)}
      end
    `;
        const result = await client.eval(script, 1, key, limit, windowMs, now);
        return {
            allowed: result[0] === 1,
            remaining: Math.floor(result[1]),
            resetTime: result[2],
            totalRequests: limit - Math.floor(result[1]),
        };
    }
    async fixedWindowCheck(identifier, limit, windowMs) {
        const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}fixed:${identifier}:${windowStart}`;
        const client = this.redis.getClient();
        const current = await client.incr(key);
        if (current === 1) {
            await client.expire(key, Math.ceil(windowMs / 1000));
        }
        const allowed = current <= limit;
        return {
            allowed,
            remaining: Math.max(0, limit - current),
            resetTime: windowStart + windowMs,
            totalRequests: current,
        };
    }
    async checkIpLimit(ip, options = {}) {
        return this.checkLimit(`ip:${ip}`, options);
    }
    async checkUserLimit(userId, options = {}) {
        return this.checkLimit(`user:${userId}`, options);
    }
    async checkRouteLimit(ip, route, options = {}) {
        return this.checkLimit(`route:${route}:${ip}`, options);
    }
    async checkGlobalLimit(options = {}) {
        return this.checkLimit('global', options);
    }
    async checkAdaptiveLimit(identifier, baseLimit, windowMs, loadFactor = 1.0) {
        const adaptedLimit = Math.floor(baseLimit * (2 - loadFactor));
        return this.checkLimit(identifier, {
            limit: Math.max(1, adaptedLimit),
            windowMs,
        });
    }
    async isWhitelisted(identifier) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
        return await this.redis.exists(key);
    }
    async addToWhitelist(identifier, ttlSeconds) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
        await this.redis.set(key, '1', ttlSeconds);
        this.logger.log(`✅ Added to whitelist: ${identifier}`);
    }
    async removeFromWhitelist(identifier) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}whitelist:${identifier}`;
        await this.redis.del(key);
        this.logger.log(`❌ Removed from whitelist: ${identifier}`);
    }
    async addToBlacklist(identifier, ttlSeconds = 3600) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}blacklist:${identifier}`;
        await this.redis.set(key, '1', ttlSeconds);
        this.logger.warn(`🚫 Added to blacklist: ${identifier} for ${ttlSeconds}s`);
    }
    async isBlacklisted(identifier) {
        const key = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}blacklist:${identifier}`;
        return await this.redis.exists(key);
    }
    async resetLimit(identifier) {
        const patterns = [
            `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}sliding:${identifier}`,
            `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}bucket:${identifier}`,
            `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}fixed:${identifier}:*`,
        ];
        for (const pattern of patterns) {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map(key => this.redis.del(key)));
            }
        }
        this.logger.log(`🔄 Reset rate limit for: ${identifier}`);
    }
    async getStats(identifier) {
        const stats = {
            metrics: { ...this.metrics },
        };
        if (identifier) {
            stats.identifier = identifier;
            const keys = await this.redis.keys(`${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}*${identifier}*`);
            stats.currentRequests = keys.length;
        }
        else {
            const allKeys = await this.redis.keys(`${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}*`);
            stats.currentRequests = allKeys.length;
            const ipKeys = allKeys.filter(key => key.includes(':ip:'));
            stats.topLimitedIps = ipKeys.slice(0, 10);
        }
        return stats;
    }
    async cleanup() {
        const pattern = `${redis_constants_1.REDIS_PREFIXES.RATE_LIMIT}*`;
        const deletedKeys = await this.redis.cleanup(pattern);
        this.logger.log(`🧹 Rate limiting cleanup: ${deletedKeys} keys removed`);
        return deletedKeys;
    }
    getMetrics() {
        const total = this.metrics.totalRequests;
        return {
            ...this.metrics,
            blockRate: total > 0 ? parseFloat(((this.metrics.blockedRequests / total) * 100).toFixed(2)) : 0,
            allowRate: total > 0 ? parseFloat(((this.metrics.allowedRequests / total) * 100).toFixed(2)) : 0,
            errorRate: total > 0 ? parseFloat(((this.metrics.errorCount / total) * 100).toFixed(2)) : 0,
        };
    }
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            blockedRequests: 0,
            allowedRequests: 0,
            errorCount: 0,
        };
    }
};
exports.RateLimitingService = RateLimitingService;
exports.RateLimitingService = RateLimitingService = RateLimitingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RateLimitingService);
//# sourceMappingURL=rate-limiting.service.js.map