// src/modules/users/dto/invitations/send-invitation.dto.ts

import {
    IsString,
    IsEmail,
    IsOptional,
    IsIn,
    IsInt,
    IsBoolean,
    MaxLength,
    MinLength,
    Min,
    Max,
  } from 'class-validator';
  import { Transform } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { GROUP_CONSTANTS, INVITATION_CONSTANTS } from '../../constants';
  
  export class SendInvitationDto {
    @ApiProperty({
      description: 'Type d\'invitation',
      example: 'GROUP',
      enum: Object.values(INVITATION_CONSTANTS.TYPES),
    })
    @IsString({ message: 'Le type doit être une chaîne de caractères' })
    @IsIn(Object.values(INVITATION_CONSTANTS.TYPES), {
      message: `Le type doit être l'un de: ${Object.values(INVITATION_CONSTANTS.TYPES).join(', ')}`,
    })
    type: string;
  
    @ApiProperty({
      description: 'ID du contexte (groupe, événement, etc.)',
      example: 'group-123-456',
    })
    @IsString({ message: 'L\'ID du contexte doit être une chaîne de caractères' })
    @MinLength(1, { message: 'L\'ID du contexte ne peut pas être vide' })
    contextId: string;
  
    @ApiPropertyOptional({
      description: 'Email de la personne à inviter',
      example: 'ami@example.com',
    })
    @IsOptional()
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    invitedEmail?: string;
  
    @ApiPropertyOptional({
      description: 'ID de l\'utilisateur existant à inviter',
      example: 'user-789-012',
    })
    @IsOptional()
    @IsString({ message: 'L\'ID utilisateur doit être une chaîne de caractères' })
    @Transform(({ value }) => value?.trim())
    invitedUserId?: string;
  
    @ApiPropertyOptional({
      description: 'Nom de la personne (si invitation par email)',
      example: 'Sarah Ben Ali',
    })
    @IsOptional()
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MaxLength(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
    @Transform(({ value }) => value?.trim())
    invitedName?: string;
  
    @ApiPropertyOptional({
      description: 'Rôle proposé (pour invitations de groupe)',
      example: 'MEMBER',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsOptional()
    @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    proposedRole?: string;
  
    @ApiPropertyOptional({
      description: 'Message personnalisé d\'invitation',
      example: 'Salut ! Tu veux rejoindre notre groupe pour les matchs du CA ?',
      maxLength: INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    })
    @IsOptional()
    @IsString({ message: 'Le message doit être une chaîne de caractères' })
    @MaxLength(INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
      message: `Le message ne peut pas dépasser ${INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.trim())
    message?: string;
  
    @ApiPropertyOptional({
      description: 'Durée de validité en heures',
      example: 168,
      minimum: 1,
      maximum: 720,
    })
    @IsOptional()
    @IsInt({ message: 'La durée doit être un nombre entier' })
    @Min(1, { message: 'L\'invitation doit être valide au moins 1 heure' })
    @Max(720, { message: 'L\'invitation ne peut pas être valide plus de 30 jours' })
    expiresInHours?: number;
  
    @ApiPropertyOptional({
      description: 'Envoyer l\'invitation par email',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendEmail doit être un booléen' })
    sendEmail?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Envoyer l\'invitation par SMS',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendSms doit être un booléen' })
    sendSms?: boolean = false;
  
    @ApiPropertyOptional({
      description: 'Envoyer des rappels automatiques',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendReminders doit être un booléen' })
    sendReminders?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Priorité de l\'invitation',
      example: 'NORMAL',
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    })
    @IsOptional()
    @IsString({ message: 'La priorité doit être une chaîne de caractères' })
    @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
      message: 'La priorité doit être LOW, NORMAL, HIGH ou URGENT',
    })
    priority?: string = 'NORMAL';
  }
  
  // DTO de réponse pour l'envoi d'invitation
  export class SendInvitationResponseDto {
    @ApiProperty({
      description: 'Succès de l\'envoi',
      example: true,
    })
    success: boolean;
  
    @ApiProperty({
      description: 'Invitation créée',
      example: {
        id: 'inv-123-456',
        token: 'inv_token_abc123',
        type: 'GROUP',
        status: 'PENDING',
        expiresAt: '2025-07-24T10:30:00Z'
      },
    })
    invitation: {
      id: string;
      token: string;
      type: string;
      status: string;
      contextId: string;
      contextName: string;
      invitedEmail?: string;
      invitedUserId?: string;
      proposedRole?: string;
      message?: string;
      expiresAt: string;
      createdAt: string;
    };
  
    @ApiProperty({
      description: 'Email envoyé avec succès',
      example: true,
    })
    emailSent: boolean;
  
    @ApiProperty({
      description: 'SMS envoyé avec succès',
      example: false,
    })
    smsSent: boolean;
  
    @ApiPropertyOptional({
      description: 'Lien public de l\'invitation',
      example: 'https://entrix.tn/invitations/inv_token_abc123',
    })
    invitationUrl?: string;
  
    @ApiPropertyOptional({
      description: 'Messages d\'erreur éventuels',
      example: [],
    })
    errors?: string[];
  
    @ApiPropertyOptional({
      description: 'Avertissements',
      example: ['L\'utilisateur est déjà membre d\'un autre groupe similaire'],
    })
    warnings?: string[];
  }