import { ResourceType } from '../../types/access-enums';
export declare class CheckPermissionDto {
    user_id: string;
    permission: string;
    resource_type: ResourceType;
    resource_id?: string;
    context?: Record<string, any>;
}
