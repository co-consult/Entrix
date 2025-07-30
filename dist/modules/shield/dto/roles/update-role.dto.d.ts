import { CreateRoleDto } from './create-role.dto';
declare const UpdateRoleDto_base: import("@nestjs/common").Type<Partial<Omit<CreateRoleDto, "name" | "scope">>>;
export declare class UpdateRoleDto extends UpdateRoleDto_base {
    is_active?: boolean;
}
export {};
