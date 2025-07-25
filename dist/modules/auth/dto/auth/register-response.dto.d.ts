import { TokenPairDto, UserProfileDto, SessionInfoDto } from './login-response.dto';
import { IRegisterResult } from '../../interfaces/auth.interfaces';
export declare class VerificationInfoDto {
    emailSent: boolean;
    verificationRequired: boolean;
    tokenId: string;
}
export declare class OnboardingInfoDto {
    incentiveApplied: boolean;
    incentiveType: string;
    incentiveValue: number;
    migratedTickets: number;
}
export declare class RegisterResponseDto {
    success: boolean;
    data?: {
        user: UserProfileDto;
        tokens?: TokenPairDto;
        session?: SessionInfoDto;
        verification: VerificationInfoDto;
        onboarding?: OnboardingInfoDto;
    };
    message?: string;
    meta?: {
        autoLoginEnabled: boolean;
        sessionCreated: boolean;
    };
}
export declare class RegisterResponseMapper {
    static toDto(registerResult: IRegisterResult): RegisterResponseDto;
}
