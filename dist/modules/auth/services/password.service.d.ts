import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IPasswordService, IPasswordReset } from '../interfaces';
export declare class PasswordService implements IPasswordService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, loggerService: LoggerService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateResetToken(email: string): Promise<string>;
    validateResetToken(token: string): Promise<IPasswordReset | null>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    validatePasswordStrength(password: string): Promise<{
        isValid: boolean;
        score: number;
        suggestions: string[];
    }>;
    private checkResetRateLimit;
    private revokeExistingResetTokens;
    private revokeAllUserSessions;
    private sendResetEmail;
    private sendResetConfirmationEmail;
    private sendPasswordChangedEmail;
}
