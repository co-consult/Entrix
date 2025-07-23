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
exports.AccountStatusGuard = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
let AccountStatusGuard = class AccountStatusGuard {
    prisma;
    logger;
    constructor(prisma, loggerService) {
        this.prisma = prisma;
        this.logger = loggerService.createChildLogger('AccountStatusGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return true;
        }
        const operationId = this.logger.startOperation('accountStatusGuard', {
            userId: user.id,
        });
        try {
            const userStatus = await this.getUserStatus(user.id);
            if (!userStatus) {
                this.logger.warn('User not found in database', JSON.stringify({ userId: user.id }));
                throw new common_1.UnauthorizedException('Utilisateur introuvable');
            }
            if (!userStatus.is_active) {
                this.logger.warn('Inactive account access attempt', JSON.stringify({ userId: user.id }));
                this.logger.logBusinessEvent('INACTIVE_ACCOUNT_ACCESS', {
                    userId: user.id,
                    email: userStatus.email,
                }, user.id);
                throw new common_1.ForbiddenException('Compte désactivé');
            }
            const requireEmailVerification = this.shouldRequireEmailVerification(context);
            if (requireEmailVerification && !userStatus.email_verified) {
                this.logger.warn('Unverified email access attempt', JSON.stringify({
                    userId: user.id,
                    email: userStatus.email
                }));
                this.logger.logBusinessEvent('UNVERIFIED_EMAIL_ACCESS', {
                    userId: user.id,
                    email: userStatus.email,
                }, user.id);
                throw new auth_exceptions_1.EmailNotVerifiedException();
            }
            const isLocked = await this.isAccountLocked(user.id);
            if (isLocked.locked) {
                this.logger.warn('Locked account access attempt', JSON.stringify({ userId: user.id }));
                throw new auth_exceptions_1.AccountLockedException(isLocked.unlockAt);
            }
            this.logger.endOperation(operationId, 'success', true);
            return true;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async getUserStatus(userId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    is_active: true,
                    email_verified: true,
                    metadata: true,
                },
            });
            return user;
        }
        catch (error) {
            this.logger.error('Error fetching user status', error.stack, JSON.stringify({ userId }));
            return null;
        }
    }
    shouldRequireEmailVerification(context) {
        const request = context.switchToHttp().getRequest();
        const sensitiveRoutes = ['/auth/mfa', '/account', '/payments'];
        return sensitiveRoutes.some(route => request.url.includes(route));
    }
    async isAccountLocked(userId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    metadata: true,
                },
            });
            const metadata = user?.metadata;
            const lockUntil = metadata?.lockUntil ? new Date(metadata.lockUntil) : null;
            if (lockUntil && lockUntil > new Date()) {
                return { locked: true, unlockAt: lockUntil };
            }
            return { locked: false };
        }
        catch (error) {
            this.logger.error('Error checking account lock status', error.stack);
            return { locked: false };
        }
    }
};
exports.AccountStatusGuard = AccountStatusGuard;
exports.AccountStatusGuard = AccountStatusGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], AccountStatusGuard);
//# sourceMappingURL=account-status.guard.js.map