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
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../../shared/logger/logger.service");
let LoggingInterceptor = class LoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.setContext('HTTP');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, body, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const ip = request.ip || request.connection.remoteAddress;
        const userId = request.user?.id;
        const now = Date.now();
        this.logger.debug(`Incoming Request: ${method} ${url} - IP: ${ip} - User: ${userId || 'anonymous'}`);
        if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
            const sanitizedBody = this.sanitizeBody(body);
            this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const responseTime = Date.now() - now;
                const { statusCode } = response;
                this.logger.log(method, url, statusCode, responseTime, userId);
                if (responseTime > 1000) {
                    this.logger.warn(`Slow request detected: ${method} ${url} took ${responseTime}ms`);
                }
            },
            error: (error) => {
                const responseTime = Date.now() - now;
                const statusCode = error.status || 500;
                this.logger.log(method, url, statusCode, responseTime, userId);
                this.logger.error(`Request failed: ${method} ${url} - Status: ${statusCode} - ${error.message}`, error.stack);
            },
        }));
    }
    sanitizeBody(body) {
        const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];
        const sanitized = { ...body };
        sensitiveFields.forEach((field) => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map