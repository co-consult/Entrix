import { HttpException } from '@nestjs/common';
export declare class GroupNotFoundException extends HttpException {
    constructor(identifier?: string, identifierType?: 'id' | 'code' | 'name');
    static byId(id: string): GroupNotFoundException;
    static byCode(code: string): GroupNotFoundException;
    static byName(name: string): GroupNotFoundException;
}
