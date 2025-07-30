import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto/roles';
import { Role, UserRole, RolesListResponse, RoleFilters } from '../interfaces/rbac.interface';
export declare class RolesService {
    private readonly prisma;
    private readonly redis;
    private readonly bullmq;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, bullmq: BullmqService, loggerService: LoggerService);
    createRole(roleData: CreateRoleDto): Promise<Role>;
    findRoleById(id: string): Promise<Role>;
    findRoleByName(name: string): Promise<Role>;
    findManyRoles(filters?: RoleFilters): Promise<RolesListResponse>;
    updateRole(id: string, updateData: UpdateRoleDto): Promise<Role>;
    assignRole(assignData: AssignRoleDto, assignedBy: string): Promise<UserRole>;
    removeRole(userId: string, roleId: string, removedBy: string): Promise<void>;
    getUserRoles(userId: string): Promise<UserRole[]>;
    getRoleHierarchy(): Promise<any[]>;
    private validateRoleUniqueness;
    private validateRoleCreation;
    private validateRoleAssignment;
    private cacheRole;
    private invalidateRoleCache;
    private invalidateUserPermissionsCache;
    private auditRoleEvent;
}
