"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientPermissionsException = void 0;
const common_1 = require("@nestjs/common");
class InsufficientPermissionsException extends common_1.HttpException {
    constructor(action, resource, currentRole, requiredRole, requiredPermission, context) {
        const baseMessage = `Permissions insuffisantes pour ${action}`;
        const resourceInfo = resource ? ` sur ${resource}` : '';
        const contextInfo = context ? ` dans ${context}` : '';
        let detailMessage = '';
        if (requiredRole) {
            detailMessage = ` (rôle "${requiredRole}" requis`;
            if (currentRole) {
                detailMessage += `, vous avez "${currentRole}"`;
            }
            detailMessage += ')';
        }
        else if (requiredPermission) {
            detailMessage = ` (permission "${requiredPermission}" requise)`;
        }
        const suggestions = [
            'Contactez un administrateur du groupe pour obtenir les permissions nécessaires',
            'Demandez une promotion de votre rôle',
            'Vérifiez que vous êtes membre du bon groupe',
        ];
        if (action.includes('invite')) {
            suggestions.push('Seuls les membres avec permission d\'invitation peuvent inviter');
        }
        else if (action.includes('manage') || action.includes('edit')) {
            suggestions.push('Seuls les administrateurs peuvent modifier les paramètres');
        }
        else if (action.includes('delete') || action.includes('remove')) {
            suggestions.push('Seuls les propriétaires peuvent supprimer');
        }
        const errorResponse = {
            statusCode: common_1.HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message: `${baseMessage}${resourceInfo}${contextInfo}${detailMessage}`,
            code: 'INSUFFICIENT_PERMISSIONS',
            action,
            resource,
            currentRole,
            requiredRole,
            requiredPermission,
            context,
            timestamp: new Date().toISOString(),
            suggestions,
        };
        super(errorResponse, common_1.HttpStatus.FORBIDDEN);
    }
    static forGroupAction(action, groupId, currentRole, requiredRole) {
        return new InsufficientPermissionsException(action, 'groupe', currentRole, requiredRole, undefined, `groupe ${groupId}`);
    }
    static forGroupPermission(action, groupId, requiredPermission, currentRole) {
        return new InsufficientPermissionsException(action, 'groupe', currentRole, undefined, requiredPermission, `groupe ${groupId}`);
    }
    static forUserAction(action, userId) {
        return new InsufficientPermissionsException(action, 'utilisateur', undefined, undefined, undefined, userId ? `utilisateur ${userId}` : undefined);
    }
    static forInvitation(action, currentRole) {
        return new InsufficientPermissionsException(action, 'invitations', currentRole, undefined, 'canInvite', 'groupe');
    }
    static forPurchase(groupId, currentRole) {
        return new InsufficientPermissionsException('effectuer des achats', 'groupe', currentRole, undefined, 'canPurchase', `groupe ${groupId}`);
    }
    static forViewOrders(groupId, currentRole) {
        return new InsufficientPermissionsException('voir les commandes', 'groupe', currentRole, undefined, 'canViewOrders', `groupe ${groupId}`);
    }
}
exports.InsufficientPermissionsException = InsufficientPermissionsException;
//# sourceMappingURL=insufficient-permissions.exception.js.map