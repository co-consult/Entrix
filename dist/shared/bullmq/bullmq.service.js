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
var BullmqService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullmqService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const redis_service_1 = require("../redis/redis.service");
const logger_service_1 = require("../logger/logger.service");
const bullmq_constants_1 = require("./bullmq.constants");
let BullmqService = BullmqService_1 = class BullmqService {
    configService;
    redisService;
    loggerService;
    logger = new common_1.Logger(BullmqService_1.name);
    queues = new Map();
    workers = new Map();
    queueEvents = new Map();
    config;
    metrics = {
        jobsCreated: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        jobsActive: 0,
        jobsWaiting: 0,
        jobsDelayed: 0,
        totalProcessingTime: 0,
        avgProcessingTime: 0,
    };
    constructor(configService, redisService, loggerService) {
        this.configService = configService;
        this.redisService = redisService;
        this.loggerService = loggerService;
        this.config = this.configService.get(bullmq_constants_1.BULLMQ_CONFIG_NAMESPACE);
    }
    async onModuleInit() {
        try {
            await this.createQueues();
            await this.initializeDefaultWorkers();
            this.logger.log('✅ BullMQ service initialized successfully');
            this.startMetricsCollection();
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize BullMQ service:', error);
            throw error;
        }
    }
    async createQueues() {
        const connectionOptions = {
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            ...(this.config.redis.tls && { tls: {} }),
        };
        const queueOptions = {
            connection: connectionOptions,
            defaultJobOptions: {
                ...bullmq_constants_1.DEFAULT_JOB_OPTIONS,
                removeOnComplete: 100,
                removeOnFail: 50,
            },
        };
        for (const queueName of Object.values(bullmq_constants_1.QUEUE_NAMES)) {
            const queue = new bullmq_1.Queue(queueName, queueOptions);
            this.queues.set(queueName, queue);
            const queueEvents = new bullmq_1.QueueEvents(queueName, {
                connection: connectionOptions,
            });
            this.queueEvents.set(queueName, queueEvents);
            this.setupQueueEventListeners(queueEvents, queueName);
            this.logger.log(`📦 Queue created: ${queueName}`);
        }
    }
    setupQueueEventListeners(queueEvents, queueName) {
        queueEvents.on('waiting', ({ jobId }) => {
            this.metrics.jobsWaiting++;
            this.loggerService.logJobEvent('created', 'job', jobId, undefined, {
                queueName,
                status: 'waiting',
            });
        });
        queueEvents.on('active', ({ jobId }) => {
            this.metrics.jobsActive++;
            this.loggerService.logJobEvent('processing', 'job', jobId, undefined, {
                queueName,
                status: 'active',
            });
        });
        queueEvents.on('completed', ({ jobId, returnvalue }) => {
            this.metrics.jobsCompleted++;
            this.metrics.jobsActive--;
            this.loggerService.logJobEvent('completed', 'job', jobId, undefined, {
                queueName,
                result: returnvalue,
                status: 'completed',
            });
        });
        queueEvents.on('failed', ({ jobId, failedReason }) => {
            this.metrics.jobsFailed++;
            this.metrics.jobsActive--;
            this.loggerService.logJobEvent('failed', 'job', jobId, undefined, {
                queueName,
                error: failedReason,
                status: 'failed',
            });
        });
        queueEvents.on('delayed', ({ jobId, delay }) => {
            this.metrics.jobsDelayed++;
            this.loggerService.logJobEvent('created', 'job', jobId, undefined, {
                queueName,
                delay,
                status: 'delayed',
            });
        });
        queueEvents.on('error', (err) => {
            this.logger.error(`❌ Queue error for ${queueName}:`, err);
            this.loggerService.logErrorEvent(err, 'BullMQQueue', undefined, {
                queueName,
            });
        });
    }
    async initializeDefaultWorkers() {
        await this.createWorker(bullmq_constants_1.QUEUE_NAMES.EMAIL, async (job) => {
            this.logger.log(`Processing email job: ${job.name}`, job.data);
            return { processed: true };
        });
        await this.createWorker(bullmq_constants_1.QUEUE_NAMES.NOTIFICATIONS, async (job) => {
            this.logger.log(`Processing notification job: ${job.name}`, job.data);
            return { processed: true };
        });
        await this.createWorker(bullmq_constants_1.QUEUE_NAMES.PAYMENTS, async (job) => {
            this.logger.log(`Processing payment job: ${job.name}`, job.data);
            return { processed: true };
        });
        await this.createWorker(bullmq_constants_1.QUEUE_NAMES.REPORTS, async (job) => {
            this.logger.log(`Processing report job: ${job.name}`, job.data);
            return { processed: true };
        });
    }
    async addJob(queueName, jobType, data, options = {}) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        this.metrics.jobsCreated++;
        const jobOptions = {
            ...bullmq_constants_1.DEFAULT_JOB_OPTIONS,
            ...options,
        };
        const job = await queue.add(jobType, data, jobOptions);
        this.loggerService.logJobEvent('created', jobType, job.id, undefined, {
            queueName,
            data,
            options: jobOptions,
        });
        return job;
    }
    async addPriorityJob(queueName, jobType, data, priority, options = {}) {
        return this.addJob(queueName, jobType, data, {
            ...options,
            priority: bullmq_constants_1.JOB_PRIORITIES[priority],
        });
    }
    async addDelayedJob(queueName, jobType, data, delayMs, options = {}) {
        return this.addJob(queueName, jobType, data, {
            ...options,
            delay: delayMs,
        });
    }
    async addRecurringJob(queueName, jobType, data, cronExpression, options = {}) {
        return this.addJob(queueName, jobType, data, {
            ...options,
            repeat: {
                pattern: cronExpression,
            },
        });
    }
    async createWorker(queueName, processor, concurrency) {
        const connectionOptions = {
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            ...(this.config.redis.tls && { tls: {} }),
        };
        const worker = new bullmq_1.Worker(queueName, processor, {
            connection: connectionOptions,
            concurrency: concurrency || this.config.concurrency,
        });
        worker.on('completed', (job, result) => {
            this.logger.log(`✅ Job completed: ${job.name} (${job.id})`);
        });
        worker.on('failed', (job, err) => {
            this.logger.error(`❌ Job failed: ${job.name} (${job.id}):`, err);
        });
        worker.on('error', (err) => {
            this.logger.error(`❌ Worker error for queue ${queueName}:`, err);
        });
        this.workers.set(queueName, worker);
        this.logger.log(`👷 Worker created for queue: ${queueName}`);
        return worker;
    }
    async sendWelcomeEmail(userId, email, firstName) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, bullmq_constants_1.JOB_TYPES.EMAIL.SEND_WELCOME, { userId, email, firstName }, 'HIGH');
    }
    async sendVerificationEmail(userId, email, token) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, bullmq_constants_1.JOB_TYPES.EMAIL.SEND_VERIFICATION, { userId, email, token }, 'HIGH');
    }
    async sendPasswordResetEmail(userId, email, token) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, bullmq_constants_1.JOB_TYPES.EMAIL.SEND_PASSWORD_RESET, { userId, email, token }, 'HIGH');
    }
    async sendTicketEmail(orderId, userId, email, ticketData) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.EMAIL, bullmq_constants_1.JOB_TYPES.EMAIL.SEND_TICKET, { orderId, userId, email, ticketData }, 'CRITICAL');
    }
    async processPayment(paymentData) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.PAYMENTS, bullmq_constants_1.JOB_TYPES.PAYMENTS.PROCESS_PAYMENT, paymentData, 'CRITICAL');
    }
    async generateSalesReport(reportData) {
        return this.addJob(bullmq_constants_1.QUEUE_NAMES.REPORTS, bullmq_constants_1.JOB_TYPES.REPORTS.GENERATE_SALES_REPORT, reportData, { delay: 5000 });
    }
    async sendPushNotification(notificationData) {
        return this.addPriorityJob(bullmq_constants_1.QUEUE_NAMES.NOTIFICATIONS, bullmq_constants_1.JOB_TYPES.NOTIFICATIONS.PUSH_NOTIFICATION, notificationData, 'HIGH');
    }
    getQueue(queueName) {
        return this.queues.get(queueName);
    }
    getWorker(queueName) {
        return this.workers.get(queueName);
    }
    async getQueueStats(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue not found: ${queueName}`);
        }
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed(),
        ]);
        return {
            queueName,
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
            total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        };
    }
    getMetrics() {
        return {
            ...this.metrics,
            avgProcessingTime: parseFloat(this.metrics.avgProcessingTime.toFixed(2)),
            successRate: this.metrics.jobsCreated > 0
                ? parseFloat(((this.metrics.jobsCompleted / this.metrics.jobsCreated) * 100).toFixed(2))
                : 0,
            failureRate: this.metrics.jobsCreated > 0
                ? parseFloat(((this.metrics.jobsFailed / this.metrics.jobsCreated) * 100).toFixed(2))
                : 0,
        };
    }
    async cleanupQueues() {
        for (const [queueName, queue] of this.queues) {
            await queue.clean(24 * 60 * 60 * 1000, 100);
            this.logger.log(`🧹 Cleaned queue: ${queueName}`);
        }
    }
    async pauseQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (queue) {
            await queue.pause();
            this.logger.log(`⏸️ Queue paused: ${queueName}`);
        }
    }
    async resumeQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (queue) {
            await queue.resume();
            this.logger.log(`▶️ Queue resumed: ${queueName}`);
        }
    }
    startMetricsCollection() {
        setInterval(async () => {
            try {
                for (const [queueName, queue] of this.queues) {
                    const stats = await this.getQueueStats(queueName);
                    this.loggerService.logMetrics(`BullMQ-${queueName}`, stats);
                }
            }
            catch (error) {
                this.logger.error('Error collecting metrics:', error);
            }
        }, 60000);
    }
    async onModuleDestroy() {
        try {
            const metrics = this.getMetrics();
            this.logger.log(`📊 Final BullMQ metrics: ${JSON.stringify(metrics)}`);
            for (const [queueName, worker] of this.workers) {
                await worker.close();
                this.logger.log(`👷 Worker closed: ${queueName}`);
            }
            for (const [queueName, queueEvents] of this.queueEvents) {
                await queueEvents.close();
                this.logger.log(`📡 QueueEvents closed: ${queueName}`);
            }
            for (const [queueName, queue] of this.queues) {
                await queue.close();
                this.logger.log(`📦 Queue closed: ${queueName}`);
            }
            this.logger.log('🔒 BullMQ service shutdown complete');
        }
        catch (error) {
            this.logger.error('❌ Error during BullMQ shutdown:', error);
        }
    }
};
exports.BullmqService = BullmqService;
exports.BullmqService = BullmqService = BullmqService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], BullmqService);
//# sourceMappingURL=bullmq.service.js.map