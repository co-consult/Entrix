// src/common/decorators/permissions.decorator.ts
/**
 * Décorateur de permissions pour les endpoints Entrix
 * 
 * Fonctionnalités :
 * - Définition des permissions requises sur les méthodes/classes
 * - Support des permissions multiples (ET/OU)
 * - Permissions contextuelles (propre ressource)
 * - Permissions conditionnelles
 * - Intégration avec PermissionsGuard
 * 
 * Usage :
 * @Permissions('users.read', 'users.update')
 * @Permissions({ permissions: ['admin'], operator: 'OR' })
 * @Permissions({ own: true, permissions: ['users.update.own'] })
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { Permission } from '../constants/permissions.constants';

/**
 * Clé de métadonnées pour les permissions
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Opérateur logique pour les permissions multiples
 */
export type PermissionOperator = 'AND' | 'OR';

/**
 * Configuration des permissions
 */
export interface PermissionConfig {
  /** Liste des permissions requises */
  permissions: Permission[];
  
  /** Opérateur logique (défaut: AND) */
  operator?: PermissionOperator;
  
  /** Accès autorisé à ses propres ressources uniquement */
  own?: boolean;
  
  /** Champ à vérifier pour la propriété (défaut: 'userId') */
  ownField?: string;
  
  /** Permissions conditionnelles basées sur le contexte */
  conditional?: ConditionalPermission[];
  
  /** Bypass si super admin */
  allowSuperAdmin?: boolean;
  
  /** Message d'erreur personnalisé */
  errorMessage?: string;
}

/**
 * Permission conditionnelle
 */
export interface ConditionalPermission {
  /** Condition à vérifier */
  condition: (context: any) => boolean;
  
  /** Permissions requises si condition vraie */
  permissions: Permission[];
  
  /** Message d'erreur si accès refusé */
  errorMessage?: string;
}

/**
 * Décorateur de permissions (version simple)
 * 
 * @param permissions - Liste des permissions requises
 * @returns Décorateur de méthode/classe
 * 
 * @example
 * ```typescript
 * @Permissions('users.read', 'users.update')
 * async updateUser() { ... }
 * ```
 */
export function Permissions(...permissions: Permission[]): CustomDecorator<string>;

/**
 * Décorateur de permissions (version avancée)
 * 
 * @param config - Configuration des permissions
 * @returns Décorateur de méthode/classe
 * 
 * @example
 * ```typescript
 * @Permissions({
 *   permissions: ['users.update'],
 *   own: true,
 *   ownField: 'userId'
 * })
 * async updateUser() { ... }
 * ```
 */
export function Permissions(config: PermissionConfig): CustomDecorator<string>;

/**
 * Implémentation du décorateur
 */
export function Permissions(
  ...args: Permission[] | [PermissionConfig]
): CustomDecorator<string> {
  // Vérifier si premier argument est une configuration
  if (args.length === 1 && typeof args[0] === 'object' && 'permissions' in args[0]) {
    const config = args[0] as PermissionConfig;
    
    // Valeurs par défaut
    const finalConfig: Required<PermissionConfig> = {
      permissions: config.permissions,
      operator: config.operator || 'AND',
      own: config.own || false,
      ownField: config.ownField || 'userId',
      conditional: config.conditional || [],
      allowSuperAdmin: config.allowSuperAdmin !== false, // true par défaut
      errorMessage: config.errorMessage || 'Permissions insuffisantes',
    };
    
    return SetMetadata(PERMISSIONS_KEY, finalConfig);
  }
  
  // Version simple avec liste de permissions
  const permissions = args as Permission[];
  const config: Required<PermissionConfig> = {
    permissions,
    operator: 'AND',
    own: false,
    ownField: 'userId',
    conditional: [],
    allowSuperAdmin: true,
    errorMessage: 'Permissions insuffisantes',
  };
  
  return SetMetadata(PERMISSIONS_KEY, config);
}

/**
 * Décorateur pour ressources propres uniquement
 * 
 * @param permissions - Permissions requises
 * @param ownField - Champ à vérifier (défaut: 'userId')
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @OwnResource('users.update.own')
 * async updateOwnProfile() { ... }
 * ```
 */
export const OwnResource = (
  permissions: Permission | Permission[],
  ownField: string = 'userId'
): CustomDecorator<string> => {
  return Permissions({
    permissions: Array.isArray(permissions) ? permissions : [permissions],
    own: true,
    ownField,
  });
};

/**
 * Décorateur pour permissions avec opérateur OU
 * 
 * @param permissions - Permissions (une seule suffit)
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @AnyPermission('users.read', 'users.read.own')
 * async getUser() { ... }
 * ```
 */
export const AnyPermission = (...permissions: Permission[]): CustomDecorator<string> => {
  return Permissions({
    permissions,
    operator: 'OR',
  });
};

/**
 * Décorateur pour admins uniquement
 * 
 * @param includeOrganizerAdmin - Inclure les admins organisateurs
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @AdminOnly()
 * async deleteUser() { ... }
 * ```
 */
export const AdminOnly = (includeOrganizerAdmin: boolean = false): CustomDecorator<string> => {
  const permissions: Permission[] = ['system.settings.manage'];
  
  if (includeOrganizerAdmin) {
    permissions.push('organizers.manage.own');
  }
  
  return Permissions({
    permissions,
    operator: 'OR',
  });
};

/**
 * Décorateur pour super admin uniquement
 * 
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @SuperAdminOnly()
 * async dangerousOperation() { ... }
 * ```
 */
export const SuperAdminOnly = (): CustomDecorator<string> => {
  return Permissions({
    permissions: ['system.settings.manage'],
    allowSuperAdmin: true,
    errorMessage: 'Accès réservé aux super administrateurs',
  });
};

/**
 * Décorateur pour permissions conditionnelles
 * 
 * @param basePermissions - Permissions de base
 * @param conditionalPermissions - Permissions conditionnelles
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @ConditionalPermissions(
 *   ['events.read'],
 *   [{
 *     condition: (ctx) => ctx.event.visibility === 'PRIVATE',
 *     permissions: ['events.read.private']
 *   }]
 * )
 * async getEvent() { ... }
 * ```
 */
export const ConditionalPermissions = (
  basePermissions: Permission[],
  conditionalPermissions: ConditionalPermission[]
): CustomDecorator<string> => {
  return Permissions({
    permissions: basePermissions,
    conditional: conditionalPermissions,
  });
};

/**
 * Décorateur pour bypass complet (développement uniquement)
 * ⚠️ À utiliser avec précaution, jamais en production
 * 
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @BypassPermissions() // UNIQUEMENT POUR LE DÉVELOPPEMENT
 * async debugEndpoint() { ... }
 * ```
 */
export const BypassPermissions = (): CustomDecorator<string> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BypassPermissions ne peut pas être utilisé en production');
  }
  
  return SetMetadata(PERMISSIONS_KEY, null);
};

/**
 * Décorateur pour ressources publiques (pas de vérification)
 * 
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @PublicResource()
 * async getPublicEvents() { ... }
 * ```
 */
export const PublicResource = (): CustomDecorator<string> => {
  return SetMetadata(PERMISSIONS_KEY, 'public');
};

/**
 * Décorateur pour authentification optionnelle
 * Les permissions sont vérifiées seulement si utilisateur connecté
 * 
 * @param permissions - Permissions à vérifier si connecté
 * @returns Décorateur de méthode
 * 
 * @example
 * ```typescript
 * @OptionalAuth('events.read.premium')
 * async getEvents() { ... } // Public + premium si connecté
 * ```
 */
export const OptionalAuth = (...permissions: Permission[]): CustomDecorator<string> => {
  return SetMetadata(PERMISSIONS_KEY, {
    permissions,
    optional: true,
  });
};

/**
 * Utilitaire pour extraire la configuration des permissions
 * Utilisé par PermissionsGuard
 * 
 * @param target - Classe ou prototype
 * @param propertyKey - Nom de la méthode
 * @returns Configuration des permissions ou null
 */
export function getPermissionsConfig(
  target: any,
  propertyKey?: string
): Required<PermissionConfig> | 'public' | null {
  const { Reflector } = require('@nestjs/core');
  const reflector = new Reflector();
  
  // Vérifier méthode d'abord, puis classe
  if (propertyKey) {
    const methodPermissions = reflector.get(
      PERMISSIONS_KEY,
      target[propertyKey]
    ) as Required<PermissionConfig> | 'public' | null;
    
    if (methodPermissions !== undefined) {
      return methodPermissions;
    }
  }
  
  // Vérifier classe
  const classPermissions = reflector.get(
    PERMISSIONS_KEY,
    target
  ) as Required<PermissionConfig> | 'public' | null;
  
  return classPermissions || null;
}

/**
 * Type pour l'export des métadonnées de permissions
 */
export type PermissionsMetadata = Required<PermissionConfig> | 'public' | null;