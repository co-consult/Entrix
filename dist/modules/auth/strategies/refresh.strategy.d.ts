import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { TokenService } from '../services/token.service';
import { SessionsService } from '../services/session.service';
import { RefreshTokenPayload, AuthUser } from '../../../common/types/auth.types';
declare const RefreshStrategy_base: new (...args: any) => any;
export declare class RefreshStrategy extends RefreshStrategy_base {
    private readonly prisma;
    private readonly redis;
    private readonly tokenService;
    private readonly sessionService;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, tokenService: TokenService, sessionService: SessionsService, config: ConfigService, logger: LoggerService);
    validate(req: any, payload: RefreshTokenPayload): Promise<AuthUser>;
    private extractPermissions;
    private flattenPermissions;
}
export {};
