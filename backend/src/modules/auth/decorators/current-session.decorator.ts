// src/modules/auth/decorators/current-session.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorators session Entrix V3.0
 * Extraction sécurisée des données de session depuis JWT/headers
 */

// Type pour le contexte de session
export interface SessionContext {
  sessionId?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: any;
}

/**
 * Decorator @CurrentSession() - Récupère informations session complètes
 * Usage: @CurrentSession() session: SessionContext
 */
export const CurrentSession = createParamDecorator(
  (data: keyof SessionContext | undefined, ctx: ExecutionContext): SessionContext | any => {
    const request = ctx.switchToHttp().getRequest();
    
    const sessionContext: SessionContext = {
      sessionId: request.sessionId || request.user?.sessionId,
      deviceFingerprint: request.deviceFingerprint || request.headers['x-device-fingerprint'],
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      geolocation: request.geolocation,
    };

    // Si propriété spécifique demandée
    if (data) {
      return sessionContext[data];
    }

    return sessionContext;
  },
);

/**
 * Decorator @SessionId() - Récupère uniquement l'ID de session
 * Usage: @SessionId() sessionId: string
 */
export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.sessionId || request.user?.sessionId || null;
  },
);

/**
 * Decorator @DeviceFingerprint() - Récupère empreinte appareil
 * Usage: @DeviceFingerprint() fingerprint: string
 */
export const DeviceFingerprint = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.deviceFingerprint || 
           request.headers['x-device-fingerprint'] || 
           request.user?.deviceFingerprint || 
           null;
  },
);

/**
 * Decorator @ClientInfo() - Récupère informations client complètes
 * Usage: @ClientInfo() client: { ip: string; userAgent: string; deviceFingerprint?: string }
 */
export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { ip: string; userAgent: string; deviceFingerprint?: string } => {
    const request = ctx.switchToHttp().getRequest();
    
    // Extract real client IP from various headers (in order of preference)
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const realIp = request.headers?.['x-real-ip'];
    const clientIp = request.headers?.['x-client-ip'];
    
    // Get the first IP from X-Forwarded-For (in case of multiple proxies)
    const realClientIp = forwardedFor 
      ? forwardedFor.split(',')[0].trim()
      : realIp || clientIp || request.ip || request.connection?.remoteAddress || 'unknown';
    
    return {
      ip: realClientIp,
      userAgent: request.headers['user-agent'] || 'unknown',
      deviceFingerprint: request.deviceFingerprint || request.headers['x-device-fingerprint'],
    };
  },
);