import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { JwtRefreshPayload } from '../interfaces/auth.interfaces';
declare const JwtRefreshStrategy_base: new (...args: any) => any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly configService;
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    validate(req: any, payload: JwtRefreshPayload): Promise<{
        userId: string;
        sessionId: string;
        tokenId: string;
    }>;
    private isValidRefreshPayload;
    private extractTokenFromRequest;
    private isRefreshTokenUsed;
    private validateRefreshSession;
    private markRefreshTokenAsUsed;
    private revokeAllUserSessions;
}
export {};
