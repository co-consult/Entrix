// src/modules/users/utils/group-permissions.util.ts

import { GroupRole, GroupPermissions, GroupType, GroupMember, MemberStatus } from '../types/group.types';
import { GROUP_CONSTANTS } from '../constants/group.constants';

/**
 * Utilitaires pour la gestion des permissions dans les groupes
 */
export class GroupPermissionsUtil {
  
  /**
   * Hiérarchie des rôles (du plus élevé au plus bas)
   */
  private static readonly ROLE_HIERARCHY: Record<GroupRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    MEMBER: 1,
  };
  
  /**
   * Vérifie si un rôle est supérieur ou égal à un autre
   */
  static isRoleHigherOrEqual(role: GroupRole, comparedTo: GroupRole): boolean {
    return this.ROLE_HIERARCHY[role] >= this.ROLE_HIERARCHY[comparedTo];
  }
  
  /**
   * Vérifie si un rôle est strictement supérieur à un autre
   */
  static isRoleHigher(role: GroupRole, comparedTo: GroupRole): boolean {
    return this.ROLE_HIERARCHY[role] > this.ROLE_HIERARCHY[comparedTo];
  }
  
  /**
   * Retourne le rôle le plus élevé parmi une liste
   */
  static getHighestRole(roles: GroupRole[]): GroupRole | null {
    if (roles.length === 0) return null;
    
    return roles.reduce((highest, current) => 
      this.isRoleHigher(current, highest) ? current : highest
    );
  }
  
  /**
   * Génère les permissions par défaut selon le rôle et le type de groupe
   */
  static getDefaultPermissions(role: GroupRole, groupType: GroupType): GroupPermissions {
    const basePermissions = GROUP_CONSTANTS.DEFAULT_PERMISSIONS[role];
    const groupSettings = GROUP_CONSTANTS.DEFAULT_SETTINGS[groupType];
    
    // Ajustements selon le type de groupe
    const adjustedPermissions = { ...basePermissions };
    
    // Pour les groupes corporates, plus de restrictions
    if (groupType === 'CORPORATE') {
      if (role === 'MEMBER') {
        adjustedPermissions.canInvite = false;
        adjustedPermissions.spendingLimit = 200; // Limite plus basse
      }
    }
    
    // Pour les groupes familiaux, plus de liberté
    if (groupType === 'FAMILY') {
      if (role === 'MEMBER') {
        adjustedPermissions.canViewOrders = true;
        adjustedPermissions.spendingLimit = 1000; // Limite plus élevée
      }
    }
    
    // Pour les groupes temporaires, permissions limitées
    if (groupType === 'TEMPORARY') {
      adjustedPermissions.canInvite = role !== 'MEMBER';
      adjustedPermissions.spendingLimit = Math.min(adjustedPermissions.spendingLimit || 500, 300);
    }
    
    return adjustedPermissions;
  }
  
  /**
   * Vérifie si un membre a une permission spécifique
   */
  static hasPermission(
    member: GroupMember,
    permission: keyof Omit<GroupPermissions, 'spendingLimit'>,
    groupType?: GroupType
  ): boolean {
    // Vérifier le statut du membre
    if (member.status !== 'ACTIVE') {
      return false;
    }
    
    // Le propriétaire a toutes les permissions
    if (member.role === 'OWNER') {
      return true;
    }
    
    // Vérifier les permissions explicites
    const hasExplicitPermission = member.permissions[permission] === true;
    
    // Si pas de permissions explicites, utiliser les permissions par défaut du rôle
    if (member.permissions[permission] === undefined && groupType) {
      const defaultPermissions = this.getDefaultPermissions(member.role, groupType);
      return defaultPermissions[permission] === true;
    }
    
    return hasExplicitPermission;
  }
  
  /**
   * Vérifie si un membre peut effectuer un achat d'un montant donné
   */
  static canPurchase(member: GroupMember, amount: number, groupType?: GroupType): {
    allowed: boolean;
    reason?: string;
    remainingLimit?: number;
  } {
    // Vérifier le statut
    if (member.status !== 'ACTIVE') {
      return { allowed: false, reason: 'Membre inactif' };
    }
    
    // Vérifier la permission de base
    if (!this.hasPermission(member, 'canPurchase', groupType)) {
      return { allowed: false, reason: 'Permission d\'achat non accordée' };
    }
    
    // Vérifier la limite de dépense
    const spendingLimit = member.permissions.spendingLimit;
    
    // Pas de limite (null ou undefined)
    if (spendingLimit === null || spendingLimit === undefined) {
      return { allowed: true };
    }
    
    // Calculer les dépenses actuelles + nouveau montant
    const currentSpent = member.totalSpent || 0;
    const totalAfterPurchase = currentSpent + amount;
    
    if (totalAfterPurchase > spendingLimit) {
      return {
        allowed: false,
        reason: `Limite de dépense dépassée (${spendingLimit} TND)`,
        remainingLimit: Math.max(0, spendingLimit - currentSpent),
      };
    }
    
    return {
      allowed: true,
      remainingLimit: spendingLimit - totalAfterPurchase,
    };
  }
  
  /**
   * Vérifie si un membre peut gérer un autre membre
   */
  static canManageMember(
    manager: GroupMember,
    target: GroupMember,
    action: 'update_role' | 'update_permissions' | 'remove' | 'suspend'
  ): {
    allowed: boolean;
    reason?: string;
  } {
    // Un membre ne peut pas se gérer lui-même (sauf pour quitter)
    if (manager.id === target.id && action !== 'remove') {
      return { allowed: false, reason: 'Impossible de se gérer soi-même' };
    }
    
    // Seuls les rôles élevés peuvent gérer les membres
    if (!this.isRoleHigherOrEqual(manager.role, 'MANAGER')) {
      return { allowed: false, reason: 'Rôle insuffisant pour gérer les membres' };
    }
    
    // On ne peut pas gérer quelqu'un de rang égal ou supérieur
    if (!this.isRoleHigher(manager.role, target.role)) {
      return { allowed: false, reason: 'Impossible de gérer un membre de rang égal ou supérieur' };
    }
    
    // Le propriétaire ne peut pas être géré
    if (target.role === 'OWNER') {
      return { allowed: false, reason: 'Le propriétaire ne peut pas être géré' };
    }
    
    // Actions spécifiques
    switch (action) {
      case 'update_role':
        // Seuls les admins et propriétaires peuvent changer les rôles
        if (!this.isRoleHigherOrEqual(manager.role, 'ADMIN')) {
          return { allowed: false, reason: 'Rôle admin requis pour modifier les rôles' };
        }
        break;
        
      case 'remove':
        // Les managers peuvent retirer des membres de rang inférieur
        break;
        
      case 'suspend':
        // Les managers peuvent suspendre des membres de rang inférieur
        break;
        
      case 'update_permissions':
        // Les admins peuvent modifier les permissions
        if (!this.isRoleHigherOrEqual(manager.role, 'ADMIN')) {
          return { allowed: false, reason: 'Rôle admin requis pour modifier les permissions' };
        }
        break;
    }
    
    return { allowed: true };
  }
  
  /**
   * Vérifie si un membre peut inviter d'autres personnes
   */
  static canInvite(
    member: GroupMember,
    groupType: GroupType,
    currentGroupSize: number,
    maxGroupSize?: number
  ): {
    allowed: boolean;
    reason?: string;
  } {
    // Vérifier le statut
    if (member.status !== 'ACTIVE') {
      return { allowed: false, reason: 'Membre inactif' };
    }
    
    // Vérifier la permission
    if (!this.hasPermission(member, 'canInvite', groupType)) {
      return { allowed: false, reason: 'Permission d\'invitation non accordée' };
    }
    
    // Vérifier si le groupe n'est pas plein
    if (maxGroupSize && currentGroupSize >= maxGroupSize) {
      return { allowed: false, reason: 'Groupe complet' };
    }
    
    return { allowed: true };
  }
  
  /**
   * Calcule les permissions effectives d'un membre en fusionnant rôle et permissions explicites
   */
  static calculateEffectivePermissions(
    member: GroupMember,
    groupType: GroupType
  ): GroupPermissions {
    const defaultPermissions = this.getDefaultPermissions(member.role, groupType);
    
    // Les permissions explicites du membre remplacent les permissions par défaut
    const effectivePermissions: GroupPermissions = {
      canInvite: member.permissions.canInvite ?? defaultPermissions.canInvite,
      canPurchase: member.permissions.canPurchase ?? defaultPermissions.canPurchase,
      canViewOrders: member.permissions.canViewOrders ?? defaultPermissions.canViewOrders,
      canManageMembers: member.permissions.canManageMembers ?? defaultPermissions.canManageMembers,
      canEditGroup: member.permissions.canEditGroup ?? defaultPermissions.canEditGroup,
      canDeleteGroup: member.permissions.canDeleteGroup ?? defaultPermissions.canDeleteGroup,
      spendingLimit: member.permissions.spendingLimit ?? defaultPermissions.spendingLimit,
    };
    
    return effectivePermissions;
  }
  
  /**
   * Valide une mise à jour de permissions
   */
  static validatePermissionUpdate(
    currentMember: GroupMember,
    newPermissions: Partial<GroupPermissions>,
    updatedBy: GroupMember,
    groupType: GroupType
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier que celui qui modifie a le droit
    const canManage = this.canManageMember(updatedBy, currentMember, 'update_permissions');
    if (!canManage.allowed) {
      errors.push(canManage.reason || 'Permission refusée');
    }
    
    // Vérifier les permissions individuelles
    if (newPermissions.canDeleteGroup === true && currentMember.role !== 'OWNER') {
      errors.push('Seul le propriétaire peut avoir la permission de suppression');
    }
    
    if (newPermissions.canEditGroup === true && !this.isRoleHigherOrEqual(currentMember.role, 'ADMIN')) {
      warnings.push('La permission d\'édition est généralement réservée aux administrateurs');
    }
    
    // Vérifier la limite de dépense
    if (newPermissions.spendingLimit !== undefined) {
      if (newPermissions.spendingLimit !== null && newPermissions.spendingLimit < 0) {
        errors.push('La limite de dépense ne peut pas être négative');
      }
      
      if (newPermissions.spendingLimit !== null && newPermissions.spendingLimit > 50000) {
        warnings.push('Limite de dépense très élevée (> 50 000 TND)');
      }
    }
    
    // Avertissements basés sur le type de groupe
    if (groupType === 'CORPORATE' && newPermissions.canInvite === true && currentMember.role === 'MEMBER') {
      warnings.push('Dans un groupe corporate, il est inhabituel que les membres simples puissent inviter');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * Détermine le rôle maximum qu'un membre peut attribuer à un autre
   */
  static getMaxAssignableRole(assignerRole: GroupRole): GroupRole {
    switch (assignerRole) {
      case 'OWNER':
        return 'ADMIN'; // Le propriétaire peut nommer des admins
      case 'ADMIN':
        return 'MANAGER'; // Les admins peuvent nommer des managers
      case 'MANAGER':
        return 'MEMBER'; // Les managers peuvent seulement inviter des membres
      case 'MEMBER':
        return 'MEMBER'; // Les membres ne peuvent que proposer d'autres membres
      default:
        return 'MEMBER';
    }
  }
  
  /**
   * Calcule les actions disponibles pour un membre dans un contexte donné
   */
  static getAvailableActions(
    member: GroupMember,
    groupType: GroupType,
    groupSize: number,
    maxGroupSize?: number
  ): string[] {
    const actions: string[] = [];
    
    if (member.status !== 'ACTIVE') {
      return ['view_group']; // Membre inactif ne peut que voir
    }
    
    // Actions de base
    actions.push('view_group', 'view_members');
    
    // Actions selon les permissions
    if (this.hasPermission(member, 'canViewOrders', groupType)) {
      actions.push('view_orders');
    }
    
    if (this.hasPermission(member, 'canPurchase', groupType)) {
      actions.push('make_purchase');
    }
    
    if (this.canInvite(member, groupType, groupSize, maxGroupSize).allowed) {
      actions.push('invite_members');
    }
    
    if (this.hasPermission(member, 'canManageMembers', groupType)) {
      actions.push('manage_members');
    }
    
    if (this.hasPermission(member, 'canEditGroup', groupType)) {
      actions.push('edit_group_settings');
    }
    
    if (this.hasPermission(member, 'canDeleteGroup', groupType)) {
      actions.push('delete_group');
    }
    
    // Le propriétaire peut transférer la propriété
    if (member.role === 'OWNER') {
      actions.push('transfer_ownership');
    }
    
    // Tout le monde peut quitter (sauf le propriétaire seul)
    if (member.role !== 'OWNER' || groupSize > 1) {
      actions.push('leave_group');
    }
    
    return actions;
  }
  
  /**
   * Suggère des ajustements de permissions selon le contexte
   */
  static suggestPermissionAdjustments(
    groupType: GroupType,
    memberCount: number,
    currentPermissions: GroupPermissions,
    role: GroupRole
  ): Array<{
    suggestion: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      suggestion: string;
      reason: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];
    
    // Suggestions selon le type de groupe
    if (groupType === 'FAMILY' && !currentPermissions.canViewOrders && role !== 'MEMBER') {
      suggestions.push({
        suggestion: 'Activer la visualisation des commandes',
        reason: 'Dans un groupe familial, la transparence est généralement appréciée',
        priority: 'medium',
      });
    }
    
    if (groupType === 'CORPORATE' && currentPermissions.canInvite && role === 'MEMBER') {
      suggestions.push({
        suggestion: 'Restreindre les invitations aux managers+',
        reason: 'Dans un contexte corporate, il est préférable de contrôler les invitations',
        priority: 'high',
      });
    }
    
    // Suggestions selon la taille du groupe
    if (memberCount > 10 && currentPermissions.canManageMembers && role === 'MEMBER') {
      suggestions.push({
        suggestion: 'Limiter la gestion des membres aux rôles élevés',
        reason: 'Dans un grand groupe, trop de gestionnaires peut créer de la confusion',
        priority: 'medium',
      });
    }
    
    // Suggestions sur les limites de dépense
    if (currentPermissions.spendingLimit === null && role === 'MEMBER') {
      suggestions.push({
        suggestion: 'Définir une limite de dépense',
        reason: 'Une limite de dépense aide à contrôler le budget du groupe',
        priority: 'low',
      });
    }
    
    if (currentPermissions.spendingLimit && currentPermissions.spendingLimit > 5000 && role === 'MEMBER') {
      suggestions.push({
        suggestion: 'Revoir la limite de dépense élevée',
        reason: 'Une limite de 5000+ TND est très élevée pour un membre simple',
        priority: 'medium',
      });
    }
    
    return suggestions;
  }
}