// src/modules/users/dto/invitations/respond-invitation.dto.ts

import {
    IsString,
    IsIn,
    IsOptional,
    MaxLength,
  } from 'class-validator';
  import { Transform } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { INVITATION_CONSTANTS } from '../../constants/invitation.constants';
  
  export class RespondInvitationDto {
    @ApiProperty({
      description: 'Réponse à l\'invitation',
      example: 'ACCEPTED',
      enum: ['ACCEPTED', 'DECLINED'],
    })
    @IsString({ message: 'La réponse doit être une chaîne de caractères' })
    @IsIn(['ACCEPTED', 'DECLINED'], {
      message: 'La réponse doit être ACCEPTED ou DECLINED',
    })
    response: 'ACCEPTED' | 'DECLINED';
  
    @ApiPropertyOptional({
      description: 'Raison du refus (optionnel si DECLINED)',
      example: 'Déjà membre d\'un autre groupe',
      maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'La raison doit être une chaîne de caractères' })
    @MaxLength(500, { message: 'La raison ne peut pas dépasser 500 caractères' })
    @Transform(({ value }) => value?.trim())
    reason?: string;
  
    @ApiPropertyOptional({
      description: 'Message de remerciement (optionnel si ACCEPTED)',
      example: 'Merci pour l\'invitation ! Hâte de rejoindre le groupe',
      maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Le message doit être une chaîne de caractères' })
    @MaxLength(500, { message: 'Le message ne peut pas dépasser 500 caractères' })
    @Transform(({ value }) => value?.trim())
    message?: string;
  }
  
  // DTO pour validation d'invitation (GET)
  export class ValidateInvitationDto {
    @ApiPropertyOptional({
      description: 'Vérifier si l\'utilisateur peut accepter',
      example: true,
    })
    @IsOptional()
    checkEligibility?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Inclure les détails du contexte',
      example: true,
    })
    @IsOptional()
    includeContext?: boolean = true;
  }
  
  // DTO de réponse pour la validation d'invitation
  export class ValidateInvitationResponseDto {
    @ApiProperty({
      description: 'Invitation valide',
      example: true,
    })
    isValid: boolean;
  
    @ApiProperty({
      description: 'Invitation expirée',
      example: false,
    })
    isExpired: boolean;
  
    @ApiProperty({
      description: 'Utilisateur déjà membre',
      example: false,
    })
    isAlreadyMember: boolean;
  
    @ApiProperty({
      description: 'Peut accepter l\'invitation',
      example: true,
    })
    canAccept: boolean;
  
    @ApiPropertyOptional({
      description: 'Erreurs empêchant l\'acceptation',
      example: [],
    })
    errors?: string[];
  
    @ApiPropertyOptional({
      description: 'Avertissements',
      example: ['Le groupe sera bientôt complet'],
    })
    warnings?: string[];
  
    @ApiPropertyOptional({
      description: 'Détails de l\'invitation',
      example: {
        id: 'inv-123-456',
        type: 'GROUP',
        contextName: 'Groupe CA Supporters',
        inviterName: 'Ahmed Ben Salem',
        proposedRole: 'MEMBER',
        message: 'Rejoins notre groupe !',
        expiresAt: '2025-07-24T10:30:00Z'
      },
    })
    invitation?: {
      id: string;
      type: string;
      contextId: string;
      contextName: string;
      inviterName: string;
      proposedRole?: string;
      message?: string;
      createdAt: string;
      expiresAt: string;
    };
  
    @ApiPropertyOptional({
      description: 'Informations sur le contexte (groupe, événement)',
      example: {
        id: 'group-123-456',
        name: 'Groupe CA Supporters',
        type: 'FRIENDS',
        memberCount: 8,
        maxMembers: 20,
        isPrivate: true
      },
    })
    context?: {
      id: string;
      name: string;
      type?: string;
      description?: string;
      memberCount?: number;
      maxMembers?: number;
      isPrivate?: boolean;
      avatar?: string;
    };
  }
  
  // DTO de réponse pour acceptation/refus d'invitation
  export class RespondInvitationResponseDto {
    @ApiProperty({
      description: 'Succès de la réponse',
      example: true,
    })
    success: boolean;
  
    @ApiProperty({
      description: 'Réponse donnée',
      example: 'ACCEPTED',
    })
    response: 'ACCEPTED' | 'DECLINED';
  
    @ApiProperty({
      description: 'Invitation mise à jour',
      example: {
        id: 'inv-123-456',
        status: 'ACCEPTED',
        respondedAt: '2025-07-17T10:30:00Z'
      },
    })
    invitation: {
      id: string;
      status: string;
      respondedAt: string;
    };
  
    @ApiPropertyOptional({
      description: 'Résultat de l\'acceptation (membre créé, etc.)',
      example: {
        groupMember: {
          id: 'member-789-012',
          role: 'MEMBER',
          joinedAt: '2025-07-17T10:30:00Z'
        }
      },
    })
    result?: {
      groupMember?: {
        id: string;
        role: string;
        joinedAt: string;
        permissions: string[];
      };
      eventParticipant?: any;
      friendship?: any;
    };
  
    @ApiPropertyOptional({
      description: 'Actions supplémentaires effectuées',
      example: ['notification_sent_to_group', 'welcome_email_sent'],
    })
    additionalActions?: string[];
  
    @ApiPropertyOptional({
      description: 'Prochaines étapes suggérées',
      example: [
        'Complétez votre profil de groupe',
        'Découvrez les événements à venir',
        'Invitez d\'autres amis'
      ],
    })
    nextSteps?: string[];
  
    @ApiPropertyOptional({
      description: 'Messages d\'erreur éventuels',
      example: [],
    })
    errors?: string[];
  }