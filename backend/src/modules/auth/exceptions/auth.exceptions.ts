import { 
  HttpException, 
  HttpStatus, 
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { TooManyRequestsException } from './too-many-requests.exception';
import { ERROR_CONSTANTS } from '../constants/error.constants';

/**
 * Exceptions personnalisées pour l'authentification Entrix V3.0
 * Respecte api_specs_auth_session.md et ERROR_CONSTANTS
 */

// Exception de base pour l'authentification
export abstract class AuthException extends HttpException {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    httpStatus: HttpStatus,
    details?: any
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          details,
          timestamp: new Date().toISOString(),
          requestId: AuthException.generateRequestId(),
        },
      },
      httpStatus
    );

    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }

  private static generateRequestId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Identifiants invalides
export class InvalidCredentialsException extends UnauthorizedException {
  constructor(attemptsRemaining?: number) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.INVALID_CREDENTIALS;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        attemptsRemaining,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Compte verrouillé
export class AccountLockedException extends HttpException {
  constructor(unlockAt?: Date) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.ACCOUNT_LOCKED;
    super(
      {
        success: false,
        error: {
          code: errorData.code,
          message: errorData.message,
          details: errorData.details,
          unlockAt: unlockAt?.toISOString(),
          contactSupport: true,
          timestamp: new Date().toISOString(),
        },
      },
      errorData.httpStatus
    );
  }
}

// Email non vérifié
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.EMAIL_NOT_VERIFIED;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// MFA requis
export class MfaRequiredException extends HttpException {
  constructor(challengeToken: string, methods: string[], expiresIn: number) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.MFA_REQUIRED;
    super(
      {
        success: false,
        error: {
          code: errorData.code,
          message: errorData.message,
          details: errorData.details,
          mfaChallenge: {
            challengeToken,
            methods,
            expiresIn,
          },
          timestamp: new Date().toISOString(),
        },
      },
      errorData.httpStatus
    );
  }
}

// Code MFA invalide
export class InvalidMfaCodeException extends UnauthorizedException {
  constructor(attemptsRemaining?: number) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.INVALID_MFA_CODE;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        attemptsRemaining,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Appareil non fiable
export class DeviceNotTrustedException extends HttpException {
  constructor(verificationMethod: string) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.DEVICE_NOT_TRUSTED;
    super(
      {
        success: false,
        error: {
          code: errorData.code,
          message: errorData.message,
          details: errorData.details,
          verificationMethod,
          timestamp: new Date().toISOString(),
        },
      },
      errorData.httpStatus
    );
  }
}

// Email déjà utilisé
export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Mot de passe faible
export class WeakPasswordException extends BadRequestException {
  constructor(suggestions?: string[]) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.WEAK_PASSWORD;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        suggestions,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Rate limiting - CORRIGÉ avec la nouvelle classe
export class RateLimitedException extends TooManyRequestsException {
  constructor(retryAfter: number) {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.RATE_LIMITED;
    super(errorData.message, retryAfter);
  }
}

// Token de réinitialisation invalide
export class InvalidResetTokenException extends BadRequestException {
  constructor() {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.INVALID_RESET_TOKEN;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Captcha requis
export class CaptchaRequiredException extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: {
        code: 'CAPTCHA_REQUIRED',
        message: 'Vérification CAPTCHA requise',
        details: 'Veuillez compléter la vérification CAPTCHA',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Captcha invalide
export class InvalidCaptchaException extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: {
        code: 'INVALID_CAPTCHA',
        message: 'CAPTCHA invalide',
        details: 'La vérification CAPTCHA a échoué',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Token device invalide
export class InvalidDeviceTokenException extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: {
        code: 'INVALID_DEVICE_TOKEN',
        message: 'Token d\'appareil invalide',
        details: 'Le token de vérification d\'appareil est invalide ou expiré',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export de la nouvelle exception pour réutilisation
export { TooManyRequestsException };