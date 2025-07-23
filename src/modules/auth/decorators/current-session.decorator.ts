// src/modules/auth/decorators/current-session.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorators session Entrix V3.0
 * Extraction données de session depuis JWT/requête
 */

export interface SessionContext {
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Decorator @CurrentSession() - Récupère contexte session
 * Usage: @CurrentSession() session: SessionContext
 */
export const CurrentSession = createParamDecorator(
  (data: keyof SessionContext | undefined, ctx: ExecutionContext): SessionContext | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as any;

    if (!user) {
      return null;
    }

    // Construire contexte session depuis JWT et requête
    const sessionContext: SessionContext = {
      sessionId: user.sessionId || 'unknown',
      deviceFingerprint: user.deviceFingerprint,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers?.['user-agent'] || '',
      issuedAt: user.iat || 0,
      expiresAt: user.exp || 0,
    };

    // Si propriété spécifique demandée
    if (data) {
      return sessionContext[data];
    }

    return sessionContext;
  },
);

/**
 * Decorator @SessionId() - Récupère uniquement session ID
 * Usage: @SessionId() sessionId: string
 */
export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as any;
    return user?.sessionId || null;
  },
);

/**
 * Decorator @DeviceFingerprint() - Récupère empreinte device
 * Usage: @DeviceFingerprint() fingerprint: string
 */
export const DeviceFingerprint = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    
    // Priorité : header custom > JWT payload
    const headerFingerprint = request.headers?.['x-device-fingerprint'];
    if (headerFingerprint) {
      return headerFingerprint;
    }

    const user = request.user as any;
    return user?.deviceFingerprint || null;
  },
);

/**
 * Decorator @ClientInfo() - Récupère infos client
 * Usage: @ClientInfo() client: { ip: string, userAgent: string }
 */
export const ClientInfo = createParamDecorator(
  (data: 'ip' | 'userAgent' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    const clientInfo = {
      ip: request.ip || 'unknown',
      userAgent: request.headers?.['user-agent'] || '',
    };

    if (data) {
      return clientInfo[data];
    }

    return clientInfo;
  },
);