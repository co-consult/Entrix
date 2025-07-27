// src/modules/auth/interfaces/mfa.interface.ts

/**
 * Interfaces Multi-Factor Authentication complètes Entrix V3.0
 * Respecte schema.prisma user_mfa_settings et mfa_tokens
 */

// Interface challenge MFA selon api_specs_auth_session.md
export interface IMfaChallenge {
  methods: MfaProvider[];
  challengeToken: string;
  expiresIn: number; // secondes
}

// Interface setup MFA
export interface IMfaSetup {
  provider: MfaProvider;
  qrCode?: string; // Pour TOTP
  secret?: string; // Pour TOTP
  backupCodes?: string[]; // Codes de récupération
}

// Interface vérification MFA
export interface IMfaVerification {
  challengeToken: string;
  method: MfaProvider;
  code: string;
  trustDevice?: boolean;
}

// Interface configuration MFA utilisateur (basée sur user_mfa_settings)
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

// Interface token MFA (basée sur mfa_tokens)
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

// Interface appareil de confiance (basée sur user_trusted_devices)
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

// Interface statistiques MFA
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

// Interface provider MFA
export interface IMfaProvider {
  type: MfaProvider;
  setup(userId: string): Promise<IMfaSetup>;
  verify(userId: string, code: string): Promise<boolean>;
  generateChallenge(userId: string): Promise<string>;
  cleanup(userId: string): Promise<void>;
  sendCode?(userId: string, destination: string): Promise<boolean>;
}

// Interface service MFA enrichi
export interface IMfaService {
  // Configuration de base
  setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup>;
  verifyMfa(verification: IMfaVerification): Promise<boolean>;
  disableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
  
  // Gestion avancée
  enableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
  getAvailableProviders(userId: string): Promise<MfaProvider[]>;
  getConfiguredMethods(userId: string): Promise<MfaProvider[]>;
  requiresMfa(userId: string, riskScore: number): Promise<boolean>;
  
  // Gestion des challenges
  generateMfaChallenge(
    userId: string, 
    availableMethods: MfaProvider[], 
    deviceFingerprint?: string
  ): Promise<IMfaChallenge>;
  
  // Codes de récupération
  regenerateBackupCodes(userId: string): Promise<string[]>;
  getBackupCodesCount(userId: string): Promise<number>;
  
  // Appareils de confiance
  getTrustedDevices(userId: string): Promise<any[]>;
  getTrustedDevicesCount(userId: string): Promise<number>;
  removeTrustedDevice(userId: string, deviceId: string): Promise<boolean>;
  
  // Informations et statistiques
  getPrimaryMethod(userId: string): Promise<MfaProvider | null>;
  getLastUsedDate(userId: string): Promise<Date | null>;
  getMfaStats(userId: string): Promise<IMfaStats>;
  
  // Envoi de codes
  sendEmailCode(userId: string): Promise<boolean>;
  
  // Utilitaires
  cleanupExpiredTokens(): Promise<number>;
  cleanupExpiredTrustedDevices(): Promise<number>;
}

// Interface configuration provider spécifique
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
  generateSecret(userEmail: string): Promise<{ secret: string; qrCode: string }>;
  verifyCode(secret: string, code: string): boolean;
  generateQrCode(secret: string, userEmail: string): Promise<string>;
}

// Interface données de challenge (interne)
export interface IMfaChallengeData {
  userId: string;
  methods: MfaProvider[];
  deviceFingerprint?: string;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
}

// Interface réponse d'envoi de code
export interface IMfaCodeSendResult {
  success: boolean;
  method: 'SMS_OTP' | 'EMAIL_OTP';
  sentTo: string; // Masqué
  expiresIn: number;
  estimatedDelivery: string;
  canResendAfter: number;
}

// Interface configuration MFA de session
export interface IMfaSessionConfig {
  mfaSessionDuration: number; // secondes
  allowDeviceTrust: boolean;
  deviceTrustDuration: number; // jours
  maxTrustedDevices: number;
  requireMfaForSensitiveActions: boolean;
}

// Interface événement MFA pour audit
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

// Interface métriques MFA pour monitoring
export interface IMfaMetrics {
  activeUsers: number;
  totalSetups: number;
  totalVerifications: number;
  successRate: number;
  methodDistribution: Record<MfaProvider, number>;
  averageSetupTime: number;
  trustedDevicesTotal: number;
}

// Interface risque MFA
export interface IMfaRiskAssessment {
  riskScore: number; // 0-100
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

// Type pour mapping entre providers et methods
export type MfaMethodMapping = {
  'SMS_OTP': 'SMS';
  'EMAIL_OTP': 'EMAIL';
  'TOTP_APP': 'TOTP';
  'BACKUP_CODE': 'BACKUP_CODES';
};

// Type pour le statut d'une méthode MFA
export type MfaMethodStatus = {
  provider: MfaProvider;
  isConfigured: boolean;
  isEnabled: boolean;
  isPrimary: boolean;
  lastUsed?: Date;
  setupDate?: Date;
  metadata?: any;
};

// Type pour les options de setup MFA
export type MfaSetupOptions = {
  provider: MfaProvider;
  isPrimary?: boolean;
  customName?: string;
  backupPhone?: string; // Pour SMS
  skipVerification?: boolean; // Pour tests
};

// Type pour les options de vérification MFA
export type MfaVerifyOptions = {
  allowBackupCodes?: boolean;
  trustDevice?: boolean;
  deviceName?: string;
  skipRateLimit?: boolean; // Pour tests
};

// Export de types utilitaires
export type MfaProvider = 'SMS_OTP' | 'EMAIL_OTP' | 'TOTP_APP' | 'BACKUP_CODE';
export type MfaMethod = 'SMS' | 'EMAIL' | 'TOTP' | 'APP_PUSH' | 'HARDWARE_TOKEN' | 'BIOMETRIC' | 'BACKUP_CODES';