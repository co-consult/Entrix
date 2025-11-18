// src/modules/users/dto/invitations/bulk-invitation.dto.ts

import {
    IsString,
    IsArray,
    IsOptional,
    IsIn,
    IsInt,
    IsBoolean,
    IsEmail,
    MaxLength,
    MinLength,
    Min,
    Max,
    ValidateNested,
    ArrayMaxSize,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { GROUP_CONSTANTS, INVITATION_CONSTANTS } from '../../constants';
  
  class BulkInviteeDto {
    @ApiPropertyOptional({
      description: 'Email de la personne à inviter',
      example: 'ami1@example.com',
    })
    @IsOptional()
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    email?: string;
  
    @ApiPropertyOptional({
      description: 'ID de l\'utilisateur existant à inviter',
      example: 'user-123-456',
    })
    @IsOptional()
    @IsString({ message: 'L\'ID utilisateur doit être une chaîne de caractères' })
    @Transform(({ value }) => value?.trim())
    userId?: string;
  
    @ApiPropertyOptional({
      description: 'Nom de la personne (si invitation par email)',
      example: 'Ahmed Ben Ali',
    })
    @IsOptional()
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MaxLength(200, { message: 'Le nom ne peut pas dépasser 200 caractères' })
    @Transform(({ value }) => value?.trim())
    name?: string;
  
    @ApiPropertyOptional({
      description: 'Rôle proposé pour cette personne',
      example: 'MEMBER',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsOptional()
    @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    role?: string;
  
    @ApiPropertyOptional({
      description: 'Message personnalisé pour cette personne',
      example: 'Salut Ahmed ! Viens rejoindre notre groupe',
      maxLength: INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    })
    @IsOptional()
    @IsString({ message: 'Le message doit être une chaîne de caractères' })
    @MaxLength(INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH, {
      message: `Le message ne peut pas dépasser ${INVITATION_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.trim())
    personalMessage?: string;
  }
  
  export class BulkInvitationDto {
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
  
    @ApiProperty({
      description: 'Liste des personnes à inviter',
      type: [BulkInviteeDto],
    })
    @IsArray({ message: 'Les invitations doivent être un tableau' })
    @ValidateNested({ each: true })
    @Type(() => BulkInviteeDto)
    @ArrayMaxSize(INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES, {
      message: `Vous ne pouvez pas inviter plus de ${INVITATION_CONSTANTS.LIMITS.MAX_BULK_INVITES} personnes à la fois`,
    })
    invitations: BulkInviteeDto[];
  
    @ApiPropertyOptional({
      description: 'Rôle par défaut pour toutes les invitations',
      example: 'MEMBER',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsOptional()
    @IsString({ message: 'Le rôle par défaut doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    defaultRole?: string = 'MEMBER';
  
    @ApiPropertyOptional({
      description: 'Message commun pour toutes les invitations',
      example: 'Vous êtes invités à rejoindre notre groupe !',
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
    expiresInHours?: number = INVITATION_CONSTANTS.EXPIRATION.GROUP;
  
    @ApiPropertyOptional({
      description: 'Envoyer les invitations par email',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendEmail doit être un booléen' })
    sendEmail?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Envoyer les invitations par SMS (si numéros disponibles)',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendSms doit être un booléen' })
    sendSms?: boolean = false;
  
    @ApiPropertyOptional({
      description: 'Continuer même si certaines invitations échouent',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'continueOnError doit être un booléen' })
    continueOnError?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Grouper les envois par lots (éviter le spam)',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'batchSend doit être un booléen' })
    batchSend?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Délai entre les envois en secondes',
      example: 2,
      minimum: 1,
      maximum: 60,
    })
    @IsOptional()
    @IsInt({ message: 'Le délai doit être un nombre entier' })
    @Min(1, { message: 'Le délai doit être d\'au moins 1 seconde' })
    @Max(60, { message: 'Le délai ne peut pas dépasser 60 secondes' })
    sendDelay?: number = 2;
  }
  
  // DTO de réponse pour les invitations en masse
  export class BulkInvitationResponseDto {
    @ApiProperty({
      description: 'Nombre total d\'invitations tentées',
      example: 5,
    })
    total: number;
  
    @ApiProperty({
      description: 'Nombre d\'invitations envoyées avec succès',
      example: 4,
    })
    successful: number;
  
    @ApiProperty({
      description: 'Nombre d\'invitations échouées',
      example: 1,
    })
    failed: number;
  
    @ApiProperty({
      description: 'Liste des invitations réussies',
      example: [
        {
          id: 'inv-123-456',
          email: 'ami1@example.com',
          status: 'PENDING',
          emailSent: true
        }
      ],
    })
    successfulInvitations: Array<{
      id: string;
      email?: string;
      userId?: string;
      name?: string;
      status: string;
      emailSent: boolean;
      smsSent: boolean;
      invitationUrl: string;
    }>;
  
    @ApiProperty({
      description: 'Liste des invitations échouées avec raisons',
      example: [
        {
          email: 'invalid@email',
          error: 'Format d\'email invalide',
          code: 'INVALID_EMAIL'
        }
      ],
    })
    failedInvitations: Array<{
      email?: string;
      userId?: string;
      name?: string;
      error: string;
      code: string;
    }>;
  
    @ApiPropertyOptional({
      description: 'Invitations en double détectées',
      example: [
        {
          email: 'duplicate@example.com',
          reason: 'Déjà invité récemment'
        }
      ],
    })
    duplicates?: Array<{
      email?: string;
      userId?: string;
      reason: string;
    }>;
  
    @ApiProperty({
      description: 'Temps total de traitement en millisecondes',
      example: 2500,
    })
    processingTime: number;
  
    @ApiPropertyOptional({
      description: 'Avertissements généraux',
      example: ['Limite quotidienne d\'invitations bientôt atteinte'],
    })
    warnings?: string[];
  
    @ApiPropertyOptional({
      description: 'Statistiques d\'envoi',
      example: {
        emailsSent: 4,
        smsSent: 0,
        batchesSent: 2,
        averageDelayMs: 2000
      },
    })
    sendingStats?: {
      emailsSent: number;
      smsSent: number;
      batchesSent: number;
      averageDelayMs: number;
    };
  }