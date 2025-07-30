import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ResourceType } from '../types/access-enums';
interface OwnershipRequirement {
    resource_type: ResourceType;
    resource_id_param: string;
    owner_field?: string;
    allow_admin_override?: boolean;
    organization_scope?: boolean;
}
export declare const OWNERSHIP_KEY = "ownership";
export declare class ResourceOwnershipGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService, loggerService: LoggerService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getOwnershipRequirement;
    private validateAuthentication;
    private extractResourceId;
    private checkOwnership;
    private logOwnershipGranted;
    private logOwnershipDenied;
    private handleError;
}
export declare const RequireOwnership: (requirement: OwnershipRequirement) => any;
export {};
