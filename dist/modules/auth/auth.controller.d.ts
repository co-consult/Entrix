import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto, ConfirmResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { MfaLoginDto } from './dtos/mfa.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        mfaRequired: boolean;
        method: string;
        accessToken?: undefined;
        refreshToken?: undefined;
    } | {
        accessToken: string;
        refreshToken: string;
        mfaRequired?: undefined;
        method?: undefined;
    }>;
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<void>;
    confirmResetPassword(dto: ConfirmResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    mfaLogin(dto: MfaLoginDto & {
        email: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
