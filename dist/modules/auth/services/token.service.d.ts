import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { PersistentTokenService } from './persistent-token.service';
import { ValidationTokenService } from './validation-token.service';
import { ITokenService, JwtPayload, JwtRefreshPayload, ITokenPair } from '../interfaces';
export declare class TokenService implements ITokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly redis;
    private readonly persistentTokenService;
    private readonly validationTokenService;
    private readonly logger;
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    constructor(jwtService: JwtService, configService: ConfigService, redis: RedisService, persistentTokenService: PersistentTokenService, validationTokenService: ValidationTokenService, loggerService: LoggerService);
    generateAccessToken(payload: JwtPayload): Promise<string>;
    generateRefreshToken(payload: JwtRefreshPayload): Promise<string>;
    generateTokenPair(userId: string, sessionId: string, deviceFingerprint?: string, roles?: string[], permissions?: string[]): Promise<ITokenPair>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    verifyRefreshToken(token: string): Promise<JwtRefreshPayload>;
    rotateRefreshToken(oldToken: string, payload: JwtRefreshPayload): Promise<{
        newAccessToken: string;
        newRefreshToken: string;
        expiresIn: number;
    }>;
    cleanupUsedRefreshTokens(): Promise<number>;
    blacklistToken(token: string): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    debugRefreshTokenState(token: string): Promise<{
        isValid: boolean;
        isUsed: boolean;
        isBlacklisted: boolean;
        payload?: any;
        errors: string[];
    }>;
    forceCleanupRefreshToken(tokenId: string): Promise<boolean>;
    generateApiKey(userId: string, name?: string, scopes?: string[]): Promise<{
        token: string;
        prefix: string;
        id: string;
    }>;
    validateApiKey(token: string): Promise<{
        isValid: boolean;
        userId?: string;
        scopes?: string[];
    }>;
    generateEmailVerificationToken(email: string, userId?: string): Promise<{
        token: string;
        id: string;
        expires_at: Date;
    }>;
    generatePasswordResetToken(email: string): Promise<{
        token: string;
        id: string;
        expires_at: Date;
    }>;
    validateAnyToken(token: string): Promise<{
        isValid: boolean;
        type: 'jwt_access' | 'jwt_refresh' | 'persistent' | 'validation';
        payload?: any;
        userId?: string;
    }>;
    cleanupExpiredTokens(): Promise<{
        persistent_tokens: number;
        validation_tokens: number;
        blacklisted_keys: number;
    }>;
    getGlobalTokenStats(): Promise<{
        persistent_tokens: any;
        validation_tokens: any;
        jwt_tokens: {
            blacklisted_count: number;
            cache_size: number;
        };
    }>;
    private getTokenHash;
    private validateAccessTokenPayload;
    private validateRefreshTokenPayload;
    private generateTokenId;
    private extractJwtPayload;
    private isRefreshTokenUsed;
    private markRefreshTokenAsUsed;
    private cleanupExpiredBlacklistKeys;
    private getJwtTokenStats;
}
