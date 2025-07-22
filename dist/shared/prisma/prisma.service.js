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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_constants_1 = require("./prisma.constants");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    configService;
    logger = new common_1.Logger(PrismaService_1.name);
    metrics = {
        queryCount: 0,
        errorCount: 0,
        totalQueryTime: 0,
        avgQueryTime: 0,
        transactionCount: 0,
        connectionCount: 0,
        retryCount: 0
    };
    constructor(configService) {
        const config = configService.get(prisma_constants_1.PRISMA_CONFIG_NAMESPACE);
        super({
            datasources: {
                db: {
                    url: config.databaseUrl,
                },
            },
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
        });
        this.configService = configService;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.$on('query', (event) => {
            this.metrics.queryCount++;
            this.metrics.totalQueryTime += event.duration;
            this.metrics.avgQueryTime = this.metrics.totalQueryTime / this.metrics.queryCount;
            if (event.duration > 1000) {
                this.logger.warn(`🐌 Query lente détectée: ${event.duration}ms - ${event.query}`);
            }
            if (event.duration > 5000) {
                this.logger.error(`🚨 Query très lente: ${event.duration}ms - ${event.query}`, {
                    duration: event.duration,
                    query: event.query,
                    params: event.params
                });
            }
        });
        this.$on('error', (event) => {
            this.metrics.errorCount++;
            this.logger.error(`❌ Erreur Prisma: ${event.message}`, {
                target: event.target,
                timestamp: event.timestamp
            });
        });
        this.$on('info', (event) => {
            this.logger.log(`ℹ️ Info Prisma: ${event.message}`, {
                target: event.target,
                timestamp: event.timestamp
            });
        });
        this.$on('warn', (event) => {
            this.logger.warn(`⚠️ Warning Prisma: ${event.message}`, {
                target: event.target,
                timestamp: event.timestamp
            });
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.metrics.connectionCount++;
            this.logger.log('🔗 Connexion à la base de données établie');
            const healthCheck = await this.healthCheck();
            if (healthCheck.status === 'healthy') {
                this.logger.log('✅ Base de données opérationnelle');
            }
            else {
                this.logger.warn('⚠️ Problème de santé détecté sur la base de données');
            }
        }
        catch (error) {
            this.logger.error('❌ Échec de connexion à la base de données', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('🔌 Connexion à la base de données fermée');
            this.logger.log('📊 Métriques finales Prisma:', {
                totalQueries: this.metrics.queryCount,
                totalErrors: this.metrics.errorCount,
                averageQueryTime: Math.round(this.metrics.avgQueryTime),
                totalTransactions: this.metrics.transactionCount,
                totalRetries: this.metrics.retryCount
            });
        }
        catch (error) {
            this.logger.error('❌ Erreur lors de la fermeture de connexion', error);
        }
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.$queryRaw `SELECT 1`;
            const duration = Date.now() - start;
            const isHealthy = duration < 5000;
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                message: isHealthy
                    ? `Base de données réactive (${duration}ms)`
                    : `Base de données lente (${duration}ms)`,
                timestamp: new Date(),
                metrics: { ...this.metrics }
            };
        }
        catch (error) {
            this.logger.error('❌ Health check failed', error);
            return {
                status: 'unhealthy',
                message: `Erreur de connexion: ${error.message}`,
                timestamp: new Date(),
                metrics: { ...this.metrics }
            };
        }
    }
    async paginate(model, args, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const take = Math.min(limit, 100);
        const [data, total] = await Promise.all([
            model.findMany({
                ...args,
                skip,
                take,
            }),
            model.count({
                where: args.where,
            }),
        ]);
        const totalPages = Math.ceil(total / take);
        return {
            data,
            total,
            page,
            limit: take,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async paginateWithCursor(model, args, limit = 20) {
        const take = Math.min(limit + 1, 100);
        const results = await model.findMany({
            ...args,
            take,
        });
        const hasNext = results.length > limit;
        const data = hasNext ? results.slice(0, -1) : results;
        const nextCursor = hasNext ? results[results.length - 2] : null;
        return {
            data,
            nextCursor,
            hasNext,
        };
    }
    async executeWithRetry(operation, maxRetries = 3, delayMs = 1000, backoffMultiplier = 2) {
        let lastError;
        let delay = delayMs;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    this.metrics.retryCount++;
                    this.logger.log(`✅ Opération réussie après ${attempt} tentative(s)`);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (this.isNonRetryableError(error)) {
                    throw error;
                }
                if (attempt === maxRetries) {
                    this.logger.error(`❌ Échec après ${maxRetries} tentatives`, error);
                    break;
                }
                this.logger.warn(`⚠️ Tentative ${attempt} échouée, retry dans ${delay}ms`, {
                    error: error.message,
                    attempt,
                    maxRetries
                });
                await this.delay(delay);
                delay *= backoffMultiplier;
            }
        }
        throw lastError;
    }
    async transactionWithRetry(operation, maxRetries = 3) {
        return this.executeWithRetry(() => {
            this.metrics.transactionCount++;
            return this.$transaction(operation);
        }, maxRetries);
    }
    isNonRetryableError(error) {
        if (error.code === 'P2002')
            return true;
        if (error.code === 'P2025')
            return true;
        if (error.code === 'P2003')
            return true;
        if (error.code === 'P2004')
            return true;
        if (error.code?.startsWith('P1'))
            return true;
        return false;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getMetrics() {
        return {
            ...this.metrics,
            uptimeSeconds: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date()
        };
    }
    resetMetrics() {
        this.metrics = {
            queryCount: 0,
            errorCount: 0,
            totalQueryTime: 0,
            avgQueryTime: 0,
            transactionCount: 0,
            connectionCount: 0,
            retryCount: 0
        };
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map