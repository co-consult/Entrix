import { RoleScope } from '../../types/access-enums';
export declare class CreateRoleDto {
    name: string;
    display_name: string;
    description?: string;
    scope: RoleScope;
    level: number;
    metadata?: any;
}
