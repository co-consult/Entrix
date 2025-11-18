// src/modules/users/decorators/group-permissions.decorator.ts

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Types basés sur le schema Prisma pour les groupes
export type GroupRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LEFT';

// Permissions possibles dans un groupe
export type GroupPermission = 
  | 'canInvite'
  | 'canPurchase' 
  | 'canViewOrders'
  | 'canManageMembers'
  | 'canEditGroup'
  | 'canDeleteGroup'
  | 'canViewFinances'
  | 'canApproveJoins';

// Configuration des permissions par rôle (par défaut)
export const DEFAULT_ROLE_PERMISSIONS: Record<GroupRole, GroupPermission[]> = {
  OWNER: [
    'canInvite',
    'canPurchase',
    'canViewOrders',
    'canManageMembers',
    'canEditGroup',
    'canDeleteGroup',
    'canViewFinances',
    'canApproveJoins'
  ],
  ADMIN: [
    'canInvite',
    'canPurchase',
    'canViewOrders',
    'canManageMembers',
    'canEditGroup',
    'canViewFinances',
    'canApproveJoins'
  ],
  MANAGER: [
    'canInvite',
    'canPurchase',
    'canViewOrders',
    'canViewFinances'
  ],
  MEMBER: [
    'canPurchase'
  ]
};

// Interface pour les informations de membership dans un groupe
export interface GroupMembershipInfo {
  groupId: string;
  userId: string;
  role: GroupRole;
  status: MembershipStatus;
  joinedAt: Date;
  validUntil?: Date;
  permissions: GroupPermission[];
  spendingLimit?: number;
  isActive: boolean;
}

/**
 * Metadata key pour les permissions de groupe requises
 */
export const GROUP_PERMISSIONS_KEY = 'group_permissions';

/**
 * Decorator de classe/méthode pour définir les permissions de groupe requises
 * 
 * Utilisation sur une méthode:
 * ```typescript
 * @RequireGroupPermissions(['canManageMembers'])
 * @Post('groups/:groupId/members')
 * async addMember(@Param('groupId') groupId: string) {
 *   // Seuls les utilisateurs avec la permission canManageMembers peuvent accéder
 * }
 * ```
 * 
 * Utilisation avec rôle minimum:
 * ```typescript
 * @RequireGroupPermissions(['canEditGroup'], 'ADMIN')
 * @Put('groups/:groupId')
 * async updateGroup() {
 *   // Seuls les ADMIN ou OWNER peuvent modifier le groupe
 * }
 * ```
 */
export const RequireGroupPermissions = (
  permissions: GroupPermission[],
  minimumRole?: GroupRole
) => {
  return SetMetadata(GROUP_PERMISSIONS_KEY, { permissions, minimumRole });
};

/**
 * Decorator pour exiger un rôle minimum dans le groupe
 */
export const RequireGroupRole = (minimumRole: GroupRole) => {
  return SetMetadata(GROUP_PERMISSIONS_KEY, { minimumRole, permissions: [] });
};

/**
 * Decorator pour exiger d'être propriétaire du groupe
 */
export const RequireGroupOwner = () => {
  return RequireGroupRole('OWNER');
};

/**
 * Decorator param pour extraire les informations de membership dans un groupe
 * 
 * Utilisation:
 * ```typescript
 * @UseGuards(JwtAuthGuard, GroupMemberGuard)
 * @Get('groups/:groupId/dashboard')
 * async getGroupDashboard(
 *   @Param('groupId') groupId: string,
 *   @GroupMembership() membership: GroupMembershipInfo
 * ) {
 *   // membership contient les informations du membre dans ce groupe
 * }
 * ```
 */
export const GroupMembership = createParamDecorator(
  (data: keyof GroupMembershipInfo | undefined, ctx: ExecutionContext): GroupMembershipInfo | any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    // Les informations de membership doivent être attachées par un guard
    const membership = (request as any).groupMembership;
    
    if (!membership) {
      return null;
    }
    
    // Si un champ spécifique est demandé, le retourner directement
    if (data) {
      return membership[data];
    }
    
    return membership;
  },
);

/**
 * Decorator pour extraire le rôle de l'utilisateur dans le groupe
 */
export const GroupRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GroupRole | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const membership = (request as any).groupMembership;
    return membership?.role || null;
  },
);

/**
 * Decorator pour extraire les permissions de l'utilisateur dans le groupe
 */
export const GroupPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GroupPermission[] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const membership = (request as any).groupMembership;
    return membership?.permissions || [];
  },
);

/**
 * Decorator pour vérifier si l'utilisateur a une permission spécifique
 * 
 * Utilisation:
 * ```typescript
 * @Get('groups/:groupId/members')
 * async getMembers(
 *   @HasGroupPermission('canViewOrders') canViewOrders: boolean
 * ) {
 *   // canViewOrders indique si l'utilisateur peut voir les commandes
 * }
 * ```
 */
export const HasGroupPermission = (permission: GroupPermission) => 
  createParamDecorator(
    (data: unknown, ctx: ExecutionContext): boolean => {
      const request = ctx.switchToHttp().getRequest<Request>();
      const membership = (request as any).groupMembership;
      const permissions = membership?.permissions || [];
      return permissions.includes(permission);
    },
  );

/**
 * Decorator pour vérifier si l'utilisateur est propriétaire du groupe
 */
export const IsGroupOwner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const membership = (request as any).groupMembership;
    return membership?.role === 'OWNER';
  },
);

/**
 * Decorator pour vérifier si l'utilisateur est admin ou propriétaire
 */
export const IsGroupAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const membership = (request as any).groupMembership;
    const role = membership?.role;
    return role === 'OWNER' || role === 'ADMIN';
  },
);

/**
 * Decorator pour extraire la limite de dépense de l'utilisateur dans le groupe
 */
export const GroupSpendingLimit = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const membership = (request as any).groupMembership;
    return membership?.spendingLimit || null;
  },
);

/**
 * Utilitaire pour vérifier si un rôle a une hiérarchie suffisante
 */
export function hasMinimumRole(userRole: GroupRole, minimumRole: GroupRole): boolean {
  const roleHierarchy: Record<GroupRole, number> = {
    MEMBER: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Utilitaire pour obtenir les permissions par défaut d'un rôle
 */
export function getDefaultPermissionsForRole(role: GroupRole): GroupPermission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Utilitaire pour vérifier si un utilisateur peut effectuer une action sur un autre membre
 * (basé sur la hiérarchie des rôles)
 */
export function canManageMember(managerRole: GroupRole, targetRole: GroupRole): boolean {
  // Un propriétaire peut gérer tout le monde
  if (managerRole === 'OWNER') return true;
  
  // Un admin peut gérer les managers et membres
  if (managerRole === 'ADMIN') {
    return targetRole === 'MANAGER' || targetRole === 'MEMBER';
  }
  
  // Un manager peut gérer les membres
  if (managerRole === 'MANAGER') {
    return targetRole === 'MEMBER';
  }
  
  // Les membres ne peuvent gérer personne
  return false;
}

/**
 * Type guard pour vérifier si un membership est actif
 */
export function isActiveMembership(membership: GroupMembershipInfo): boolean {
  if (membership.status !== 'ACTIVE') return false;
  if (!membership.isActive) return false;
  if (membership.validUntil && membership.validUntil < new Date()) return false;
  return true;
}