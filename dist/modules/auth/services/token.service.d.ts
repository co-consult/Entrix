import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ITokenService } from '../../../common/interfaces/auth.interface';
import { JwtPayload, RefreshTokenPayload, TokenPair, TokenValidationResult } from '../../../common/types/auth.types';
import { User } from '../../../common/types/user.types';
export declare class TokenService implements ITokenService {
    private readonly jwtService;
    private readonly prisma;
    private readonly redis;
    private readonly config;
    private readonly logger;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    private readonly issuer;
    private readonly audience;
    constructor(jwtService: JwtService, prisma: PrismaService, redis: RedisService, config: ConfigService, logger: LoggerService);
    generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>;
    generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string>;
    generateTokenPair(user: User, sessionId: string): Promise<TokenPair>;
    validateToken(token: string, type: 'access' | 'refresh'): Promise<TokenValidationResult>;
    decodeToken(token: string): JwtPayload | RefreshTokenPayload | null;
    revokeToken(token: string): Promise<void>;
    revokeAllTokens(userId: string): Promise<void>;
    isTokenRevoked(token: string): Promise<boolean>;
    generateTemporaryToken(userId: string, type: string, expiresIn?: number): Promise<string>;
    validateTemporaryToken(token: string, type: string): Promise<{
        userId: string;
        valid: boolean;
    }>;
    private hashToken;
    private parseExpiryToSeconds;
    private extractPermissions;
    cleanupExpiredTokens(): Promise<void>;
}
