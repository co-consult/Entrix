export declare class CryptoUtil {
    private static readonly SALT_ROUNDS;
    private static readonly HASH_ALGORITHM;
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    static generateSecureToken(length?: number): string;
    static generateUuid(): string;
    static sha256Hash(data: string): string;
    static generateOtpCode(length?: number): string;
    static generateBackupCodes(count?: number, length?: number): string[];
    static encrypt(text: string, key: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    static decrypt(encryptedData: {
        encrypted: string;
        iv: string;
        tag: string;
    }, key: string): string;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        suggestions: string[];
    };
}
