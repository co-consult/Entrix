import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { IPasswordService, IPasswordReset, IPasswordValidation } from '../interfaces/password.interface';
export declare class PasswordService implements IPasswordService {
    private readonly prisma;
    private readonly redis;
    private readonly email;
    private readonly logger;
    private readonly RESET_TOKEN_PREFIX;
    private readonly RATE_LIMIT_PREFIX;
    constructor(prisma: PrismaService, redis: RedisService, email: EmailService, loggerService: LoggerService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    verifyUserPassword(userId: string, password: string): Promise<boolean>;
    validatePasswordStrength(password: string): Promise<IPasswordValidation>;
    generateResetToken(email: string): Promise<string>;
    validateResetToken(token: string): Promise<IPasswordReset | null>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    private checkResetRateLimit;
    private incrementResetAttempts;
    verifyUserPasswordByEmail(email: string, password: string): Promise<boolean>;
}
