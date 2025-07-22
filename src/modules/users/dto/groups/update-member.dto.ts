// src/modules/users/dto/groups/update-member.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsIn,
    IsInt,
    Min,
    Max,
    ValidateNested,
    MaxLength,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { GROUP_CONSTANTS } from '../../constants/group.constants';
  
  class UpdatePermissionsDto {
    @ApiPropertyOptional({
      description: 'Peut inviter de nouveaux membres',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'canInvite doit être un booléen' })
    canInvite?: boolean;
  
    @ApiPropertyOptional({
      description: 'Peut effectuer des achats',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'canPurchase doit être un booléen' })
    canPurchase?: boolean;
  
    @ApiPropertyOptional({
      description: 'Peut voir les commandes du groupe',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canViewOrders doit être un booléen' })
    canViewOrders?: boolean;
  
    @ApiPropertyOptional({
      description: 'Peut gérer les autres membres',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canManageMembers doit être un booléen' })
    canManageMembers?: boolean;
  
    @ApiPropertyOptional({
      description: 'Peut modifier les paramètres du groupe',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canEditGroup doit être un booléen' })
    canEditGroup?: boolean;
  
    @ApiPropertyOptional({
      description: 'Peut supprimer le groupe',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canDeleteGroup doit être un booléen' })
    canDeleteGroup?: boolean;
  
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
  
  export class UpdateMemberDto {
    @ApiProperty({
      description: 'Action à effectuer sur le membre',
      example: 'UPDATE_ROLE',
      enum: ['UPDATE_ROLE', 'UPDATE_PERMISSIONS', 'SET_SPENDING_LIMIT', 'SUSPEND', 'REACTIVATE', 'REMOVE'],
    })
    @IsString({ message: 'L\'action doit être une chaîne de caractères' })
    @IsIn(['UPDATE_ROLE', 'UPDATE_PERMISSIONS', 'SET_SPENDING_LIMIT', 'SUSPEND', 'REACTIVATE', 'REMOVE'], {
      message: 'Action invalide',
    })
    action: string;
  
    @ApiPropertyOptional({
      description: 'Nouveau rôle (pour UPDATE_ROLE)',
      example: 'ADMIN',
      enum: Object.values(GROUP_CONSTANTS.ROLES),
    })
    @IsOptional()
    @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
    @IsIn(Object.values(GROUP_CONSTANTS.ROLES), {
      message: `Le rôle doit être l'un de: ${Object.values(GROUP_CONSTANTS.ROLES).join(', ')}`,
    })
    newRole?: string;
  
    @ApiPropertyOptional({
      description: 'Nouvelles permissions (pour UPDATE_PERMISSIONS)',
      type: UpdatePermissionsDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdatePermissionsDto)
    permissions?: UpdatePermissionsDto;
  
    @ApiPropertyOptional({
      description: 'Nouvelle limite de dépense (pour SET_SPENDING_LIMIT)',
      example: 1000,
    })
    @IsOptional()
    @IsInt({ message: 'La limite de dépense doit être un nombre entier' })
    @Min(0, { message: 'La limite de dépense doit être positive' })
    @Max(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' })
    spendingLimit?: number | null;
  
    @ApiPropertyOptional({
      description: 'Raison de l\'action (pour les logs)',
      example: 'Promotion pour bonne gestion du groupe',
      maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'La raison doit être une chaîne de caractères' })
    @MaxLength(500, {
      message: 'La raison ne peut pas dépasser 500 caractères',
    })
    @Transform(({ value }) => value?.trim())
    reason?: string;
  
    @ApiPropertyOptional({
      description: 'Envoyer une notification au membre',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sendNotification doit être un booléen' })
    sendNotification?: boolean = true;
  }