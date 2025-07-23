export interface IUserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
    emailVerified: Date | null;
    phoneVerified: Date | null;
    lastLogin: Date | null;
    metadata: any | null;
    createdAt: Date;
    updatedAt: Date;
    roles?: string[];
    permissions?: string[];
    subscription?: {
        tier: 'FREE' | 'PREMIUM' | 'VIP';
        expiresAt?: string;
    };
    preferences?: any;
}
export interface IUserDbRecord {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    email_verified: Date | null;
    phone_verified: Date | null;
    last_login: Date | null;
    metadata: any | null;
    created_at: Date;
    updated_at: Date;
    password: string;
}
export interface ILoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
    captchaToken?: string;
    deviceFingerprint?: string;
}
export interface IRegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    marketingConsent?: boolean;
    onboardingSecret?: string;
    termsAccepted: boolean;
}
export interface ICreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive?: boolean;
    emailVerified?: Date | null;
    phoneVerified?: Date | null;
    metadata?: any;
}
export declare class UserMapper {
    static fromDb(dbRecord: IUserDbRecord): IUserProfile;
    static toDb(userData: ICreateUserData): Omit<IUserDbRecord, 'id' | 'created_at' | 'updated_at'>;
    static fromRegisterRequest(registerData: IRegisterRequest): ICreateUserData;
}
