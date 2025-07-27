export interface IMfaChallenge {
    methods: MfaProvider[];
    challengeToken: string;
    expiresIn: number;
}
export interface IMfaSetup {
    provider: MfaProvider;
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
}
export interface IMfaVerification {
    challengeToken: string;
    method: MfaProvider;
    code: string;
    trustDevice?: boolean;
}
export interface IUserMfaSettings {
    id: string;
    userId: string;
    method: 'SMS' | 'EMAIL' | 'TOTP' | 'APP_PUSH' | 'HARDWARE_TOKEN' | 'BIOMETRIC' | 'BACKUP_CODES';
    isEnabled: boolean;
    isPrimary: boolean;
    backupPhone?: string;
    totpSecret?: string;
    backupCodesCount: number;
    lastUsedAt?: Date;
    enabledAt?: Date;
    disabledAt?: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMfaToken {
    id: string;
    userId: string;
    method: 'SMS' | 'EMAIL' | 'TOTP' | 'APP_PUSH' | 'HARDWARE_TOKEN' | 'BIOMETRIC' | 'BACKUP_CODES';
    tokenHash: string;
    secret?: string;
    expiresAt: Date;
    isUsed: boolean;
    metadata?: any;
    createdAt: Date;
    usedAt?: Date;
}
export interface ITrustedDevice {
    id: string;
    userId: string;
    deviceFingerprint: string;
    deviceName?: string;
    trustedAt: Date;
    expiresAt: Date;
    lastSeenAt: Date;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    isActive: boolean;
    createdAt: Date;
}
export interface IMfaStats {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastSuccessfulVerification?: Date;
    mostUsedMethod: MfaProvider;
    methodUsageStats: Record<MfaProvider, number>;
    trustedDevicesHistory: {
        added: number;
        removed: number;
        expired: number;
    };
}
export interface IMfaProvider {
    type: MfaProvider;
    setup(userId: string): Promise<IMfaSetup>;
    verify(userId: string, code: string): Promise<boolean>;
    generateChallenge(userId: string): Promise<string>;
    cleanup(userId: string): Promise<void>;
    sendCode?(userId: string, destination: string): Promise<boolean>;
}
export interface IMfaService {
    setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup>;
    verifyMfa(verification: IMfaVerification): Promise<boolean>;
    disableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
    enableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
    getAvailableProviders(userId: string): Promise<MfaProvider[]>;
    getConfiguredMethods(userId: string): Promise<MfaProvider[]>;
    requiresMfa(userId: string, riskScore: number): Promise<boolean>;
    generateMfaChallenge(userId: string, availableMethods: MfaProvider[], deviceFingerprint?: string): Promise<IMfaChallenge>;
    regenerateBackupCodes(userId: string): Promise<string[]>;
    getBackupCodesCount(userId: string): Promise<number>;
    getTrustedDevices(userId: string): Promise<any[]>;
    getTrustedDevicesCount(userId: string): Promise<number>;
    removeTrustedDevice(userId: string, deviceId: string): Promise<boolean>;
    getPrimaryMethod(userId: string): Promise<MfaProvider | null>;
    getLastUsedDate(userId: string): Promise<Date | null>;
    getMfaStats(userId: string): Promise<IMfaStats>;
    sendEmailCode(userId: string): Promise<boolean>;
    cleanupExpiredTokens(): Promise<number>;
    cleanupExpiredTrustedDevices(): Promise<number>;
}
export interface ISmsProvider {
    sendSms(phoneNumber: string, message: string): Promise<boolean>;
    generateCode(): string;
    validatePhoneNumber(phone: string): boolean;
}
export interface IEmailProvider {
    sendEmail(email: string, subject: string, content: string): Promise<boolean>;
    generateCode(): string;
}
export interface ITotpProvider {
    generateSecret(userEmail: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    verifyCode(secret: string, code: string): boolean;
    generateQrCode(secret: string, userEmail: string): Promise<string>;
}
export interface IMfaChallengeData {
    userId: string;
    methods: MfaProvider[];
    deviceFingerprint?: string;
    createdAt: number;
    ipAddress?: string;
    userAgent?: string;
}
export interface IMfaCodeSendResult {
    success: boolean;
    method: 'SMS_OTP' | 'EMAIL_OTP';
    sentTo: string;
    expiresIn: number;
    estimatedDelivery: string;
    canResendAfter: number;
}
export interface IMfaSessionConfig {
    mfaSessionDuration: number;
    allowDeviceTrust: boolean;
    deviceTrustDuration: number;
    maxTrustedDevices: number;
    requireMfaForSensitiveActions: boolean;
}
export interface IMfaAuditEvent {
    userId: string;
    action: 'SETUP' | 'VERIFY' | 'DISABLE' | 'TRUST_DEVICE' | 'REMOVE_DEVICE' | 'REGENERATE_CODES';
    method?: MfaProvider;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    timestamp: Date;
}
export interface IMfaMetrics {
    activeUsers: number;
    totalSetups: number;
    totalVerifications: number;
    successRate: number;
    methodDistribution: Record<MfaProvider, number>;
    averageSetupTime: number;
    trustedDevicesTotal: number;
}
export interface IMfaRiskAssessment {
    riskScore: number;
    factors: {
        newDevice: boolean;
        newLocation: boolean;
        suspiciousActivity: boolean;
        timeOfAccess: boolean;
        multipleFailures: boolean;
    };
    recommendedMethods: MfaProvider[];
    requireMfa: boolean;
}
export type MfaMethodMapping = {
    'SMS_OTP': 'SMS';
    'EMAIL_OTP': 'EMAIL';
    'TOTP_APP': 'TOTP';
    'BACKUP_CODE': 'BACKUP_CODES';
};
export type MfaMethodStatus = {
    provider: MfaProvider;
    isConfigured: boolean;
    isEnabled: boolean;
    isPrimary: boolean;
    lastUsed?: Date;
    setupDate?: Date;
    metadata?: any;
};
export type MfaSetupOptions = {
    provider: MfaProvider;
    isPrimary?: boolean;
    customName?: string;
    backupPhone?: string;
    skipVerification?: boolean;
};
export type MfaVerifyOptions = {
    allowBackupCodes?: boolean;
    trustDevice?: boolean;
    deviceName?: string;
    skipRateLimit?: boolean;
};
export type MfaProvider = 'SMS_OTP' | 'EMAIL_OTP' | 'TOTP_APP' | 'BACKUP_CODE';
export type MfaMethod = 'SMS' | 'EMAIL' | 'TOTP' | 'APP_PUSH' | 'HARDWARE_TOKEN' | 'BIOMETRIC' | 'BACKUP_CODES';
