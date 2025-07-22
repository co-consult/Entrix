import { RedisService } from '../../shared/redis/redis.service';
import { EmailService } from '../../shared/email/email.service';
import { LoggerService } from '../../shared/logger/logger.service';
export interface MfaChallenge {
    userId: string;
    method: 'email' | 'sms' | 'totp';
    code: string;
    expiresAt: Date;
    verified: boolean;
    attempts: number;
    maxAttempts: number;
}
export declare class MfaService {
    private readonly redis;
    private readonly email;
    private readonly logger;
    private readonly MFA_PREFIX;
    private readonly MFA_EXPIRY;
    constructor(redis: RedisService, email: EmailService, logger: LoggerService);
    createChallenge(userId: string, method: 'email' | 'sms' | 'totp'): Promise<MfaChallenge>;
    verifyChallenge(userId: string, code: string, method: 'email' | 'sms' | 'totp'): Promise<boolean>;
    invalidateChallenge(userId: string, method: 'email' | 'sms' | 'totp'): Promise<void>;
    getChallenge(userId: string, method: 'email' | 'sms' | 'totp'): Promise<MfaChallenge | null>;
    private sendEmailCode;
    private sendSmsCode;
    isUserMfaEnabled(userId: string): Promise<boolean>;
    getUserMfaMethods(userId: string): Promise<string[]>;
    setupTotp(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enableMfa(userId: string, method: 'email' | 'sms' | 'totp'): Promise<void>;
    disableMfa(userId: string): Promise<void>;
    cleanupExpiredChallenges(): Promise<number>;
}
