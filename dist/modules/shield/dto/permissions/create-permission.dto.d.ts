import { PermissionAction, ResourceType } from '../../types/access-enums';
export declare class CreatePermissionDto {
    name: string;
    display_name: string;
    description?: string;
    resource_type: ResourceType;
    action: PermissionAction;
    conditions?: any;
    metadata?: any;
}
