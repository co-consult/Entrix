// src/modules/auth/exceptions/rate-limit.exceptions.ts

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception Rate Limiting Registration Entrix V3.0
 * ✅ CORRIGÉ : Exception spécifique pour rate limiting inscription (429)
 */

export class RegistrationRateLimitedException extends HttpException {
  constructor(retryAfter: number = 3600) { // Default 1 heure
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        errorCode: 'REGISTRATION_RATE_LIMITED',
        message: 'Trop de tentatives d\'inscription depuis cette adresse IP',
        details: {
          retryAfter, // Secondes avant nouvelle tentative
          retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
          reason: 'Limite de sécurité dépassée',
          suggestion: 'Veuillez attendre avant de créer un nouveau compte'
        },
        meta: {
          rateLimit: {
            type: 'registration',
            window: '1 heure',
            maxAttempts: 3,
            timeToReset: retryAfter
          }
        }
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class LoginRateLimitedException extends HttpException {
  constructor(retryAfter: number = 900) { // Default 15 minutes
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        errorCode: 'LOGIN_RATE_LIMITED',
        message: 'Trop de tentatives de connexion depuis cette adresse IP',
        details: {
          retryAfter,
          retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
          reason: 'Protection contre les attaques par force brute',
          suggestion: 'Veuillez attendre avant de réessayer'
        },
        meta: {
          rateLimit: {
            type: 'login',
            window: '15 minutes',
            maxAttempts: 5,
            timeToReset: retryAfter
          }
        }
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class PasswordResetRateLimitedException extends HttpException {
  constructor(retryAfter: number = 3600) { // Default 1 heure
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        errorCode: 'PASSWORD_RESET_RATE_LIMITED',
        message: 'Trop de demandes de réinitialisation de mot de passe',
        details: {
          retryAfter,
          retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
          reason: 'Limite de sécurité dépassée',
          suggestion: 'Veuillez attendre avant de demander une nouvelle réinitialisation'
        },
        meta: {
          rateLimit: {
            type: 'password_reset',
            window: '1 heure',
            maxAttempts: 3,
            timeToReset: retryAfter
          }
        }
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

export class MfaRateLimitedException extends HttpException {
  constructor(retryAfter: number = 300) { // Default 5 minutes
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        errorCode: 'MFA_RATE_LIMITED',
        message: 'Trop de tentatives de vérification MFA',
        details: {
          retryAfter,
          retryAfterReadable: `${Math.ceil(retryAfter / 60)} minutes`,
          reason: 'Protection contre les attaques par force brute',
          suggestion: 'Veuillez attendre avant de réessayer votre code MFA'
        },
        meta: {
          rateLimit: {
            type: 'mfa_verification',
            window: '5 minutes',
            maxAttempts: 5,
            timeToReset: retryAfter
          }
        }
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}