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
exports.AnonymousConversionQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let AnonymousConversionQueue = class AnonymousConversionQueue {
    bullmq;
    logger;
    constructor(bullmq, logger) {
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('AnonymousConversionQueue');
    }
    async sendConversionInvite(data) {
        try {
            this.logger.info('Scheduling conversion invite email', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                guestEmail: data.guestEmail,
                incentiveType: data.incentive.type,
                incentiveValue: data.incentive.value,
            }));
            await this.bullmq.addPriorityJob('email', 'send-conversion-invite', data, 'HIGH');
            await this.scheduleConversionReminders(data);
            await this.trackConversionEvent({
                anonymousUserId: data.anonymousUserId,
                eventType: 'INVITATION_SENT',
                campaignId: data.campaignData?.campaignId,
                incentiveType: data.incentive.type,
                metadata: {
                    email: data.guestEmail,
                    source: data.campaignData?.source,
                },
            });
            this.logger.info('Conversion invite scheduled successfully', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                jobType: 'send-conversion-invite',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule conversion invite', error.stack, JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                guestEmail: data.guestEmail,
            }));
            throw error;
        }
    }
    async scheduleConversionReminders(data) {
        try {
            const now = new Date();
            const expiresAt = new Date(data.expiresAt);
            const timeUntilExpiry = expiresAt.getTime() - now.getTime();
            const daysUntilExpiry = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
            this.logger.info('Scheduling conversion reminders', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                daysUntilExpiry,
            }));
            if (daysUntilExpiry > 3) {
                const reminder1 = {
                    anonymousUserId: data.anonymousUserId,
                    onboardingKey: data.onboardingKey,
                    reminderNumber: 1,
                    originalData: data,
                    daysUntilExpiry,
                };
                await this.bullmq.addDelayedJob('email', 'send-conversion-reminder', reminder1, 24 * 60 * 60 * 1000);
            }
            if (daysUntilExpiry > 7) {
                const reminder2 = {
                    anonymousUserId: data.anonymousUserId,
                    onboardingKey: data.onboardingKey,
                    reminderNumber: 2,
                    originalData: data,
                    daysUntilExpiry,
                };
                await this.bullmq.addDelayedJob('email', 'send-conversion-reminder', reminder2, Math.floor(timeUntilExpiry / 2));
            }
            if (daysUntilExpiry > 1) {
                const reminder3 = {
                    anonymousUserId: data.anonymousUserId,
                    onboardingKey: data.onboardingKey,
                    reminderNumber: 3,
                    originalData: data,
                    daysUntilExpiry: 1,
                };
                await this.bullmq.addDelayedJob('email', 'send-conversion-reminder', reminder3, timeUntilExpiry - 24 * 60 * 60 * 1000);
            }
            this.logger.info('Conversion reminders scheduled successfully', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                remindersScheduled: daysUntilExpiry > 3 ? (daysUntilExpiry > 7 ? 3 : 2) : (daysUntilExpiry > 1 ? 1 : 0),
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule conversion reminders', error.stack, JSON.stringify({ anonymousUserId: data.anonymousUserId }));
        }
    }
    async sendConversionReminder(data) {
        try {
            this.logger.info('Scheduling conversion reminder email', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                reminderNumber: data.reminderNumber,
                daysUntilExpiry: data.daysUntilExpiry,
            }));
            await this.bullmq.addPriorityJob('email', 'send-conversion-reminder', data, 'NORMAL');
            await this.trackConversionEvent({
                anonymousUserId: data.anonymousUserId,
                eventType: 'REMINDER_SENT',
                metadata: {
                    reminderNumber: data.reminderNumber,
                    daysUntilExpiry: data.daysUntilExpiry,
                },
            });
            this.logger.info('Conversion reminder scheduled successfully', JSON.stringify({
                anonymousUserId: data.anonymousUserId,
                jobType: 'send-conversion-reminder',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule conversion reminder', error.stack, JSON.stringify({ anonymousUserId: data.anonymousUserId }));
            throw error;
        }
    }
    async sendConversionSuccess(data) {
        try {
            this.logger.info('Scheduling conversion success email', JSON.stringify({
                convertedUserId: data.convertedUserId,
                originalAnonymousId: data.originalAnonymousId,
                incentiveType: data.incentiveApplied.type,
                conversionTimeHours: data.conversionTime,
            }));
            await this.bullmq.addPriorityJob('email', 'send-conversion-success', data, 'HIGH');
            await this.trackConversionEvent({
                anonymousUserId: data.originalAnonymousId,
                convertedUserId: data.convertedUserId,
                eventType: 'CONVERSION_SUCCESSFUL',
                campaignId: data.campaignData?.campaignId,
                incentiveType: data.incentiveApplied.type,
                conversionTime: data.conversionTime,
                metadata: {
                    migrationSummary: data.migrationSummary,
                    source: data.campaignData?.source,
                },
            });
            this.logger.info('Conversion success email scheduled successfully', JSON.stringify({
                convertedUserId: data.convertedUserId,
                jobType: 'send-conversion-success',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule conversion success email', error.stack, JSON.stringify({
                convertedUserId: data.convertedUserId,
                originalAnonymousId: data.originalAnonymousId,
            }));
            throw error;
        }
    }
    async processConversionExpiry(anonymousUserId, onboardingKey) {
        try {
            this.logger.info('Processing conversion expiry', JSON.stringify({
                anonymousUserId,
                onboardingKey,
            }));
            await this.cancelConversionReminders(anonymousUserId);
            await this.trackConversionEvent({
                anonymousUserId,
                eventType: 'INVITATION_EXPIRED',
                metadata: {
                    onboardingKey,
                    expiredAt: new Date(),
                },
            });
            this.logger.info('Conversion expiry processed successfully', JSON.stringify({
                anonymousUserId,
                action: 'expiry-processed',
            }));
        }
        catch (error) {
            this.logger.error('Failed to process conversion expiry', error.stack, JSON.stringify({ anonymousUserId }));
            throw error;
        }
    }
    async trackConversionEvent(data) {
        try {
            await this.bullmq.addJob('analytics', 'track-conversion-event', {
                ...data,
                timestamp: new Date(),
            });
            this.logger.info('Conversion event tracked', JSON.stringify({
                eventType: data.eventType,
                anonymousUserId: data.anonymousUserId,
                convertedUserId: data.convertedUserId,
            }));
        }
        catch (error) {
            this.logger.error('Failed to track conversion event', error.stack, JSON.stringify({ eventType: data.eventType }));
        }
    }
    async cancelConversionReminders(anonymousUserId) {
        try {
            this.logger.info('Cancelling conversion reminders', JSON.stringify({ anonymousUserId }));
            this.logger.info('Conversion reminders cancelled successfully', JSON.stringify({
                anonymousUserId,
                action: 'cancelled-reminders',
            }));
        }
        catch (error) {
            this.logger.error('Failed to cancel conversion reminders', error.stack, JSON.stringify({ anonymousUserId }));
            throw error;
        }
    }
};
exports.AnonymousConversionQueue = AnonymousConversionQueue;
exports.AnonymousConversionQueue = AnonymousConversionQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], AnonymousConversionQueue);
//# sourceMappingURL=anonymous-conversion.queue.js.map