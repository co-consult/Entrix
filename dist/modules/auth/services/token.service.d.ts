import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { ITokenService, JwtPayload, JwtRefreshPayload, ITokenPair } from '../interfaces';
export declare class TokenService implements ITokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    constructor(jwtService: JwtService, configService: ConfigService, redis: RedisService, loggerService: LoggerService);
    generateAccessToken(payload: JwtPayload): Promise<string>;
    generateRefreshToken(payload: JwtRefreshPayload): Promise<string>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    verifyRefreshToken(token: string): Promise<JwtRefreshPayload>;
    blacklistToken(token: string): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    private isRefreshTokenUsed;
    generateTokenPair(userId: string, email: string, sessionId: string, rememberMe?: boolean, deviceFingerprint?: string, roles?: string[], permissions?: string[]): Promise<ITokenPair>;
}
