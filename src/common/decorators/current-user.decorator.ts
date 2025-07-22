// src/common/decorators/current-user.decorator.ts
/**
 * Décorateur pour récupérer l'utilisateur courant
 * 
 * Utilisation :
 * - Extraction des informations utilisateur depuis la requête
 * - Typé avec l'interface AuthUser
 * - Compatible avec les guards d'authentification
 * - Support des propriétés spécifiques
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/auth.types';

/**
 * Décorateur pour récupérer l'utilisateur authentifié
 * 
 * @param data - Propriété spécifique à extraire (optionnel)
 * @param ctx - Contexte d'exécution
 * @returns Utilisateur complet ou propriété spécifique
 * 
 * @example
 * ```typescript
 * // Utilisateur complet
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 * 
 * // Propriété spécifique
 * @Get('id')
 * getUserId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Si une propriété spécifique est demandée
    if (data) {
      return user[data];
    }

    // Retourner l'utilisateur complet
    return user;
  },
);

/**
 * Décorateur pour récupérer le contexte d'authentification complet
 * 
 * @example
 * ```typescript
 * @Get('context')
 * getContext(@CurrentAuthContext() context: AuthContext) {
 *   return context;
 * }
 * ```
 */
export const CurrentAuthContext = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authContext = request.authContext;

    if (!authContext) {
      return null;
    }

    if (data) {
      return authContext[data];
    }

    return authContext;
  },
);

/**
 * Décorateur pour récupérer l'ID de session courante
 * 
 * @example
 * ```typescript
 * @Post('logout')
 * logout(@CurrentSessionId() sessionId: string) {
 *   // ...
 * }
 * ```
 */
export const CurrentSessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.sessionId || null;
  },
);

/**
 * Décorateur pour récupérer les permissions de l'utilisateur
 * 
 * @example
 * ```typescript
 * @Get('permissions')
 * getPermissions(@CurrentPermissions() permissions: string[]) {
 *   return permissions;
 * }
 * ```
 */
export const CurrentPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return user?.permissions || [];
  },
);

/**
 * Décorateur pour récupérer les rôles de l'utilisateur
 * 
 * @example
 * ```typescript
 * @Get('roles')
 * getRoles(@CurrentRoles() roles: UserRole[]) {
 *   return roles;
 * }
 * ```
 */
export const CurrentRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return user?.roles || [];
  },
);