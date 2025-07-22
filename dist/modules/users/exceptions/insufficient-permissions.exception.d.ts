import { HttpException } from '@nestjs/common';
import { GroupRole } from '../types/group.types';
export declare class InsufficientPermissionsException extends HttpException {
    constructor(action: string, resource: string, currentRole?: GroupRole, requiredRole?: GroupRole, requiredPermission?: string, context?: string);
    static forGroupAction(action: string, groupId: string, currentRole?: GroupRole, requiredRole?: GroupRole): InsufficientPermissionsException;
    static forGroupPermission(action: string, groupId: string, requiredPermission: string, currentRole?: GroupRole): InsufficientPermissionsException;
    static forUserAction(action: string, userId?: string): InsufficientPermissionsException;
    static forInvitation(action: string, currentRole?: GroupRole): InsufficientPermissionsException;
    static forPurchase(groupId: string, currentRole?: GroupRole): InsufficientPermissionsException;
    static forViewOrders(groupId: string, currentRole?: GroupRole): InsufficientPermissionsException;
}
