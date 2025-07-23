export interface IPasswordReset {
    email: string;
    token: string;
    expiresAt: Date;
    used: boolean;
}
export interface IPasswordService {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateResetToken(email: string): Promise<string>;
    validateResetToken(token: string): Promise<IPasswordReset | null>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    validatePasswordStrength(password: string): Promise<{
        isValid: boolean;
        score: number;
        suggestions: string[];
    }>;
}
