import { ITokenPair, ISessionInfo } from '../../interfaces/session.interface';
import { IUserProfile } from '../../interfaces/user.interface';
import { IMfaChallenge } from '../../interfaces/mfa.interface';
export declare class UserProfileDto implements Omit<IUserProfile, 'created_at' | 'updated_at' | 'email_verified' | 'phone_verified' | 'last_login'> {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    lastLoginAt?: string;
    roles?: string[];
    permissions?: string[];
    subscription?: {
        tier: 'FREE' | 'PREMIUM' | 'VIP';
        expiresAt?: string;
    };
    preferences?: any;
    metadata: any | null;
}
export declare class TokenPairDto implements ITokenPair {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
}
export declare class SessionInfoDto implements ISessionInfo {
    sessionId: string;
    expiresAt: string;
    deviceInfo: any;
    isActive: boolean;
    lastActivity: string;
}
export declare class MfaChallengeDto implements IMfaChallenge {
    methods: any[];
    challengeToken: string;
    expiresIn: number;
}
export declare class LoginResponseDto {
    success: boolean;
    data?: {
        user: UserProfileDto;
        tokens: TokenPairDto;
        session: SessionInfoDto;
        mfaRequired?: MfaChallengeDto;
    };
    meta?: {
        riskScore: number;
        requiresMfa: boolean;
        ipGeolocation: string;
    };
}
