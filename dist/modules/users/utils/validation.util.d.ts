export declare class ValidationUtil {
    static validateEmail(email: string): {
        isValid: boolean;
        errors: string[];
    };
    static validatePhone(phone: string): {
        isValid: boolean;
        errors: string[];
        normalizedPhone?: string;
    };
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
        strength: 'weak' | 'medium' | 'strong';
    };
    static validateGroupName(name: string): {
        isValid: boolean;
        errors: string[];
        suggestions?: string[];
    };
    static validateDateOfBirth(dateOfBirth: Date): {
        isValid: boolean;
        errors: string[];
        age?: number;
    };
    static validateCountryCode(countryCode: string): {
        isValid: boolean;
        errors: string[];
        normalizedCode?: string;
    };
    static validateOnboardingKey(key: string): {
        isValid: boolean;
        errors: string[];
        normalizedKey?: string;
    };
    static validateInvitationMessage(message: string): {
        isValid: boolean;
        errors: string[];
        warnings?: string[];
    };
    static validateUserData(userData: {
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        password?: string;
        dateOfBirth?: Date;
        country?: string;
    }): {
        isValid: boolean;
        errors: string[];
        warnings?: string[];
    };
}
