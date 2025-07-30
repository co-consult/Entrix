declare class RolePermissionAssignment {
    role_id: string;
    permission_ids: string[];
}
export declare class BulkAssignPermissionsDto {
    assignments: RolePermissionAssignment[];
}
export {};
