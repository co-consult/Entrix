import { LoggerService } from '../../../shared/logger/logger.service';
import { AuthService } from '../services/auth.service';
import { IUserProfile } from '../interfaces/user.interface';
declare const LocalStrategy_base: new (...args: any) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService, loggerService: LoggerService);
    validate(req: any, email: string, password: string): Promise<IUserProfile>;
    private extractIpAddress;
}
export {};
