import { ITokenPair, ISessionInfo } from '../../interfaces/session.interface';
import { IUserProfile } from '../../interfaces/user.interface';
import { IMfaChallenge } from '../../interfaces/mfa.interface';
export declare class UserProfileDto implements Omit<IUserProfile, 'createdAt' | 'updatedAt' | 'emailVerified' | 'phoneVerified' | 'lastLogin'> {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
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
    isReused?: boolean;
    sessionType?: 'reused' | 'refreshed' | 'new';
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
        sessionType?: 'reused' | 'refreshed' | 'new';
        wasSessionReused?: boolean;
    };
    message?: string;
}
export declare class UserProfileMapper {
    static toDto(userProfile: IUserProfile): UserProfileDto;
}
