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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_config_1 = __importStar(require("./prisma/prisma.config"));
const redis_config_1 = __importStar(require("./redis/redis.config"));
const bullmq_config_1 = __importStar(require("./bullmq/bullmq.config"));
const email_config_1 = __importStar(require("./email/email.config"));
const logger_config_1 = __importStar(require("./logger/logger.config"));
const swagger_config_1 = __importStar(require("./swagger/swagger.config"));
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const bullmq_module_1 = require("./bullmq/bullmq.module");
const email_module_1 = require("./email/email.module");
const logger_module_1 = require("./logger/logger.module");
const rate_limiting_module_1 = require("./rate-limiting/rate-limiting.module");
const swagger_module_1 = require("./swagger/swagger.module");
const hashing_module_1 = require("./hashing/hashing.module");
const prisma_service_1 = require("./prisma/prisma.service");
const redis_service_1 = require("./redis/redis.service");
const bullmq_service_1 = require("./bullmq/bullmq.service");
const email_service_1 = require("./email/email.service");
const logger_service_1 = require("./logger/logger.service");
const rate_limiting_service_1 = require("./rate-limiting/rate-limiting.service");
const swagger_service_1 = require("./swagger/swagger.service");
const email_processor_1 = require("./email/email.processor");
const rate_limiting_guard_1 = require("./rate-limiting/rate-limiting.guard");
let SharedModule = class SharedModule {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.log('🚀 SharedModule initialized with grade A+ features');
        this.logConfiguration();
    }
    logConfiguration() {
        const config = {
            nodeEnv: process.env.NODE_ENV,
            database: process.env.DATABASE_URL ? 'configured' : 'missing',
            redis: process.env.REDIS_HOST ? 'configured' : 'missing',
            email: process.env.EMAIL_HOST ? 'configured' : 'missing',
            logging: process.env.LOG_LEVEL || 'info',
            rateLimiting: 'redis-based',
            queues: 'bullmq',
            documentation: process.env.SWAGGER_ENABLED !== 'false' ? 'enabled' : 'disabled',
        };
        this.logger.log('📋 SharedModule configuration:', JSON.stringify(config));
    }
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    `.env.${process.env.NODE_ENV || 'development'}`,
                    '.env.local',
                    '.env'
                ],
                load: [
                    prisma_config_1.default,
                    redis_config_1.default,
                    bullmq_config_1.default,
                    email_config_1.default,
                    logger_config_1.default,
                    swagger_config_1.default,
                ],
                validationSchema: prisma_config_1.prismaValidationSchema
                    .concat(redis_config_1.redisValidationSchema)
                    .concat(bullmq_config_1.bullmqValidationSchema)
                    .concat(email_config_1.emailValidationSchema)
                    .concat(logger_config_1.loggerValidationSchema)
                    .concat(swagger_config_1.swaggerValidationSchema),
                validationOptions: {
                    abortEarly: false,
                    allowUnknown: true,
                    stripUnknown: true,
                },
                cache: true,
                expandVariables: true,
            }),
            logger_module_1.LoggerModule,
            redis_module_1.RedisModule,
            prisma_module_1.PrismaModule,
            bullmq_module_1.BullmqModule,
            email_module_1.EmailModule,
            rate_limiting_module_1.RateLimitingModule,
            swagger_module_1.SwaggerModule,
            hashing_module_1.HashingModule,
        ],
        providers: [
            prisma_service_1.PrismaService,
            redis_service_1.RedisService,
            bullmq_service_1.BullmqService,
            email_service_1.EmailService,
            logger_service_1.LoggerService,
            rate_limiting_service_1.RateLimitingService,
            swagger_service_1.SwaggerService,
            email_processor_1.EmailProcessor,
            rate_limiting_guard_1.RateLimitingGuard,
            {
                provide: 'APP_METRICS',
                useFactory: (prisma, redis, bullmq, email, rateLimiting) => ({
                    prisma: () => prisma.getMetrics(),
                    redis: () => redis.getMetrics(),
                    bullmq: () => bullmq.getMetrics(),
                    email: () => email.getMetrics(),
                    rateLimiting: () => rateLimiting.getMetrics(),
                }),
                inject: [
                    prisma_service_1.PrismaService,
                    redis_service_1.RedisService,
                    bullmq_service_1.BullmqService,
                    email_service_1.EmailService,
                    rate_limiting_service_1.RateLimitingService,
                ],
            },
            {
                provide: 'APP_HEALTH',
                useFactory: (prisma, redis, email, logger) => ({
                    async checkHealth() {
                        try {
                            const [prismaHealth, redisHealth, emailHealth] = await Promise.all([
                                prisma.healthCheck(),
                                redis.ping(),
                                email.testConnection(),
                            ]);
                            const services = {
                                prisma: prismaHealth.status,
                                redis: redisHealth === 'PONG' ? 'healthy' : 'unhealthy',
                                email: emailHealth ? 'healthy' : 'unhealthy',
                            };
                            const hasUnhealthy = Object.values(services).some(status => status === 'unhealthy');
                            const globalStatus = hasUnhealthy ? 'unhealthy' : 'healthy';
                            const health = {
                                status: globalStatus,
                                timestamp: new Date().toISOString(),
                                services,
                            };
                            logger.logHealthCheck('SharedModule', globalStatus, health.services);
                            return health;
                        }
                        catch (error) {
                            logger.logHealthCheck('SharedModule', 'unhealthy', { error: error.message });
                            throw error;
                        }
                    },
                }),
                inject: [prisma_service_1.PrismaService, redis_service_1.RedisService, email_service_1.EmailService, logger_service_1.LoggerService],
            },
        ],
        exports: [
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            bullmq_module_1.BullmqModule,
            email_module_1.EmailModule,
            logger_module_1.LoggerModule,
            rate_limiting_module_1.RateLimitingModule,
            swagger_module_1.SwaggerModule,
            hashing_module_1.HashingModule,
            prisma_service_1.PrismaService,
            redis_service_1.RedisService,
            bullmq_service_1.BullmqService,
            email_service_1.EmailService,
            logger_service_1.LoggerService,
            rate_limiting_service_1.RateLimitingService,
            swagger_service_1.SwaggerService,
            email_processor_1.EmailProcessor,
            rate_limiting_guard_1.RateLimitingGuard,
            'APP_METRICS',
            'APP_HEALTH',
        ],
    }),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], SharedModule);
//# sourceMappingURL=shared.module.js.map