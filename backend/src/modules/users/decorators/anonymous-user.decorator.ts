// src/modules/users/decorators/anonymous-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Interface pour les données d'utilisateur anonyme extraites de la requête
export interface AnonymousUserData {
  id?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  onboardingKey?: string;
  incentiveType?: string;
  incentiveValue?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
}

/**
 * Decorator pour extraire les données d'utilisateur anonyme de la requête
 * 
 * Utilisation:
 * ```typescript
 * @Post('checkout')
 * async checkout(@AnonymousUser() anonymousData: AnonymousUserData) {
 *   // anonymousData contient les informations de l'utilisateur anonyme
 * }
 * ```
 * 
 * Les données peuvent provenir de:
 * - Headers HTTP (X-Guest-Name, X-Guest-Email, etc.)
 * - Body de la requête (guestName, guestEmail, etc.)
 * - Query parameters (?guestName=..., etc.)
 * - Session (si stockée)
 */
export const AnonymousUser = createParamDecorator(
  (data: keyof AnonymousUserData | undefined, ctx: ExecutionContext): AnonymousUserData => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    // Construire l'objet données anonyme à partir de différentes sources
    const anonymousData: AnonymousUserData = {};
    
    // 1. Extraire depuis les headers HTTP
    const headers = request.headers;
    if (headers['x-guest-name']) {
      anonymousData.guestName = headers['x-guest-name'] as string;
    }
    if (headers['x-guest-email']) {
      anonymousData.guestEmail = headers['x-guest-email'] as string;
    }
    if (headers['x-guest-phone']) {
      anonymousData.guestPhone = headers['x-guest-phone'] as string;
    }
    if (headers['x-onboarding-key']) {
      anonymousData.onboardingKey = headers['x-onboarding-key'] as string;
    }
    if (headers['x-session-id']) {
      anonymousData.sessionId = headers['x-session-id'] as string;
    }
    if (headers['x-device-fingerprint']) {
      anonymousData.fingerprint = headers['x-device-fingerprint'] as string;
    }
    
    // 2. Extraire depuis le body de la requête (pour POST/PUT)
    const body = request.body || {};
    if (body.guestName) {
      anonymousData.guestName = body.guestName;
    }
    if (body.guestEmail) {
      anonymousData.guestEmail = body.guestEmail;
    }
    if (body.guestPhone) {
      anonymousData.guestPhone = body.guestPhone;
    }
    if (body.onboardingKey) {
      anonymousData.onboardingKey = body.onboardingKey;
    }
    if (body.anonymousMetadata) {
      anonymousData.metadata = body.anonymousMetadata;
    }
    
    // 3. Extraire depuis les query parameters
    const query = request.query || {};
    if (query.guestName) {
      anonymousData.guestName = query.guestName as string;
    }
    if (query.guestEmail) {
      anonymousData.guestEmail = query.guestEmail as string;
    }
    if (query.onboardingKey) {
      anonymousData.onboardingKey = query.onboardingKey as string;
    }
    
    // 4. Ajouter les informations de la requête
    anonymousData.ipAddress = request.ip || 
      request.connection?.remoteAddress || 
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string;
      
    anonymousData.userAgent = request.headers['user-agent'];
    
    // 5. Extraire depuis la session si disponible
    const session = (request as any).session;
    if (session?.anonymousUser) {
      Object.assign(anonymousData, session.anonymousUser);
    }
    
    // 6. Chercher dans les cookies
    const cookies = request.cookies || {};
    if (cookies.anonymousId) {
      anonymousData.id = cookies.anonymousId;
    }
    if (cookies.guestEmail) {
      anonymousData.guestEmail = cookies.guestEmail;
    }
    if (cookies.sessionId) {
      anonymousData.sessionId = cookies.sessionId;
    }
    
    // 7. Traiter les métadonnées spéciales depuis les headers
    if (headers['x-anonymous-metadata']) {
      try {
        const headerMetadata = JSON.parse(headers['x-anonymous-metadata'] as string);
        anonymousData.metadata = { ...anonymousData.metadata, ...headerMetadata };
      } catch (error) {
        // Header metadata invalide, on ignore silencieusement
      }
    }
    
    // Si un champ spécifique est demandé, le retourner directement
    if (data) {
      return anonymousData[data] as any;
    }
    
    return anonymousData;
  },
);

/**
 * Fonction utilitaire pour extraire les données anonymes d'une requête
 * Utilisée par tous les decorators pour éviter la duplication de code
 */
function extractAnonymousData(ctx: ExecutionContext): AnonymousUserData {
  const request = ctx.switchToHttp().getRequest<Request>();
  
  // Construire l'objet données anonyme à partir de différentes sources
  const anonymousData: AnonymousUserData = {};
  
  // 1. Extraire depuis les headers HTTP
  const headers = request.headers;
  if (headers['x-guest-name']) {
    anonymousData.guestName = headers['x-guest-name'] as string;
  }
  if (headers['x-guest-email']) {
    anonymousData.guestEmail = headers['x-guest-email'] as string;
  }
  if (headers['x-guest-phone']) {
    anonymousData.guestPhone = headers['x-guest-phone'] as string;
  }
  if (headers['x-onboarding-key']) {
    anonymousData.onboardingKey = headers['x-onboarding-key'] as string;
  }
  if (headers['x-session-id']) {
    anonymousData.sessionId = headers['x-session-id'] as string;
  }
  if (headers['x-device-fingerprint']) {
    anonymousData.fingerprint = headers['x-device-fingerprint'] as string;
  }
  
  // 2. Extraire depuis le body de la requête (pour POST/PUT)
  const body = request.body || {};
  if (body.guestName) {
    anonymousData.guestName = body.guestName;
  }
  if (body.guestEmail) {
    anonymousData.guestEmail = body.guestEmail;
  }
  if (body.guestPhone) {
    anonymousData.guestPhone = body.guestPhone;
  }
  if (body.onboardingKey) {
    anonymousData.onboardingKey = body.onboardingKey;
  }
  if (body.anonymousMetadata) {
    anonymousData.metadata = body.anonymousMetadata;
  }
  
  // 3. Extraire depuis les query parameters
  const query = request.query || {};
  if (query.guestName) {
    anonymousData.guestName = query.guestName as string;
  }
  if (query.guestEmail) {
    anonymousData.guestEmail = query.guestEmail as string;
  }
  if (query.onboardingKey) {
    anonymousData.onboardingKey = query.onboardingKey as string;
  }
  
  // 4. Ajouter les informations de la requête
  anonymousData.ipAddress = request.ip || 
    request.connection?.remoteAddress || 
    request.headers['x-forwarded-for'] as string ||
    request.headers['x-real-ip'] as string;
    
  anonymousData.userAgent = request.headers['user-agent'];
  
  // 5. Extraire depuis la session si disponible
  const session = (request as any).session;
  if (session?.anonymousUser) {
    Object.assign(anonymousData, session.anonymousUser);
  }
  
  // 6. Chercher dans les cookies
  const cookies = request.cookies || {};
  if (cookies.anonymousId) {
    anonymousData.id = cookies.anonymousId;
  }
  if (cookies.guestEmail) {
    anonymousData.guestEmail = cookies.guestEmail;
  }
  if (cookies.sessionId) {
    anonymousData.sessionId = cookies.sessionId;
  }
  
  // 7. Traiter les métadonnées spéciales depuis les headers
  if (headers['x-anonymous-metadata']) {
    try {
      const headerMetadata = JSON.parse(headers['x-anonymous-metadata'] as string);
      anonymousData.metadata = { ...anonymousData.metadata, ...headerMetadata };
    } catch (error) {
      // Header metadata invalide, on ignore silencieusement
    }
  }
  
  return anonymousData;
}

/**
 * Decorator spécialisé pour extraire uniquement l'email de l'utilisateur anonyme
 * 
 * Utilisation:
 * ```typescript
 * @Post('newsletter')
 * async subscribe(@AnonymousUserEmail() email: string) {
 *   // email contient l'email de l'utilisateur anonyme
 * }
 * ```
 */
export const AnonymousUserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.guestEmail;
  },
);

/**
 * Decorator spécialisé pour extraire la clé d'onboarding
 * 
 * Utilisation:
 * ```typescript
 * @Post('convert')
 * async convertToRegistered(@OnboardingKey() key: string) {
 *   // key contient la clé d'onboarding
 * }
 * ```
 */
export const OnboardingKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.onboardingKey;
  },
);

/**
 * Decorator spécialisé pour extraire l'ID de session anonyme
 */
export const AnonymousSessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const anonymousData = extractAnonymousData(ctx);
    return anonymousData.sessionId;
  },
);