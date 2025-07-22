export declare class RegisterDto {
    email: string;
    password: string;
    passwordConfirm: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptTerms: boolean;
    marketingConsent?: boolean;
    language?: string;
    source?: string;
    referralCode?: string;
}
export declare class CheckEmailAvailabilityDto {
    email: string;
}
export declare class CheckPasswordStrengthDto {
    password: string;
}
