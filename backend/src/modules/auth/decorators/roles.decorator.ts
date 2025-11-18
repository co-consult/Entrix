// src/modules/auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Decorators rôles et permissions Entrix V3.0
 * Contrôle d'accès basé sur rôles (RBAC)
 */

// Clés metadata
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

/**
 * Decorator @Roles() - Requiert rôles spécifiques
 * Usage: @Roles('admin', 'organizer')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator @Permissions() - Requiert permissions spécifiques
 * Usage: @Permissions('events.create', 'tickets.manage')
 */
export const Permissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator @RequireAllRoles() - Requiert TOUS les rôles
 * Usage: @RequireAllRoles('admin', 'super_admin')
 */
export const RequireAllRoles = (...roles: string[]) => {
  SetMetadata(ROLES_KEY, roles);
  SetMetadata(REQUIRE_ALL_ROLES_KEY, true);
};

/**
 * Decorator @RequireAllPermissions() - Requiert TOUTES les permissions
 * Usage: @RequireAllPermissions('events.create', 'venues.manage')
 */
export const RequireAllPermissions = (...permissions: string[]) => {
  SetMetadata(PERMISSIONS_KEY, permissions);
  SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, true);
};

/**
 * Decorator @AdminOnly() - Accès admin uniquement
 * Usage: @AdminOnly()
 */
export const AdminOnly = () => SetMetadata(ROLES_KEY, ['admin']);

/**
 * Decorator @OrganizerOnly() - Accès organisateur uniquement
 * Usage: @OrganizerOnly()
 */
export const OrganizerOnly = () => SetMetadata(ROLES_KEY, ['organizer']);

/**
 * Decorator @SuperAdminOnly() - Accès super admin uniquement
 * Usage: @SuperAdminOnly()
 */
export const SuperAdminOnly = () => SetMetadata(ROLES_KEY, ['super_admin']);

/**
 * Decorator @ModeratorOrAdmin() - Accès modérateur ou admin
 * Usage: @ModeratorOrAdmin()
 */
export const ModeratorOrAdmin = () => SetMetadata(ROLES_KEY, ['moderator', 'admin']);
