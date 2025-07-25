export interface IPasswordReset {
    email: string;
    token: string;
    expiresAt: Date;
    used: boolean;
}
export interface IPasswordValidation {
    isValid: boolean;
    score: number;
    strength: 'weak' | 'medium' | 'strong';
    suggestions: string[];
}
export interface IPasswordService {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    verifyUserPassword(userId: string, password: string): Promise<boolean>;
    verifyUserPasswordByEmail(email: string, password: string): Promise<boolean>;
    validatePasswordStrength(password: string): Promise<IPasswordValidation>;
    generateResetToken(email: string): Promise<string>;
    validateResetToken(token: string): Promise<IPasswordReset | null>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
}
