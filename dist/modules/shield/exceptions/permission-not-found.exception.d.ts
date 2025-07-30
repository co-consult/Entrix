import { NotFoundException } from '@nestjs/common';
export declare class PermissionNotFoundException extends NotFoundException {
    readonly identifier: string;
    readonly identifierType: 'id' | 'name';
    constructor(identifier: string, identifierType?: 'id' | 'name');
    static byId(permissionId: string): PermissionNotFoundException;
    static byName(permissionName: string): PermissionNotFoundException;
}
