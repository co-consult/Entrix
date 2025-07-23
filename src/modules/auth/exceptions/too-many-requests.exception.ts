// src/modules/auth/exceptions/too-many-requests.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception TooManyRequests (429) personnalisée Entrix V3.0
 * NestJS ne fournit pas cette exception par défaut
 */

export class TooManyRequestsException extends HttpException {
  constructor(message?: string, retryAfter?: number) {
    const response = {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: message || 'Trop de requêtes',
        retryAfter,
        timestamp: new Date().toISOString(),
      },
    };

    super(response, HttpStatus.TOO_MANY_REQUESTS);
  }
}
