import { HttpException } from '@nestjs/common';
export declare class UserNotFoundException extends HttpException {
    constructor(identifier?: string, identifierType?: 'id' | 'email' | 'phone');
    static byId(id: string): UserNotFoundException;
    static byEmail(email: string): UserNotFoundException;
    static byPhone(phone: string): UserNotFoundException;
}
