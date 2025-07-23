// src/modules/auth/exceptions/mfa.exceptions.ts
import { ConflictException, BadRequestException, UnauthorizedException} from '@nestjs/common'

/**
 * Exceptions Multi-Factor Authentication Entrix V3.0
 */

// Provider MFA non supporté
export class UnsupportedMfaProviderException extends BadRequestException {
  constructor(provider: string) {
    super({
      success: false,
      error: {
        code: 'UNSUPPORTED_MFA_PROVIDER',
        message: 'Provider MFA non supporté',
        details: `Le provider "${provider}" n'est pas supporté`,
        supportedProviders: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// MFA déjà configuré
export class MfaAlreadySetupException extends ConflictException {
  constructor(provider: string) {
    super({
      success: false,
      error: {
        code: 'MFA_ALREADY_SETUP',
        message: 'MFA déjà configuré',
        details: `Le provider "${provider}" est déjà configuré pour cet utilisateur`,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Challenge MFA expiré
export class MfaChallengeExpiredException extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: {
        code: 'MFA_CHALLENGE_EXPIRED',
        message: 'Challenge MFA expiré',
        details: 'Veuillez demander un nouveau code',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Code de récupération invalide
export class InvalidBackupCodeException extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: {
        code: 'INVALID_BACKUP_CODE',
        message: 'Code de récupération invalide',
        details: 'Ce code a déjà été utilisé ou n\'existe pas',
        timestamp: new Date().toISOString(),
      },
    });
  }
}