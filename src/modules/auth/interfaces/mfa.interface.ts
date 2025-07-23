// src/modules/auth/interfaces/mfa.interface.ts

import { MfaProvider } from '../constants/auth.constants';

/**
 * Interfaces Multi-Factor Authentication Entrix V3.0
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

// Interface provider MFA
export interface IMfaProvider {
  type: MfaProvider;
  setup(userId: string): Promise<IMfaSetup>;
  verify(userId: string, code: string): Promise<boolean>;
  generateChallenge(userId: string): Promise<string>;
  cleanup(userId: string): Promise<void>;
}

// Interface service MFA
export interface IMfaService {
  setupMfa(userId: string, provider: MfaProvider): Promise<IMfaSetup>;
  verifyMfa(verification: IMfaVerification): Promise<boolean>;
  disableMfa(userId: string, provider: MfaProvider): Promise<boolean>;
  getAvailableProviders(userId: string): Promise<MfaProvider[]>;
  requiresMfa(userId: string, riskScore: number): Promise<boolean>;
}