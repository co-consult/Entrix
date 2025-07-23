import { TokenPairDto } from '../auth/login-response.dto';
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class RefreshTokenResponseDto {
    success: boolean;
    data?: {
        tokens: TokenPairDto;
        sessionExtended: boolean;
    };
}
