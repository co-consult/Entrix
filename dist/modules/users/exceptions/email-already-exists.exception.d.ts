import { HttpException } from '@nestjs/common';
export declare class EmailAlreadyExistsException extends HttpException {
    constructor(email: string, context?: 'registration' | 'update' | 'invitation');
    static forRegistration(email: string): EmailAlreadyExistsException;
    static forUpdate(email: string): EmailAlreadyExistsException;
    static forInvitation(email: string): EmailAlreadyExistsException;
}
