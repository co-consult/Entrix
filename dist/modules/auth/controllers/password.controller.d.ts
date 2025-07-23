import { LoggerService } from '../../../shared/logger/logger.service';
import { PasswordService } from '../services/password.service';
import { ForgotPasswordDto, ForgotPasswordResponseDto, ResetPasswordDto, ResetPasswordResponseDto, ChangePasswordDto, ChangePasswordResponseDto } from '../dto/password';
export declare class PasswordController {
    private readonly passwordService;
    private readonly logger;
    constructor(passwordService: PasswordService, loggerService: LoggerService);
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto>;
    changePassword(changePasswordDto: ChangePasswordDto, userId: string): Promise<ChangePasswordResponseDto>;
    validatePassword(password: string): Promise<{
        success: boolean;
        data: {
            isValid: boolean;
            score: number;
            suggestions: string[];
        };
    }>;
}
