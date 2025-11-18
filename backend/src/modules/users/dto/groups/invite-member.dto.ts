// src/modules/users/dto/groups/invite-member.dto.ts

import {
    IsString,
    IsOptional,
    IsEmail,
    IsIn,
    IsArray,
    ValidateNested,
    MaxLength,
    IsInt,
    Min,
    Max,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { GROUP_CONSTANTS, INVITATION_CONSTANTS } from '../../constants';
  
  class SingleInviteDto {
    @ApiPropertyOptional({
      description: 'Email de la personne à inviter',
      example: 'nouvel.ami@gmail.com',
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
    @Transform(({ value }) => value?.trim())
    name?: string;
  
    @ApiProperty({
      description: 'Rôle proposé dans le groupe',
      example: 'MEMBER',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    role: string;
  }
  
  export class InviteMemberDto {
    @ApiPropertyOptional({
      description: 'Email de la personne à inviter (invitation unique)',
      example: 'ami@example.com',
    })
    @IsOptional()
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @Transform(({ value }) => value?.toLowerCase()?.trim())
    email?: string;
  
    @ApiPropertyOptional({
      description: 'ID de l\'utilisateur existant à inviter (invitation unique)',
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
    @Transform(({ value }) => value?.trim())
    name?: string;
  
    @ApiPropertyOptional({
      description: 'Rôle proposé dans le groupe (pour invitation unique)',
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
      description: 'Liste d\'invitations multiples',
      type: [SingleInviteDto],
    })
    @IsOptional()
    @IsArray({ message: 'Les invitations doivent être un tableau' })
    @ValidateNested({ each: true })
    @Type(() => SingleInviteDto)
    invitations?: SingleInviteDto[];
  
    @ApiPropertyOptional({
      description: 'Message personnalisé d\'invitation',
      example: 'Rejoins notre groupe pour acheter nos billets ensemble !',
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
      description: 'Durée de validité de l\'invitation en heures',
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
      description: 'Envoyer l\'invitation par email',
      example: true,
    })
    @IsOptional()
    sendEmail?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Envoyer l\'invitation par SMS (si numéro disponible)',
      example: false,
    })
    @IsOptional()
    sendSms?: boolean = false;
  }