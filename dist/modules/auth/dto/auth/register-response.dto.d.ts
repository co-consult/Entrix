import { TokenPairDto, UserProfileDto } from './login-response.dto';
export declare class RegisterResponseDto {
    success: boolean;
    data?: {
        user: UserProfileDto;
        tokens: TokenPairDto;
        verification: {
            emailSent: boolean;
            verificationRequired: boolean;
        };
        onboarding?: {
            incentiveApplied: boolean;
            incentiveType: string;
            incentiveValue: number;
            migratedTickets: number;
        };
    };
}
