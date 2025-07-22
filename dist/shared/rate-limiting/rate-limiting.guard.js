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
var RateLimitingGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingGuard = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limiting_service_1 = require("./rate-limiting.service");
const logger_service_1 = require("../logger/logger.service");
const interfaces_1 = require("./interfaces");
exports.RATE_LIMIT_KEY = 'rate_limit_options';
let RateLimitingGuard = RateLimitingGuard_1 = class RateLimitingGuard {
    rateLimitingService;
    reflector;
    loggerService;
    logger = new common_1.Logger(RateLimitingGuard_1.name);
    constructor(rateLimitingService, reflector, loggerService) {
        this.rateLimitingService = rateLimitingService;
        this.reflector = reflector;
        this.loggerService = loggerService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const options = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler()) || {};
        if (options.skip) {
            return true;
        }
        try {
            const identifier = this.generateIdentifier(request, options);
            if (await this.rateLimitingService.isWhitelisted(identifier)) {
                this.setHeaders(response, {
                    allowed: true,
                    remaining: options.limit || interfaces_1.DEFAULT_RATE_LIMIT,
                    resetTime: Date.now() + (options.windowMs || interfaces_1.DEFAULT_WINDOW_MS),
                    totalRequests: 0,
                });
                return true;
            }
            if (await this.rateLimitingService.isBlacklisted(identifier)) {
                this.logSecurityEvent(request, identifier, 'blacklisted');
                this.throwRateLimitException(interfaces_1.RATE_LIMIT_MESSAGES.BLACKLISTED, 0);
            }
            const result = await this.rateLimitingService.checkLimit(identifier, options);
            this.setHeaders(response, result);
            if (!result.allowed) {
                this.logRateLimitExceeded(request, identifier, result);
                this.throwRateLimitException(options.message || interfaces_1.RATE_LIMIT_MESSAGES.EXCEEDED, Math.ceil((result.resetTime - Date.now()) / 1000));
            }
            this.loggerService.debug(`Rate limit check passed for ${identifier}`, JSON.stringify({
                identifier,
                remaining: result.remaining,
                totalRequests: result.totalRequests,
            }));
            return true;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error('Rate limiting system error:', error);
            this.loggerService.logErrorEvent(error, 'RateLimitingGuard', this.extractUserId(request), {
                ip: this.getClientIp(request),
                userAgent: request.headers['user-agent'],
                url: request.url,
            });
            return true;
        }
    }
    generateIdentifier(request, options) {
        if (options.keyGenerator) {
            return options.keyGenerator(request);
        }
        const ip = this.getClientIp(request);
        const userId = this.extractUserId(request);
        const route = this.getRoutePattern(request);
        if (userId) {
            return `user:${userId}:${route}`;
        }
        return `ip:${ip}:${route}`;
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        const realIp = request.headers['x-real-ip'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        if (realIp) {
            return realIp;
        }
        return request.socket.remoteAddress || request.ip || 'unknown';
    }
    extractUserId(request) {
        const user = request.user;
        if (user && user.id) {
            return user.id;
        }
        const session = request.session;
        if (session && session.userId) {
            return session.userId;
        }
        return null;
    }
    getRoutePattern(request) {
        const route = request.route;
        if (route && route.path) {
            return `${request.method}:${route.path}`;
        }
        const url = request.url.split('?')[0];
        return `${request.method}:${url}`;
    }
    setHeaders(response, result) {
        response.set(interfaces_1.RATE_LIMIT_HEADERS.limit, result.limit?.toString() || '');
        response.set(interfaces_1.RATE_LIMIT_HEADERS.remaining, result.remaining.toString());
        response.set(interfaces_1.RATE_LIMIT_HEADERS.reset, Math.ceil(result.resetTime / 1000).toString());
        if (!result.allowed) {
            const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
            response.set(interfaces_1.RATE_LIMIT_HEADERS.retryAfter, retryAfter.toString());
        }
    }
    throwRateLimitException(message, retryAfter) {
        throw new common_1.HttpException({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message,
            retryAfter,
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
    logRateLimitExceeded(request, identifier, result) {
        const ip = this.getClientIp(request);
        const userId = this.extractUserId(request);
        const userAgent = request.headers['user-agent'];
        const url = request.url;
        this.loggerService.logSecurityEvent('RATE_LIMIT_EXCEEDED', userId, ip, userAgent, {
            identifier,
            url,
            method: request.method,
            remaining: result.remaining,
            totalRequests: result.totalRequests,
            resetTime: new Date(result.resetTime),
        });
    }
    logSecurityEvent(request, identifier, eventType) {
        const ip = this.getClientIp(request);
        const userId = this.extractUserId(request);
        const userAgent = request.headers['user-agent'];
        this.loggerService.logSecurityEvent(`RATE_LIMIT_${eventType.toUpperCase()}`, userId, ip, userAgent, {
            identifier,
            url: request.url,
            method: request.method,
        });
    }
};
exports.RateLimitingGuard = RateLimitingGuard;
exports.RateLimitingGuard = RateLimitingGuard = RateLimitingGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limiting_service_1.RateLimitingService,
        core_1.Reflector,
        logger_service_1.LoggerService])
], RateLimitingGuard);
//# sourceMappingURL=rate-limiting.guard.js.map