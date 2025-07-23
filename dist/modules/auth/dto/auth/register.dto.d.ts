export declare class RegisterDto {
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
export declare class RegisterDtoAlternative {
    termsAccepted: boolean;
}
export declare class RegisterDtoCustomValidator {
    termsAccepted: boolean;
}
