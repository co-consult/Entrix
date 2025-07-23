import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
export declare class DeviceTrustedGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractDeviceInfo;
    private isDeviceTrusted;
    private sendDeviceVerificationCode;
}
