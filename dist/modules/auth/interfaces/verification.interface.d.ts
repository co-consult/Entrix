export interface IVerificationStatus {
    emailVerified: boolean;
    phoneVerified: boolean;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
    verificationLevel: 'NONE' | 'EMAIL' | 'PHONE' | 'FULL';
}
export interface IEmailVerificationToken {
    id: string;
    userId: string;
    token: string;
    email: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
}
export interface IPhoneVerificationToken {
    id: string;
    userId: string;
    token: string;
    phone: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
}
export interface IVerificationRequest {
    userId: string;
    type: 'EMAIL' | 'PHONE';
    contact: string;
}
export interface IVerificationResult {
    success: boolean;
    verified: boolean;
    message: string;
    userId?: string;
    verificationLevel?: 'NONE' | 'EMAIL' | 'PHONE' | 'FULL';
}
export interface IEmailVerificationService {
    generateVerificationToken(userId: string, email: string): Promise<IEmailVerificationToken>;
    verifyEmail(token: string): Promise<IVerificationResult>;
    resendVerification(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    cleanupExpiredTokens(): Promise<number>;
}
export declare const VERIFICATION_CONSTANTS: {
    readonly EMAIL_TOKEN_EXPIRY: number;
    readonly PHONE_TOKEN_EXPIRY: number;
    readonly MAX_RESEND_ATTEMPTS: 3;
    readonly RESEND_COOLDOWN: number;
};
