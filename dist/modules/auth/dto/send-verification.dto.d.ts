export declare enum VerificationType {
    EMAIL = "email",
    SMS = "sms",
    CALL = "call"
}
export declare class SendVerificationDto {
    type: VerificationType;
    email?: string;
    phoneNumber?: string;
    language?: 'fr' | 'ar' | 'en';
}
export declare class SendVerificationResponseDto {
    success: boolean;
    message: string;
    cooldownSeconds?: number;
    attemptsRemaining?: number;
    expiresAt?: string;
}
