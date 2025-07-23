export interface IUserProfile {
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
    roles?: string[];
    permissions?: string[];
    subscription?: {
        tier: 'FREE' | 'PREMIUM' | 'VIP';
        expiresAt?: string;
    };
    preferences?: any;
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
    first_name: string;
    last_name: string;
    phone?: string;
    is_active?: boolean;
    email_verified?: Date | null;
    phone_verified?: Date | null;
    metadata?: any;
}
