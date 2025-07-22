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
exports.UserAnalyticsQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let UserAnalyticsQueue = class UserAnalyticsQueue {
    bullmq;
    logger;
    constructor(bullmq, logger) {
        this.bullmq = bullmq;
        this.logger = logger.createChildLogger('UserAnalyticsQueue');
    }
    async trackUserEvent(data) {
        try {
            this.logger.info('Scheduling user event tracking', JSON.stringify({
                userId: data.userId,
                eventType: data.eventType,
                timestamp: data.timestamp,
            }));
            await this.bullmq.addJob('analytics', 'track-user-event', data);
            this.logger.info('User event tracking scheduled successfully', JSON.stringify({
                userId: data.userId,
                eventType: data.eventType,
                jobType: 'track-user-event',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user event tracking', error.stack, JSON.stringify({
                userId: data.userId,
                eventType: data.eventType,
            }));
        }
    }
    async trackUserBehavior(data) {
        try {
            this.logger.info('Scheduling user behavior tracking', JSON.stringify({
                userId: data.userId,
                behaviorType: data.behaviorType,
                page: data.page,
            }));
            await this.bullmq.addJob('analytics', 'track-user-behavior', data);
            this.logger.info('User behavior tracking scheduled successfully', JSON.stringify({
                userId: data.userId,
                behaviorType: data.behaviorType,
                jobType: 'track-user-behavior',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user behavior tracking', error.stack, JSON.stringify({
                userId: data.userId,
                behaviorType: data.behaviorType,
            }));
        }
    }
    async trackUserEngagement(data) {
        try {
            this.logger.info('Scheduling user engagement tracking', JSON.stringify({
                userId: data.userId,
                engagementType: data.engagementType,
                source: data.source,
                campaignId: data.campaignId,
            }));
            await this.bullmq.addJob('analytics', 'track-user-engagement', data);
            this.logger.info('User engagement tracking scheduled successfully', JSON.stringify({
                userId: data.userId,
                engagementType: data.engagementType,
                jobType: 'track-user-engagement',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user engagement tracking', error.stack, JSON.stringify({
                userId: data.userId,
                engagementType: data.engagementType,
            }));
        }
    }
    async trackGroupAnalytics(data) {
        try {
            this.logger.info('Scheduling group analytics tracking', JSON.stringify({
                groupId: data.groupId,
                eventType: data.eventType,
                userId: data.userId,
            }));
            await this.bullmq.addJob('analytics', 'track-group-analytics', data);
            this.logger.info('Group analytics tracking scheduled successfully', JSON.stringify({
                groupId: data.groupId,
                eventType: data.eventType,
                jobType: 'track-group-analytics',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule group analytics tracking', error.stack, JSON.stringify({
                groupId: data.groupId,
                eventType: data.eventType,
            }));
        }
    }
    async trackConversionFunnel(data) {
        try {
            this.logger.info('Scheduling conversion funnel tracking', JSON.stringify({
                userId: data.userId,
                anonymousId: data.anonymousId,
                funnelStep: data.funnelStep,
                funnelName: data.funnelName,
            }));
            await this.bullmq.addJob('analytics', 'track-conversion-funnel', data);
            this.logger.info('Conversion funnel tracking scheduled successfully', JSON.stringify({
                userId: data.userId || data.anonymousId,
                funnelStep: data.funnelStep,
                jobType: 'track-conversion-funnel',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule conversion funnel tracking', error.stack, JSON.stringify({
                funnelStep: data.funnelStep,
                funnelName: data.funnelName,
            }));
        }
    }
    async updateUserSegmentation(data) {
        try {
            this.logger.info('Scheduling user segmentation update', JSON.stringify({
                userId: data.userId,
                segmentType: data.segmentType,
                segmentName: data.segmentName,
                segmentValue: data.segmentValue,
            }));
            await this.bullmq.addJob('analytics', 'update-user-segmentation', data);
            this.logger.info('User segmentation update scheduled successfully', JSON.stringify({
                userId: data.userId,
                segmentType: data.segmentType,
                jobType: 'update-user-segmentation',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user segmentation update', error.stack, JSON.stringify({
                userId: data.userId,
                segmentType: data.segmentType,
            }));
        }
    }
    async calculateUserMetrics(userId, force = false) {
        try {
            this.logger.info('Scheduling user metrics calculation', JSON.stringify({
                userId,
                force,
            }));
            const priority = force ? 'HIGH' : 'LOW';
            await this.bullmq.addPriorityJob('analytics', 'calculate-user-metrics', {
                userId,
                force,
                timestamp: new Date(),
            }, priority);
            this.logger.info('User metrics calculation scheduled successfully', JSON.stringify({
                userId,
                priority,
                jobType: 'calculate-user-metrics',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user metrics calculation', error.stack, JSON.stringify({ userId, force }));
        }
    }
    async generateUserReport(userId, reportType, notifyEmail) {
        try {
            this.logger.info('Scheduling user report generation', JSON.stringify({
                userId,
                reportType,
                notifyEmail,
            }));
            await this.bullmq.addJob('reports', 'generate-user-report', {
                userId,
                reportType,
                notifyEmail,
                requestedAt: new Date(),
            });
            this.logger.info('User report generation scheduled successfully', JSON.stringify({
                userId,
                reportType,
                jobType: 'generate-user-report',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule user report generation', error.stack, JSON.stringify({ userId, reportType }));
            throw error;
        }
    }
    async cleanupOldAnalytics(retentionDays = 90) {
        try {
            this.logger.info('Scheduling analytics cleanup', JSON.stringify({
                retentionDays,
            }));
            await this.bullmq.addJob('maintenance', 'cleanup-old-analytics', {
                retentionDays,
                cleanupDate: new Date(),
            });
            this.logger.info('Analytics cleanup scheduled successfully', JSON.stringify({
                retentionDays,
                jobType: 'cleanup-old-analytics',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule analytics cleanup', error.stack, JSON.stringify({ retentionDays }));
            throw error;
        }
    }
    async syncExternalAnalytics(service, dataType, batchSize = 1000) {
        try {
            this.logger.info('Scheduling external analytics sync', JSON.stringify({
                service,
                dataType,
                batchSize,
            }));
            await this.bullmq.addJob('integrations', 'sync-external-analytics', {
                service,
                dataType,
                batchSize,
                syncDate: new Date(),
            });
            this.logger.info('External analytics sync scheduled successfully', JSON.stringify({
                service,
                dataType,
                jobType: 'sync-external-analytics',
            }));
        }
        catch (error) {
            this.logger.error('Failed to schedule external analytics sync', error.stack, JSON.stringify({ service, dataType }));
            throw error;
        }
    }
};
exports.UserAnalyticsQueue = UserAnalyticsQueue;
exports.UserAnalyticsQueue = UserAnalyticsQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], UserAnalyticsQueue);
//# sourceMappingURL=user-analytics.queue.js.map