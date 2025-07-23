import { ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
declare const JwtRefreshGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtRefreshGuard extends JwtRefreshGuard_base {
    private readonly logger;
    constructor(loggerService: LoggerService);
    handleRequest(err: any, user: any, info: any, context: ExecutionContext): any;
}
export {};
