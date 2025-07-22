import { mfa_method } from '@prisma/client';
export declare class UserInfoDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    emailVerified?: Date;
    phoneVerified?: Date;
    roles: any[];
    permissions: string[];
    lastLogin?: Date;
}
export declare class TokenPairDto {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    refreshExpiresIn: number;
}
export declare class SessionInfoDto {
    id: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: any;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
}
export declare class AuthResponseDto {
    user?: UserInfoDto;
    tokens?: TokenPairDto;
    session?: SessionInfoDto;
    mfaRequired: boolean;
    mfaMethods?: mfa_method[];
}
