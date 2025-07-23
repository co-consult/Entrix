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
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        session: {
            id: any;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    confirmResetPassword(dto: ConfirmResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    mfaLogin(dto: MfaLoginDto & {
        email: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
