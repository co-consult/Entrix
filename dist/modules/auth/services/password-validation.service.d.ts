import { LoggerService } from '../../../shared/logger/logger.service';
import { IPasswordValidation } from '../interfaces/password.interface';
export declare class PasswordValidationService {
    private readonly logger;
    constructor(loggerService: LoggerService);
    validatePasswordStrength(password: string): Promise<IPasswordValidation>;
    private calculatePenalties;
    private checkSequentialPenalties;
    private addPenaltySuggestions;
    private getPasswordStrengthLevel;
    isPasswordValid(password: string): Promise<boolean>;
    getPasswordSuggestions(password: string): Promise<string[]>;
    isPasswordAcceptableForSecurityLevel(password: string, securityLevel: 'low' | 'medium' | 'high'): Promise<boolean>;
}
