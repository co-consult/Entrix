export declare class UserRoleDto {
    id: string;
    code: string;
    name: string;
    level: number;
    assignedAt: Date;
    validUntil?: Date;
    status: string;
}
export declare class UserInfoDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    emailVerified?: Date;
    phoneVerified?: Date;
    roles: UserRoleDto[];
    permissions: string[];
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    verificationStatus: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'FULLY_VERIFIED';
    mfaEnabled: boolean;
    activeSessions: number;
    preferences?: {
        language: string;
        timezone: string;
        notifications: boolean;
        newsletter: boolean;
    };
}
