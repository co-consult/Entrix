import { TokenPairDto, UserProfileDto } from './login-response.dto';
import { IRegisterResult } from '../../interfaces/auth.interfaces';
export declare class VerificationInfoDto {
    emailSent: boolean;
    verificationRequired: boolean;
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
        tokens: TokenPairDto;
        verification: VerificationInfoDto;
        onboarding?: OnboardingInfoDto;
    };
    message?: string;
}
export declare class RegisterResponseMapper {
    static toDto(registerResult: IRegisterResult): RegisterResponseDto;
}
