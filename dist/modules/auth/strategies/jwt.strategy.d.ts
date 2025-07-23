import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { JwtPayload } from '../interfaces/auth.interfaces';
import { IUserProfile } from '../interfaces/user.interface';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    validate(payload: JwtPayload): Promise<IUserProfile>;
    private isValidPayload;
    private isTokenBlacklisted;
    private validateSession;
    private getUserFromDatabase;
    private updateSessionActivity;
    private normalizeUserProfile;
}
export {};
