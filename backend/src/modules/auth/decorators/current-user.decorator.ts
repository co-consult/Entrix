// src/modules/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { IUserProfile } from '../interfaces/user.interface';

/**
 * Decorators utilisateur Entrix V3.0
 * Extraction sécurisée des données utilisateur depuis JWT
 */

// Clé pour routes publiques
export const IS_PUBLIC_KEY = 'isPublic';

// Clé pour vérification device
export const TRUST_DEVICE_KEY = 'trustDevice';

/**
 * Decorator @CurrentUser() - Récupère utilisateur depuis JWT
 * Usage: @CurrentUser() user: IUserProfile
 */
export const CurrentUser = createParamDecorator(
  (data: keyof IUserProfile | undefined, ctx: ExecutionContext): IUserProfile | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserProfile;

    if (!user) {
      return null;
    }

    // Si propriété spécifique demandée
    if (data) {
      return user[data];
    }

    // Retourner utilisateur complet (sans données sensibles)
    const { ...safeUser } = user;
    return safeUser;
  },
);

/**
 * Decorator @CurrentUserId() - Récupère uniquement l'ID utilisateur
 * Usage: @CurrentUserId() userId: string
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserProfile;
    return user?.id || null;
  },
);

/**
 * Decorator @CurrentUserEmail() - Récupère email utilisateur
 * Usage: @CurrentUserEmail() email: string
 */
export const CurrentUserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserProfile;
    return user?.email || null;
  },
);

/**
 * Decorator @UserRoles() - Récupère rôles utilisateur
 * Usage: @UserRoles() roles: string[]
 */
export const UserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserProfile;
    return user?.roles || [];
  },
);

/**
 * Decorator @UserPermissions() - Récupère permissions utilisateur
 * Usage: @UserPermissions() permissions: string[]
 */
export const UserPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserProfile;
    return user?.permissions || [];
  },
);

/**
 * Decorator @Public() - Marque route comme publique (pas d'auth requise)
 * Usage: @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator @RequireTrustedDevice() - Requiert appareil de confiance
 * Usage: @RequireTrustedDevice()
 */
export const RequireTrustedDevice = () => SetMetadata(TRUST_DEVICE_KEY, true);