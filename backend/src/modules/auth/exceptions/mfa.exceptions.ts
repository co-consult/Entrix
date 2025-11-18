// src/modules/auth/exceptions/mfa.exceptions.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { MfaProvider } from '../constants/auth.constants';

/**
 * Exceptions MFA Entrix V3.0
 * Respecte les codes d'erreur standardisés
 */

export class MfaChallengeExpiredException extends HttpException {
  constructor() {
    super(
      {
        message: 'Challenge MFA expiré. Veuillez recommencer l\'authentification.',
        error: 'MFA_CHALLENGE_EXPIRED',
        statusCode: HttpStatus.PRECONDITION_REQUIRED
      },
      HttpStatus.PRECONDITION_REQUIRED
    );
  }
}

export class MfaNotConfiguredException extends HttpException {
  constructor(provider?: MfaProvider | string) {
    const message = provider 
      ? `Méthode MFA ${provider} non configurée pour cet utilisateur`
      : 'Aucune méthode MFA configurée pour cet utilisateur';

    super(
      {
        message,
        error: 'MFA_NOT_CONFIGURED',
        statusCode: HttpStatus.PRECONDITION_REQUIRED,
        provider
      },
      HttpStatus.PRECONDITION_REQUIRED
    );
  }
}

export class MfaAlreadyConfiguredException extends HttpException {
  constructor(provider: MfaProvider) {
    super(
      {
        message: `Méthode MFA ${provider} déjà configurée pour cet utilisateur`,
        error: 'MFA_ALREADY_CONFIGURED',
        statusCode: HttpStatus.CONFLICT,
        provider
      },
      HttpStatus.CONFLICT
    );
  }
}

export class MfaCodeInvalidException extends HttpException {
  constructor() {
    super(
      {
        message: 'Code MFA invalide ou expiré',
        error: 'MFA_CODE_INVALID',
        statusCode: HttpStatus.UNAUTHORIZED
      },
      HttpStatus.UNAUTHORIZED
    );
  }
}

export class MfaRateLimitException extends HttpException {
  constructor(remainingTime: number) {
    super(
      {
        message: `Trop de tentatives MFA. Réessayez dans ${Math.ceil(remainingTime / 60)} minutes.`,
        error: 'MFA_RATE_LIMITED',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        remainingTime
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class MfaProviderNotSupportedException extends HttpException {
  constructor(provider: string) {
    super(
      {
        message: `Provider MFA non supporté: ${provider}`,
        error: 'MFA_PROVIDER_NOT_SUPPORTED',
        statusCode: HttpStatus.BAD_REQUEST,
        provider
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MfaSetupIncompleteException extends HttpException {
  constructor(provider: MfaProvider) {
    super(
      {
        message: `Configuration MFA ${provider} incomplète. Veuillez finaliser le setup.`,
        error: 'MFA_SETUP_INCOMPLETE',
        statusCode: HttpStatus.PRECONDITION_REQUIRED,
        provider
      },
      HttpStatus.PRECONDITION_REQUIRED
    );
  }
}

export class MfaBackupCodesExhaustedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Tous les codes de récupération ont été utilisés. Configurez une nouvelle méthode MFA.',
        error: 'MFA_BACKUP_CODES_EXHAUSTED',
        statusCode: HttpStatus.PRECONDITION_REQUIRED
      },
      HttpStatus.PRECONDITION_REQUIRED
    );
  }
}

export class MfaDeviceNotTrustedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Appareil non reconnu. Authentification MFA requise.',
        error: 'MFA_DEVICE_NOT_TRUSTED',
        statusCode: HttpStatus.PRECONDITION_REQUIRED
      },
      HttpStatus.PRECONDITION_REQUIRED
    );
  }
}