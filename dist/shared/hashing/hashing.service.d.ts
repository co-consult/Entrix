import { ConfigService } from '@nestjs/config';
export interface HashingConfig {
    passwordRounds: number;
    tokenRounds: number;
    apiKeyRounds: number;
    algorithm: string;
}
export interface HashingMetrics {
    hashesGenerated: number;
    verificationsPerformed: number;
    failedVerifications: number;
    averageHashTime: number;
    averageVerifyTime: number;
}
export declare class HashingService {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private readonly metrics;
    constructor(configService: ConfigService);
    hashPassword(plainPassword: string): Promise<string>;
    hashToken(plainToken: string): Promise<string>;
    hashApiKey(plainApiKey: string): Promise<string>;
    compare(plainText: string, hash: string): Promise<boolean>;
    validateHashFormat(hash: string): boolean;
    extractRounds(hash: string): number | null;
    shouldRehash(hash: string, targetRounds: number): boolean;
    rehashPasswordIfNeeded(plainPassword: string, currentHash: string): Promise<string | null>;
    getHashFingerprint(hash: string): string;
    getConfig(): HashingConfig;
    getMetrics(): HashingMetrics;
    resetMetrics(): void;
    private logConfiguration;
    private updateHashMetrics;
    private updateVerifyMetrics;
}
