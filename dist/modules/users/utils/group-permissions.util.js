"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupPermissionsUtil = void 0;
const group_constants_1 = require("../constants/group.constants");
class GroupPermissionsUtil {
    static ROLE_HIERARCHY = {
        OWNER: 4,
        ADMIN: 3,
        MANAGER: 2,
        MEMBER: 1,
    };
    static isRoleHigherOrEqual(role, comparedTo) {
        return this.ROLE_HIERARCHY[role] >= this.ROLE_HIERARCHY[comparedTo];
    }
    static isRoleHigher(role, comparedTo) {
        return this.ROLE_HIERARCHY[role] > this.ROLE_HIERARCHY[comparedTo];
    }
    static getHighestRole(roles) {
        if (roles.length === 0)
            return null;
        return roles.reduce((highest, current) => this.isRoleHigher(current, highest) ? current : highest);
    }
    static getDefaultPermissions(role, groupType) {
        const basePermissions = group_constants_1.GROUP_CONSTANTS.DEFAULT_PERMISSIONS[role];
        const groupSettings = group_constants_1.GROUP_CONSTANTS.DEFAULT_SETTINGS[groupType];
        const adjustedPermissions = { ...basePermissions };
        if (groupType === 'CORPORATE') {
            if (role === 'MEMBER') {
                adjustedPermissions.canInvite = false;
                adjustedPermissions.spendingLimit = 200;
            }
        }
        if (groupType === 'FAMILY') {
            if (role === 'MEMBER') {
                adjustedPermissions.canViewOrders = true;
                adjustedPermissions.spendingLimit = 1000;
            }
        }
        if (groupType === 'TEMPORARY') {
            adjustedPermissions.canInvite = role !== 'MEMBER';
            adjustedPermissions.spendingLimit = Math.min(adjustedPermissions.spendingLimit || 500, 300);
        }
        return adjustedPermissions;
    }
    static hasPermission(member, permission, groupType) {
        if (member.status !== 'ACTIVE') {
            return false;
        }
        if (member.role === 'OWNER') {
            return true;
        }
        const hasExplicitPermission = member.permissions[permission] === true;
        if (member.permissions[permission] === undefined && groupType) {
            const defaultPermissions = this.getDefaultPermissions(member.role, groupType);
            return defaultPermissions[permission] === true;
        }
        return hasExplicitPermission;
    }
    static canPurchase(member, amount, groupType) {
        if (member.status !== 'ACTIVE') {
            return { allowed: false, reason: 'Membre inactif' };
        }
        if (!this.hasPermission(member, 'canPurchase', groupType)) {
            return { allowed: false, reason: 'Permission d\'achat non accordée' };
        }
        const spendingLimit = member.permissions.spendingLimit;
        if (spendingLimit === null || spendingLimit === undefined) {
            return { allowed: true };
        }
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
    static canManageMember(manager, target, action) {
        if (manager.id === target.id && action !== 'remove') {
            return { allowed: false, reason: 'Impossible de se gérer soi-même' };
        }
        if (!this.isRoleHigherOrEqual(manager.role, 'MANAGER')) {
            return { allowed: false, reason: 'Rôle insuffisant pour gérer les membres' };
        }
        if (!this.isRoleHigher(manager.role, target.role)) {
            return { allowed: false, reason: 'Impossible de gérer un membre de rang égal ou supérieur' };
        }
        if (target.role === 'OWNER') {
            return { allowed: false, reason: 'Le propriétaire ne peut pas être géré' };
        }
        switch (action) {
            case 'update_role':
                if (!this.isRoleHigherOrEqual(manager.role, 'ADMIN')) {
                    return { allowed: false, reason: 'Rôle admin requis pour modifier les rôles' };
                }
                break;
            case 'remove':
                break;
            case 'suspend':
                break;
            case 'update_permissions':
                if (!this.isRoleHigherOrEqual(manager.role, 'ADMIN')) {
                    return { allowed: false, reason: 'Rôle admin requis pour modifier les permissions' };
                }
                break;
        }
        return { allowed: true };
    }
    static canInvite(member, groupType, currentGroupSize, maxGroupSize) {
        if (member.status !== 'ACTIVE') {
            return { allowed: false, reason: 'Membre inactif' };
        }
        if (!this.hasPermission(member, 'canInvite', groupType)) {
            return { allowed: false, reason: 'Permission d\'invitation non accordée' };
        }
        if (maxGroupSize && currentGroupSize >= maxGroupSize) {
            return { allowed: false, reason: 'Groupe complet' };
        }
        return { allowed: true };
    }
    static calculateEffectivePermissions(member, groupType) {
        const defaultPermissions = this.getDefaultPermissions(member.role, groupType);
        const effectivePermissions = {
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
    static validatePermissionUpdate(currentMember, newPermissions, updatedBy, groupType) {
        const errors = [];
        const warnings = [];
        const canManage = this.canManageMember(updatedBy, currentMember, 'update_permissions');
        if (!canManage.allowed) {
            errors.push(canManage.reason || 'Permission refusée');
        }
        if (newPermissions.canDeleteGroup === true && currentMember.role !== 'OWNER') {
            errors.push('Seul le propriétaire peut avoir la permission de suppression');
        }
        if (newPermissions.canEditGroup === true && !this.isRoleHigherOrEqual(currentMember.role, 'ADMIN')) {
            warnings.push('La permission d\'édition est généralement réservée aux administrateurs');
        }
        if (newPermissions.spendingLimit !== undefined) {
            if (newPermissions.spendingLimit !== null && newPermissions.spendingLimit < 0) {
                errors.push('La limite de dépense ne peut pas être négative');
            }
            if (newPermissions.spendingLimit !== null && newPermissions.spendingLimit > 50000) {
                warnings.push('Limite de dépense très élevée (> 50 000 TND)');
            }
        }
        if (groupType === 'CORPORATE' && newPermissions.canInvite === true && currentMember.role === 'MEMBER') {
            warnings.push('Dans un groupe corporate, il est inhabituel que les membres simples puissent inviter');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    static getMaxAssignableRole(assignerRole) {
        switch (assignerRole) {
            case 'OWNER':
                return 'ADMIN';
            case 'ADMIN':
                return 'MANAGER';
            case 'MANAGER':
                return 'MEMBER';
            case 'MEMBER':
                return 'MEMBER';
            default:
                return 'MEMBER';
        }
    }
    static getAvailableActions(member, groupType, groupSize, maxGroupSize) {
        const actions = [];
        if (member.status !== 'ACTIVE') {
            return ['view_group'];
        }
        actions.push('view_group', 'view_members');
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
        if (member.role === 'OWNER') {
            actions.push('transfer_ownership');
        }
        if (member.role !== 'OWNER' || groupSize > 1) {
            actions.push('leave_group');
        }
        return actions;
    }
    static suggestPermissionAdjustments(groupType, memberCount, currentPermissions, role) {
        const suggestions = [];
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
        if (memberCount > 10 && currentPermissions.canManageMembers && role === 'MEMBER') {
            suggestions.push({
                suggestion: 'Limiter la gestion des membres aux rôles élevés',
                reason: 'Dans un grand groupe, trop de gestionnaires peut créer de la confusion',
                priority: 'medium',
            });
        }
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
exports.GroupPermissionsUtil = GroupPermissionsUtil;
//# sourceMappingURL=group-permissions.util.js.map