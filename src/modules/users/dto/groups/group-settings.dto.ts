// src/modules/users/dto/groups/group-settings.dto.ts

import {
    IsBoolean,
    IsOptional,
    IsInt,
    Min,
    Max,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  
  class DefaultPermissionsDto {
    @ApiPropertyOptional({
      description: 'Nouveaux membres peuvent inviter par défaut',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canInvite doit être un booléen' })
    canInvite?: boolean;
  
    @ApiPropertyOptional({
      description: 'Nouveaux membres peuvent acheter par défaut',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'canPurchase doit être un booléen' })
    canPurchase?: boolean;
  
    @ApiPropertyOptional({
      description: 'Nouveaux membres peuvent voir les commandes par défaut',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'canViewOrders doit être un booléen' })
    canViewOrders?: boolean;
  
    @ApiPropertyOptional({
      description: 'Limite de dépense par défaut pour nouveaux membres (TND)',
      example: 500,
    })
    @IsOptional()
    @IsInt({ message: 'La limite de dépense doit être un nombre entier' })
    @Min(0, { message: 'La limite de dépense doit être positive' })
    @Max(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' })
    spendingLimit?: number | null;
  }
  
  export class GroupSettingsDto {
    @ApiPropertyOptional({
      description: 'Groupe privé (non visible dans les recherches publiques)',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'isPrivate doit être un booléen' })
    isPrivate?: boolean;
  
    @ApiPropertyOptional({
      description: 'Approbation du propriétaire requise pour rejoindre',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'requireApproval doit être un booléen' })
    requireApproval?: boolean;
  
    @ApiPropertyOptional({
      description: 'Nombre maximum de membres autorisé',
      example: 50,
      minimum: 2,
      maximum: 1000,
    })
    @IsOptional()
    @IsInt({ message: 'Le nombre maximum de membres doit être un entier' })
    @Min(2, { message: 'Un groupe doit pouvoir avoir au moins 2 membres' })
    @Max(1000, { message: 'Un groupe ne peut pas dépasser 1000 membres' })
    maxMembers?: number;
  
    @ApiPropertyOptional({
      description: 'Membres peuvent inviter d\'autres personnes',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'allowInvites doit être un booléen' })
    allowInvites?: boolean;
  
    @ApiPropertyOptional({
      description: 'Accepter automatiquement les demandes d\'adhésion',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'autoAcceptRequests doit être un booléen' })
    autoAcceptRequests?: boolean;
  
    @ApiPropertyOptional({
      description: 'Permettre aux membres de quitter le groupe librement',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'allowLeaving doit être un booléen' })
    allowLeaving?: boolean;
  
    @ApiPropertyOptional({
      description: 'Afficher les statistiques du groupe aux membres',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'showStats doit être un booléen' })
    showStats?: boolean;
  
    @ApiPropertyOptional({
      description: 'Afficher l\'historique des achats aux membres',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'showPurchaseHistory doit être un booléen' })
    showPurchaseHistory?: boolean;
  
    @ApiPropertyOptional({
      description: 'Permissions par défaut pour les nouveaux membres',
      type: DefaultPermissionsDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => DefaultPermissionsDto)
    defaultPermissions?: DefaultPermissionsDto;
  
    @ApiPropertyOptional({
      description: 'Notification automatique pour nouveaux événements',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'notifyNewEvents doit être un booléen' })
    notifyNewEvents?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notification automatique pour nouveaux achats',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'notifyPurchases doit être un booléen' })
    notifyPurchases?: boolean;
  
    @ApiPropertyOptional({
      description: 'Permettre le partage du lien d\'invitation',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'allowInviteLink doit être un booléen' })
    allowInviteLink?: boolean;
  }