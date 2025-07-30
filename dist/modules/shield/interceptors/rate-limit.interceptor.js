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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimit = exports.RateLimitInterceptor = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const core_1 = require("@nestjs/core");
exports.RATE_LIMIT_KEY = 'rate_limit';
let RateLimitInterceptor = class RateLimitInterceptor {
    redis;
    reflector;
    logger;
    constructor(redis, reflector, loggerService) {
        this.redis = redis;
        this.reflector = reflector;
        this.logger = loggerService.createChildLogger('RateLimitInterceptor');
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const classContext = context.getClass();
        const rateLimitConfig = this.getRateLimitConfig(handler, classContext);
        if (!rateLimitConfig) {
            return next.handle();
        }
        const limitKey = this.generateLimitKey(request, rateLimitConfig);
        const isAllowed = await this.checkRateLimit(limitKey, rateLimitConfig);
        if (!isAllowed) {
            this.logRateLimitExceeded(request, rateLimitConfig, limitKey);
            throw new common_1.TooManyRequestsException(`Trop de requêtes. Limite: ${rateLimitConfig.limit} requêtes par ${rateLimitConfig.window} secondes`);
        }
        return next.handle();
    }
    getRateLimitConfig(handler, classContext) {
        return this.reflector.get(exports.RATE_LIMIT_KEY, handler) ||
            this.reflector.get(exports.RATE_LIMIT_KEY, classContext);
    }
    generateLimitKey(request, config) {
        if (config.custom_key_generator) {
            return config.custom_key_generator(request);
        }
        const baseKey = `rate_limit:${config.key}`;
        switch (config.key) {
            case 'ip':
                return `${baseKey}:${request.ip}`;
            case 'user':
                return `${baseKey}:${request.user?.id || 'anonymous'}`;
            case 'user_ip':
                return `${baseKey}:${request.user?.id || 'anonymous'}:${request.ip}`;
            case 'endpoint':
                return `${baseKey}:${request.method}:${request.path}`;
            default:
                return `${baseKey}:${request.ip}`;
        }
    }
    async checkRateLimit(key, config) {
        try {
            const windowKey = `${key}:${Math.floor(Date.now() / (config.window * 1000))}`;
            const count = await this.redis.incrementWithExpiry(windowKey, config.window);
            this.logger.info(`Rate limit check: ${windowKey} = ${count}/${config.limit}`);
            return count <= config.limit;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'RateLimitInterceptor.checkRateLimit', 'system', { key, config });
            return true;
        }
    }
    logRateLimitExceeded(request, config, key) {
        this.logger.logBusinessEvent('RATE_LIMIT_EXCEEDED', {
            user_id: request.user?.id || null,
            ip_address: request.ip,
            path: request.path,
            method: request.method,
            limit_key: key,
            limit_config: config,
            timestamp: new Date().toISOString(),
        }, request.user?.id || null);
    }
};
exports.RateLimitInterceptor = RateLimitInterceptor;
exports.RateLimitInterceptor = RateLimitInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        core_1.Reflector,
        logger_service_1.LoggerService])
], RateLimitInterceptor);
const common_2 = require("@nestjs/common");
const RateLimit = (config) => (0, common_2.SetMetadata)(exports.RATE_LIMIT_KEY, config);
exports.RateLimit = RateLimit;
//# sourceMappingURL=rate-limit.interceptor.js.map