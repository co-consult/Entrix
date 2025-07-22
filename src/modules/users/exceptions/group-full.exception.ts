// src/modules/users/exceptions/group-full.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

export class GroupFullException extends HttpException {
  constructor(
    groupId: string, 
    groupName?: string, 
    currentMembers?: number, 
    maxMembers?: number,
    action: 'join' | 'invite' = 'join'
  ) {
    const actionMessages = {
      join: 'Impossible de rejoindre le groupe : groupe complet',
      invite: 'Impossible d\'inviter : groupe complet',
    };

    const actionSuggestions = {
      join: [
        'Essayez de rejoindre un autre groupe similaire',
        'Contactez le propriétaire du groupe pour demander une augmentation de la limite',
        'Attendez qu\'une place se libère',
      ],
      invite: [
        'Augmentez la limite de membres du groupe dans les paramètres',
        'Retirez des membres inactifs pour faire de la place',
        'Créez un nouveau groupe pour les nouveaux membres',
      ],
    };

    const groupInfo = groupName ? ` "${groupName}"` : '';
    const memberInfo = currentMembers && maxMembers 
      ? ` (${currentMembers}/${maxMembers} membres)`
      : '';

    const errorResponse = {
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: `${actionMessages[action]}${groupInfo}${memberInfo}`,
      code: 'GROUP_FULL',
      groupId,
      groupName,
      currentMembers,
      maxMembers,
      action,
      timestamp: new Date().toISOString(),
      suggestions: actionSuggestions[action],
    };

    super(errorResponse, HttpStatus.CONFLICT);
  }

  static forJoin(
    groupId: string, 
    groupName?: string, 
    currentMembers?: number, 
    maxMembers?: number
  ): GroupFullException {
    return new GroupFullException(groupId, groupName, currentMembers, maxMembers, 'join');
  }

  static forInvite(
    groupId: string, 
    groupName?: string, 
    currentMembers?: number, 
    maxMembers?: number
  ): GroupFullException {
    return new GroupFullException(groupId, groupName, currentMembers, maxMembers, 'invite');
  }
}