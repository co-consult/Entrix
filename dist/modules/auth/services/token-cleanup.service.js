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
var TokenCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
let TokenCleanupService = TokenCleanupService_1 = class TokenCleanupService {
    prisma;
    logger = new common_1.Logger(TokenCleanupService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async cleanupExpiredTokens() {
        try {
            this.logger.log('Starting automatic token cleanup...');
            const result = await this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    expires_at: {
                        lt: new Date()
                    }
                }
            });
            if (result.count > 0) {
                this.logger.log(`✅ Cleaned up ${result.count} expired email tokens`);
            }
            else {
                this.logger.log('No expired tokens to clean up');
            }
        }
        catch (error) {
            this.logger.error('❌ Failed to cleanup expired tokens:', error);
        }
    }
    async cleanupOldUsedTokens() {
        try {
            this.logger.log('Starting cleanup of old used tokens...');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: true,
                    used_at: {
                        lt: thirtyDaysAgo
                    }
                }
            });
            if (result.count > 0) {
                this.logger.log(`✅ Cleaned up ${result.count} old used tokens`);
            }
            else {
                this.logger.log('No old used tokens to clean up');
            }
        }
        catch (error) {
            this.logger.error('❌ Failed to cleanup old used tokens:', error);
        }
    }
    async cleanupAbandonedTokens() {
        try {
            this.logger.log('Starting cleanup of abandoned tokens...');
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const result = await this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    created_at: {
                        lt: sevenDaysAgo
                    }
                }
            });
            if (result.count > 0) {
                this.logger.log(`✅ Cleaned up ${result.count} abandoned tokens`);
            }
            else {
                this.logger.log('No abandoned tokens to clean up');
            }
        }
        catch (error) {
            this.logger.error('❌ Failed to cleanup abandoned tokens:', error);
        }
    }
    async getCleanupStats() {
        const [totalTokens, activeTokens, expiredTokens, usedTokens, oldestToken, newestToken] = await Promise.all([
            this.prisma.mfa_tokens.count({
                where: { method: client_1.mfa_method.EMAIL }
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    expires_at: { gt: new Date() }
                }
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    expires_at: { lt: new Date() }
                }
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: true
                }
            }),
            this.prisma.mfa_tokens.findFirst({
                where: { method: client_1.mfa_method.EMAIL },
                orderBy: { created_at: 'asc' },
                select: { created_at: true }
            }),
            this.prisma.mfa_tokens.findFirst({
                where: { method: client_1.mfa_method.EMAIL },
                orderBy: { created_at: 'desc' },
                select: { created_at: true }
            })
        ]);
        return {
            totalTokens,
            activeTokens,
            expiredTokens,
            usedTokens,
            oldestToken: oldestToken?.created_at || null,
            newestToken: newestToken?.created_at || null
        };
    }
    async forceCleanupAll() {
        this.logger.log('🧹 Starting manual force cleanup...');
        const [expired, oldUsed, abandoned] = await Promise.all([
            this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    expires_at: { lt: new Date() }
                }
            }),
            this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: true,
                    used_at: {
                        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            this.prisma.mfa_tokens.deleteMany({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    created_at: {
                        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        const totalCleaned = expired.count + oldUsed.count + abandoned.count;
        this.logger.log(`🎯 Force cleanup completed: ${totalCleaned} tokens cleaned`);
        this.logger.log(`   - Expired: ${expired.count}`);
        this.logger.log(`   - Old used: ${oldUsed.count}`);
        this.logger.log(`   - Abandoned: ${abandoned.count}`);
        return {
            expiredCleaned: expired.count,
            oldUsedCleaned: oldUsed.count,
            abandonedCleaned: abandoned.count,
            totalCleaned
        };
    }
};
exports.TokenCleanupService = TokenCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenCleanupService.prototype, "cleanupExpiredTokens", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenCleanupService.prototype, "cleanupOldUsedTokens", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenCleanupService.prototype, "cleanupAbandonedTokens", null);
exports.TokenCleanupService = TokenCleanupService = TokenCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokenCleanupService);
//# sourceMappingURL=token-cleanup.service.js.map