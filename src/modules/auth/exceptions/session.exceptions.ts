// src/modules/auth/exceptions/session.exceptions.ts
import { NotFoundException, BadRequestException, UnauthorizedException} from '@nestjs/common'
import { ERROR_CONSTANTS } from '../constants/error.constants'
/**
 * Exceptions de gestion des sessions Entrix V3.0
 */

// Session expirée
export class SessionExpiredException extends UnauthorizedException {
  constructor() {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.SESSION_EXPIRED;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        requireLogin: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Refresh token invalide
export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    const errorData = ERROR_CONSTANTS.AUTH_ERRORS.INVALID_REFRESH_TOKEN;
    super({
      success: false,
      error: {
        code: errorData.code,
        message: errorData.message,
        details: errorData.details,
        requireLogin: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Trop de sessions actives
export class TooManySessionsException extends BadRequestException {
  constructor(maxSessions: number) {
    super({
      success: false,
      error: {
        code: 'TOO_MANY_SESSIONS',
        message: 'Trop de sessions actives',
        details: `Maximum ${maxSessions} sessions autorisées`,
        maxSessions,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Session non trouvée
export class SessionNotFoundException extends NotFoundException {
  constructor(sessionId: string) {
    super({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Session introuvable',
        details: 'La session demandée n\'existe pas ou a été révoquée',
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}