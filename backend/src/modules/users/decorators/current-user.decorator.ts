// src/modules/users/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Interface pour l'utilisateur connecté basée sur le schema Prisma
export interface CurrentUserData {
  // Champs de la table users selon schema.prisma
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations optionnelles si chargées
  profile?: {
    id: string;
    userId: string;
    dateOfBirth?: Date;
    gender?: 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    address?: string;
    city?: string;
    country: string;
    postalCode?: string;
    language: string;
    timezone?: string;
    notifications: boolean;
    newsletter: boolean;
    supporterSince?: Date;
    favoritePlayer?: string;
    favoriteTeamId?: string;
    preferences?: any;
    emergencyContact?: any;
    createdAt: Date;
    updatedAt: Date;
  };
  
  userGroups?: Array<{
    id: string;
    userId: string;
    groupId: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';
    joinedAt: Date;
    validUntil?: Date;
    addedBy?: string;
    metadata?: any;
  }>;
  
  userRoles?: Array<{
    id: string;
    userId: string;
    roleId: string;
    assignedAt: Date;
    validUntil?: Date;
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';
    assignedBy?: string;
    notes?: string;
  }>;
  
  // Informations de session courante
  sessionId?: string;
  sessionToken?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Decorator pour extraire l'utilisateur connecté de la requête
 * 
 * L'utilisateur doit être attaché à la requête par un guard d'authentification
 * (comme JwtAuthGuard) qui place l'utilisateur dans request.user
 * 
 * Utilisation:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile(@CurrentUser() user: CurrentUserData) {
 *   return user;
 * }
 * ```
 * 
 * Pour extraire un champ spécifique:
 * ```typescript
 * @Get('dashboard')
 * async getDashboard(@CurrentUser('id') userId: string) {
 *   // userId contient seulement l'ID de l'utilisateur
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | any => {
    const enrichedUser = extractCurrentUser(ctx);
    
    if (!enrichedUser) {
      return null;
    }
    
    // Si un champ spécifique est demandé, le retourner directement
    if (data) {
      return enrichedUser[data];
    }
    
    return enrichedUser;
  },
);

/**
 * Fonction utilitaire pour extraire l'utilisateur connecté d'une requête
 * Utilisée par tous les decorators pour éviter la duplication de code
 */
function extractCurrentUser(ctx: ExecutionContext): CurrentUserData | null {
  const request = ctx.switchToHttp().getRequest<Request>();
  
  // L'utilisateur doit être attaché à la requête par un guard d'authentification
  const user = (request as any).user;
  
  if (!user) {
    return null;
  }
  
  // Enrichir avec les informations de session courante
  const enrichedUser: CurrentUserData = {
    ...user,
    sessionId: (request as any).sessionId,
    sessionToken: request.headers.authorization?.replace('Bearer ', ''),
    deviceFingerprint: request.headers['x-device-fingerprint'] as string,
    ipAddress: request.ip || 
      request.connection?.remoteAddress || 
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string,
    userAgent: request.headers['user-agent'],
  };
  
  return enrichedUser;
}

/**
 * Decorator spécialisé pour extraire uniquement l'ID de l'utilisateur connecté
 * 
 * Utilisation:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Post('orders')
 * async createOrder(@CurrentUserId() userId: string, @Body() orderData: any) {
 *   return this.orderService.create(userId, orderData);
 * }
 * ```
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const user = extractCurrentUser(ctx);
    return user?.id;
  },
);

/**
 * Decorator spécialisé pour extraire l'email de l'utilisateur connecté
 */
export const CurrentUserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const user = extractCurrentUser(ctx);
    return user?.email;
  },
);

/**
 * Decorator spécialisé pour extraire le nom complet de l'utilisateur connecté
 */
export const CurrentUserFullName = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const user = extractCurrentUser(ctx);
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  },
);

/**
 * Decorator pour vérifier si l'utilisateur connecté est actif et vérifié
 * 
 * Utilisation:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Post('sensitive-action')
 * async performAction(@IsUserVerified() isVerified: boolean) {
 *   if (!isVerified) {
 *     throw new ForbiddenException('Account not verified');
 *   }
 *   // ...
 * }
 * ```
 */
export const IsUserVerified = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): boolean => {
    const user = extractCurrentUser(ctx);
    if (!user) return false;
    return user.isActive && user.emailVerified;
  },
);

/**
 * Decorator pour extraire les groupes de l'utilisateur connecté
 * 
 * Utilisation:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('my-groups')
 * async getMyGroups(@CurrentUserGroups() groups: CurrentUserData['userGroups']) {
 *   return groups;
 * }
 * ```
 */
export const CurrentUserGroups = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData['userGroups'] => {
    const user = extractCurrentUser(ctx);
    return user?.userGroups || [];
  },
);

/**
 * Decorator pour extraire le profil de l'utilisateur connecté
 */
export const CurrentUserProfile = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData['profile'] => {
    const user = extractCurrentUser(ctx);
    return user?.profile;
  },
);

/**
 * Type guard pour vérifier si l'utilisateur est complètement chargé avec ses relations
 */
export function isUserWithRelations(user: any): user is CurrentUserData & { 
  profile: NonNullable<CurrentUserData['profile']>;
  userGroups: NonNullable<CurrentUserData['userGroups']>;
} {
  return user && user.profile && user.userGroups;
}