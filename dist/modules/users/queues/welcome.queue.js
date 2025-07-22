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
exports.WelcomeQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let WelcomeQueue = class WelcomeQueue {
    bullmq;
    logger;
    constructor(bullmq, logger) {
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('WelcomeQueue');
    }
    async sendWelcomeEmail(data, delay) {
        try {
            this.logger.info('Scheduling welcome email job', JSON.stringify({
                userId: data.userId,
                email: data.email,
                delay: delay || 0,
            }));
            if (delay && delay > 0) {
                await this.bullmq.addDelayedJob('email', 'send-welcome-email', data, delay);
            }
            else {
                await this.bullmq.addPriorityJob('email', 'send-welcome-email', data, 'HIGH');
            }
            this.logger.info('Welcome email job scheduled successfully', JSON.stringify({
                userId: data.userId,
                jobType: 'send-welcome-email',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule welcome email job', error.stack, JSON.stringify({ userId: data.userId, email: data.email }));
            throw error;
        }
    }
    async sendOnboardingCompleteEmail(data) {
        try {
            this.logger.info('Scheduling onboarding complete email job', JSON.stringify({
                userId: data.userId,
                completionPercentage: data.completionPercentage,
            }));
            await this.bullmq.addPriorityJob('email', 'send-onboarding-complete-email', data, 'NORMAL');
            this.logger.info('Onboarding complete email job scheduled successfully', JSON.stringify({
                userId: data.userId,
                jobType: 'send-onboarding-complete-email',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule onboarding complete email job', error.stack, JSON.stringify({ userId: data.userId }));
            throw error;
        }
    }
    async scheduleActivationReminder(userId, email, firstName, reminderNumber) {
        try {
            const delays = {
                1: 24 * 60 * 60 * 1000,
                2: 72 * 60 * 60 * 1000,
                3: 7 * 24 * 60 * 60 * 1000,
            };
            const data = {
                userId,
                email,
                firstName,
                reminderNumber,
                scheduledAt: new Date(),
            };
            this.logger.info('Scheduling activation reminder email', JSON.stringify({
                userId,
                reminderNumber,
                delayHours: delays[reminderNumber] / (60 * 60 * 1000),
            }));
            await this.bullmq.addDelayedJob('email', 'send-activation-reminder', data, delays[reminderNumber]);
            this.logger.info('Activation reminder scheduled successfully', JSON.stringify({
                userId,
                reminderNumber,
                jobType: 'send-activation-reminder',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule activation reminder', error.stack, JSON.stringify({ userId, reminderNumber }));
            throw error;
        }
    }
    async scheduleTipsEmail(userId, email, firstName) {
        try {
            const data = {
                userId,
                email,
                firstName,
                tipCategory: 'getting-started',
                scheduledAt: new Date(),
            };
            const delay = 3 * 24 * 60 * 60 * 1000;
            this.logger.info('Scheduling tips email job', JSON.stringify({
                userId,
                email,
                delayDays: 3,
            }));
            await this.bullmq.addDelayedJob('email', 'send-tips-email', data, delay);
            this.logger.info('Tips email job scheduled successfully', JSON.stringify({
                userId,
                jobType: 'send-tips-email',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule tips email job', error.stack, JSON.stringify({ userId }));
            throw error;
        }
    }
    async cancelWelcomeJobs(userId) {
        try {
            this.logger.info('Cancelling welcome jobs for user', JSON.stringify({ userId }));
            this.logger.info('Welcome jobs cancelled successfully', JSON.stringify({
                userId,
                action: 'cancelled-welcome-jobs',
            }));
        }
        catch (error) {
            this.logger.error('Failed to cancel welcome jobs', error.stack, JSON.stringify({ userId }));
            throw error;
        }
    }
};
exports.WelcomeQueue = WelcomeQueue;
exports.WelcomeQueue = WelcomeQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], WelcomeQueue);
//# sourceMappingURL=welcome.queue.js.map