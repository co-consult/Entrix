"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston_1 = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logger_constants_1 = require("./logger.constants");
let LoggerService = LoggerService_1 = class LoggerService {
    configService;
    logger;
    context = 'Application';
    constructor(configService) {
        this.configService = configService;
        this.setupLogger();
    }
    setupLogger() {
        const config = this.configService.get(logger_constants_1.LOGGER_CONFIG_NAMESPACE);
        const logTransports = [];
        let logFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.format.errors({ stack: true }), winston_1.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }));
        if (config.format === 'simple') {
            logFormat = winston_1.format.combine(logFormat, winston_1.format.printf(({ level, message, timestamp, context, ...meta }) => {
                return `[${timestamp}] ${level.toUpperCase()}: ${context ? `[${context}] ` : ''}${message}`;
            }));
        }
        else if (config.format === 'pretty') {
            logFormat = winston_1.format.combine(logFormat, winston_1.format.colorize(), winston_1.format.printf(({ level, message, timestamp, context, ...meta }) => {
                const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
                return `[${timestamp}] ${level}: ${context ? `[${context}] ` : ''}${message}${metaStr}`;
            }));
        }
        else {
            logFormat = winston_1.format.combine(logFormat, winston_1.format.json());
        }
        if (config.enableConsole) {
            logTransports.push(new winston_1.transports.Console({
                level: config.level,
                format: logFormat,
                handleExceptions: true,
                handleRejections: true,
            }));
        }
        if (config.enableFile && config.filePath) {
            logTransports.push(new winston_daily_rotate_file_1.default({
                filename: config.filePath,
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: config.maxSize || '10m',
                maxFiles: config.maxFiles || '30d',
                level: config.level,
                format: logFormat,
                handleExceptions: true,
                handleRejections: true,
            }));
            logTransports.push(new winston_daily_rotate_file_1.default({
                filename: config.filePath.replace('%DATE%', 'error-%DATE%'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: config.maxSize || '10m',
                maxFiles: config.maxFiles || '30d',
                level: 'error',
                format: logFormat,
                handleExceptions: true,
                handleRejections: true,
            }));
            logTransports.push(new winston_daily_rotate_file_1.default({
                filename: config.filePath.replace('%DATE%', 'business-%DATE%'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: config.maxSize || '10m',
                maxFiles: config.maxFiles || '30d',
                level: 'info',
                format: logFormat,
                handleExceptions: true,
                handleRejections: true,
            }));
        }
        this.logger = winston_1.default.createLogger({
            level: config.level,
            format: logFormat,
            transports: logTransports,
            exitOnError: false,
            defaultMeta: {
                service: 'entrix-backend',
                environment: process.env.NODE_ENV || 'development',
            },
        });
        this.logger.info('🚀 Logger service initialized', {
            level: config.level,
            format: config.format,
            transports: logTransports.length,
        });
    }
    setContext(context) {
        this.context = context;
    }
    createChildLogger(context) {
        const childLogger = new LoggerService_1(this.configService);
        childLogger.setContext(context);
        return childLogger;
    }
    log(message, context, ...meta) {
        this.logger.info(message, {
            context: context || this.context,
            ...meta,
        });
    }
    info(message, context, ...meta) {
        this.logger.info(message, {
            context: context || this.context,
            ...meta,
        });
    }
    warn(message, context, ...meta) {
        this.logger.warn(message, {
            context: context || this.context,
            ...meta,
        });
    }
    error(message, trace, context, ...meta) {
        this.logger.error(message, {
            context: context || this.context,
            trace,
            ...meta,
        });
    }
    debug(message, context, ...meta) {
        this.logger.debug(message, {
            context: context || this.context,
            ...meta,
        });
    }
    verbose(message, context, ...meta) {
        this.logger.verbose(message, {
            context: context || this.context,
            ...meta,
        });
    }
    logBusinessEvent(event, data, userId, organizerId, metadata) {
        this.logger.info(`[BUSINESS] ${event}`, {
            context: 'BusinessEvent',
            eventType: event,
            userId,
            organizerId,
            data,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logPaymentEvent(orderId, amount, currency = 'TND', status, provider, metadata) {
        this.logger.info(`[PAYMENT] ${status.toUpperCase()}`, {
            context: 'PaymentEvent',
            orderId,
            amount,
            currency,
            status,
            provider,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logSecurityEvent(event, userId, ip, userAgent, metadata) {
        this.logger.warn(`[SECURITY] ${event}`, {
            context: 'SecurityEvent',
            eventType: event,
            userId,
            ip,
            userAgent,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logAuthEvent(event, userId, email, ip, userAgent, metadata) {
        const level = event === 'failed_login' ? 'warn' : 'info';
        this.logger[level](`[AUTH] ${event.toUpperCase()}`, {
            context: 'AuthEvent',
            eventType: event,
            userId,
            email,
            ip,
            userAgent,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logPerformanceEvent(operation, duration, metadata) {
        const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
        this.logger[level](`[PERFORMANCE] ${operation}`, {
            context: 'PerformanceEvent',
            operation,
            duration,
            slow: duration > 1000,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logErrorEvent(error, context, userId, metadata) {
        this.logger.error(`[ERROR] ${error.message}`, {
            context: context || 'ErrorEvent',
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack,
            userId,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logApiEvent(method, url, statusCode, duration, userId, ip, userAgent, metadata) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        this.logger[level](`[API] ${method} ${url}`, {
            context: 'ApiEvent',
            method,
            url,
            statusCode,
            duration,
            userId,
            ip,
            userAgent,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logCacheEvent(event, key, ttl, metadata) {
        this.logger.debug(`[CACHE] ${event.toUpperCase()}`, {
            context: 'CacheEvent',
            eventType: event,
            key,
            ttl,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logJobEvent(event, jobType, jobId, duration, metadata) {
        const level = event === 'failed' ? 'error' : event === 'retry' ? 'warn' : 'info';
        this.logger[level](`[JOB] ${event.toUpperCase()}`, {
            context: 'JobEvent',
            eventType: event,
            jobType,
            jobId,
            duration,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logWebhookEvent(event, provider, webhookType, webhookId, metadata) {
        const level = event === 'failed' ? 'error' : event === 'retry' ? 'warn' : 'info';
        this.logger[level](`[WEBHOOK] ${event.toUpperCase()}`, {
            context: 'WebhookEvent',
            eventType: event,
            provider,
            webhookType,
            webhookId,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logNotificationEvent(event, type, recipient, notificationId, metadata) {
        const level = event === 'failed' ? 'error' : 'info';
        this.logger[level](`[NOTIFICATION] ${event.toUpperCase()}`, {
            context: 'NotificationEvent',
            eventType: event,
            type,
            recipient,
            notificationId,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    startOperation(operationName, metadata) {
        const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.logger.info(`[OPERATION] START ${operationName}`, {
            context: 'OperationEvent',
            operationId,
            operationName,
            metadata,
            timestamp: new Date().toISOString(),
        });
        return operationId;
    }
    endOperation(operationName, operationId, success, duration, metadata) {
        const level = success ? 'info' : 'error';
        this.logger[level](`[OPERATION] END ${operationName}`, {
            context: 'OperationEvent',
            operationId,
            operationName,
            success,
            duration,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    logStructured(level, message, data) {
        this.logger[level](message, {
            context: this.context,
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    logMetrics(component, metrics) {
        this.logger.info(`[METRICS] ${component}`, {
            context: 'MetricsEvent',
            component,
            metrics,
            timestamp: new Date().toISOString(),
        });
    }
    logHealthCheck(component, status, details) {
        const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
        this.logger[level](`[HEALTH] ${component}`, {
            context: 'HealthEvent',
            component,
            status,
            details,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map