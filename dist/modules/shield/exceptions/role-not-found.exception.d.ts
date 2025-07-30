import { NotFoundException } from '@nestjs/common';
export declare class RoleNotFoundException extends NotFoundException {
    readonly identifier: string;
    readonly identifierType: 'id' | 'name';
    constructor(identifier: string, identifierType?: 'id' | 'name');
    static byId(roleId: string): RoleNotFoundException;
    static byName(roleName: string): RoleNotFoundException;
}
