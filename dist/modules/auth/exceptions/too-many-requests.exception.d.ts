import { HttpException } from '@nestjs/common';
export declare class TooManyRequestsException extends HttpException {
    constructor(message?: string, retryAfter?: number);
}
