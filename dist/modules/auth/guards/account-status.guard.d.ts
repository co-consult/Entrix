import { CanActivate, ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
export declare class AccountStatusGuard implements CanActivate {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getUserStatus;
    private shouldRequireEmailVerification;
    private isAccountLocked;
}
