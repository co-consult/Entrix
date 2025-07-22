// src/modules/users/exceptions/insufficient-permissions.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { GroupRole } from '../types/group.types';

export class InsufficientPermissionsException extends HttpException {
  constructor(
    action: string,
    resource: string,
    currentRole?: GroupRole,
    requiredRole?: GroupRole,
    requiredPermission?: string,
    context?: string
  ) {
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
    } else if (requiredPermission) {
      detailMessage = ` (permission "${requiredPermission}" requise)`;
    }

    const suggestions = [
      'Contactez un administrateur du groupe pour obtenir les permissions nécessaires',
      'Demandez une promotion de votre rôle',
      'Vérifiez que vous êtes membre du bon groupe',
    ];

    // Suggestions spécifiques selon l'action
    if (action.includes('invite')) {
      suggestions.push('Seuls les membres avec permission d\'invitation peuvent inviter');
    } else if (action.includes('manage') || action.includes('edit')) {
      suggestions.push('Seuls les administrateurs peuvent modifier les paramètres');
    } else if (action.includes('delete') || action.includes('remove')) {
      suggestions.push('Seuls les propriétaires peuvent supprimer');
    }

    const errorResponse = {
      statusCode: HttpStatus.FORBIDDEN,
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

    super(errorResponse, HttpStatus.FORBIDDEN);
  }

  static forGroupAction(
    action: string,
    groupId: string,
    currentRole?: GroupRole,
    requiredRole?: GroupRole
  ): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      action,
      'groupe',
      currentRole,
      requiredRole,
      undefined,
      `groupe ${groupId}`
    );
  }

  static forGroupPermission(
    action: string,
    groupId: string,
    requiredPermission: string,
    currentRole?: GroupRole
  ): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      action,
      'groupe',
      currentRole,
      undefined,
      requiredPermission,
      `groupe ${groupId}`
    );
  }

  static forUserAction(action: string, userId?: string): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      action,
      'utilisateur',
      undefined,
      undefined,
      undefined,
      userId ? `utilisateur ${userId}` : undefined
    );
  }

  static forInvitation(
    action: string,
    currentRole?: GroupRole
  ): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      action,
      'invitations',
      currentRole,
      undefined,
      'canInvite',
      'groupe'
    );
  }

  static forPurchase(
    groupId: string,
    currentRole?: GroupRole
  ): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      'effectuer des achats',
      'groupe',
      currentRole,
      undefined,
      'canPurchase',
      `groupe ${groupId}`
    );
  }

  static forViewOrders(
    groupId: string,
    currentRole?: GroupRole
  ): InsufficientPermissionsException {
    return new InsufficientPermissionsException(
      'voir les commandes',
      'groupe',
      currentRole,
      undefined,
      'canViewOrders',
      `groupe ${groupId}`
    );
  }
}