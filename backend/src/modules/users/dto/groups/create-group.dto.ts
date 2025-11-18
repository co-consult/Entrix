// src/modules/users/dto/groups/create-group.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsIn,
    IsObject,
    IsArray,
    MinLength,
    MaxLength,
    Matches,
    Min,
    Max,
    ValidateNested,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { GROUP_CONSTANTS } from '../../constants/group.constants';
  
  class GroupPermissionsDto {
    @ApiProperty({
      description: 'Peut inviter de nouveaux membres',
      example: true,
    })
    @IsBoolean({ message: 'canInvite doit être un booléen' })
    canInvite: boolean;
  
    @ApiProperty({
      description: 'Peut effectuer des achats',
      example: true,
    })
    @IsBoolean({ message: 'canPurchase doit être un booléen' })
    canPurchase: boolean;
  
    @ApiProperty({
      description: 'Peut voir les commandes du groupe',
      example: false,
    })
    @IsBoolean({ message: 'canViewOrders doit être un booléen' })
    canViewOrders: boolean;
  
    @ApiPropertyOptional({
      description: 'Limite de dépense en TND (null = illimitée)',
      example: 500,
    })
    @IsOptional()
    @IsInt({ message: 'La limite de dépense doit être un nombre entier' })
    @Min(0, { message: 'La limite de dépense doit être positive' })
    @Max(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' })
    spendingLimit?: number | null;
  }
  
  class GroupSettingsDto {
    @ApiProperty({
      description: 'Groupe privé (non visible publiquement)',
      example: true,
    })
    @IsBoolean({ message: 'isPrivate doit être un booléen' })
    isPrivate: boolean;
  
    @ApiProperty({
      description: 'Approbation requise pour rejoindre',
      example: false,
    })
    @IsBoolean({ message: 'requireApproval doit être un booléen' })
    requireApproval: boolean;
  
    @ApiPropertyOptional({
      description: 'Nombre maximum de membres',
      example: 50,
    })
    @IsOptional()
    @IsInt({ message: 'Le nombre maximum de membres doit être un entier' })
    @Min(2, { message: 'Un groupe doit avoir au moins 2 membres maximum' })
    @Max(1000, { message: 'Un groupe ne peut pas dépasser 1000 membres' })
    maxMembers?: number;
  
    @ApiProperty({
      description: 'Membres peuvent inviter d\'autres personnes',
      example: true,
    })
    @IsBoolean({ message: 'allowInvites doit être un booléen' })
    allowInvites: boolean;
  
    @ApiProperty({
      description: 'Permissions par défaut pour nouveaux membres',
      type: GroupPermissionsDto,
    })
    @ValidateNested()
    @Type(() => GroupPermissionsDto)
    defaultPermissions: GroupPermissionsDto;
  }
  
  class InitialInviteDto {
    @ApiPropertyOptional({
      description: 'Email de la personne à inviter',
      example: 'ami@example.com',
    })
    @IsOptional()
    @IsString({ message: 'L\'email doit être une chaîne de caractères' })
    email?: string;
  
    @ApiPropertyOptional({
      description: 'ID de l\'utilisateur à inviter',
      example: 'user-123',
    })
    @IsOptional()
    @IsString({ message: 'L\'ID utilisateur doit être une chaîne de caractères' })
    userId?: string;
  
    @ApiPropertyOptional({
      description: 'Nom de la personne (si email)',
      example: 'Ahmed Amari',
    })
    @IsOptional()
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    name?: string;
  
    @ApiPropertyOptional({
      description: 'Rôle proposé',
      example: 'MEMBER',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsOptional()
    @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    role?: string;
  }
  
  export class CreateGroupDto {
    @ApiProperty({
      description: 'Nom du groupe',
      example: 'Groupe CA Supporters',
      minLength: GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH,
      maxLength: GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH,
    })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    @MinLength(GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${GROUP_CONSTANTS.VALIDATION.NAME.MIN_LENGTH} caractères`,
    })
    @MaxLength(GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${GROUP_CONSTANTS.VALIDATION.NAME.MAX_LENGTH} caractères`,
    })
    @Matches(GROUP_CONSTANTS.VALIDATION.NAME.REGEX, {
      message: 'Le nom contient des caractères non autorisés',
    })
    @Transform(({ value }) => value?.trim())
    name: string;
  
    @ApiPropertyOptional({
      description: 'Description du groupe',
      example: 'Groupe de supporters du Club Africain pour acheter nos billets ensemble',
      maxLength: GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH,
    })
    @IsOptional()
    @IsString({ message: 'La description doit être une chaîne de caractères' })
    @MaxLength(GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${GROUP_CONSTANTS.VALIDATION.DESCRIPTION.MAX_LENGTH} caractères`,
    })
    @Transform(({ value }) => value?.trim())
    description?: string;
  
    @ApiProperty({
      description: 'Type de groupe',
      example: 'FRIENDS',
      enum: Object.values(GROUP_CONSTANTS.TYPES),
    })
    @IsString({ message: 'Le type doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.TYPES), {
      message: `Le type doit être l'un de: ${Object.values(GROUP_CONSTANTS.TYPES).join(', ')}`,
    })
    type: string;
  
    @ApiProperty({
      description: 'Configuration du groupe',
      type: GroupSettingsDto,
    })
    @ValidateNested()
    @Type(() => GroupSettingsDto)
    settings: GroupSettingsDto;
  
    @ApiPropertyOptional({
      description: 'Invitations initiales à envoyer',
      type: [InitialInviteDto],
    })
    @IsOptional()
    @IsArray({ message: 'Les invitations initiales doivent être un tableau' })
    @ValidateNested({ each: true })
    @Type(() => InitialInviteDto)
    initialInvites?: InitialInviteDto[];
  
    @ApiPropertyOptional({
      description: 'Métadonnées additionnelles',
      example: { source: 'web', campaign: 'friends' },
    })
    @IsOptional()
    @IsObject({ message: 'Les métadonnées doivent être un objet' })
    metadata?: Record<string, any>;
  }