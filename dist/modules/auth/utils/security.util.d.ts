export declare class SecurityUtil {
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
        strength: 'weak' | 'medium' | 'strong';
    };
    static generateSecurityHeaders(): Record<string, string>;
    static maskEmail(email: string): string;
    static maskPhoneNumber(phone: string): string;
    static isValidTunisianEmail(email: string): boolean;
    static isBruteForcePattern(attempts: {
        timestamp: Date;
        success: boolean;
    }[]): boolean;
    static generateRateLimitKey(type: string, identifier: string): string;
    static calculateBackoffDelay(attemptNumber: number, baseDelay?: number): number;
    static isValidJwtFormat(token: string): boolean;
    static extractJwtPayload(token: string): any | null;
    static isTokenExpired(token: string): boolean;
}
