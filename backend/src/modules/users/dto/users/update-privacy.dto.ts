// src/modules/users/dto/users/update-privacy.dto.ts

import {
    IsBoolean,
    IsOptional,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  
  class NotificationPreferencesDto {
    @ApiPropertyOptional({
      description: 'Notifications par email',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'email doit être un booléen' })
    email?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notifications par SMS',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'sms doit être un booléen' })
    sms?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notifications push',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'push doit être un booléen' })
    push?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notifications marketing',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'marketing doit être un booléen' })
    marketing?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notifications de mise à jour d\'événements',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'eventUpdates doit être un booléen' })
    eventUpdates?: boolean;
  
    @ApiPropertyOptional({
      description: 'Notifications d\'invitations de groupe',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'groupInvitations doit être un booléen' })
    groupInvitations?: boolean;
  }
  
  class PrivacySettingsDto {
    @ApiPropertyOptional({
      description: 'Profil visible publiquement',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'profileVisible doit être un booléen' })
    profileVisible?: boolean;
  
    @ApiPropertyOptional({
      description: 'Afficher l\'activité',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'showActivity doit être un booléen' })
    showActivity?: boolean;
  
    @ApiPropertyOptional({
      description: 'Autoriser les demandes d\'amitié',
      example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'allowFriendRequests doit être un booléen' })
    allowFriendRequests?: boolean;
  
    @ApiPropertyOptional({
      description: 'Afficher l\'historique d\'achats',
      example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'showPurchaseHistory doit être un booléen' })
    showPurchaseHistory?: boolean;
  }
  
  export class UpdatePrivacyDto {
    @ApiPropertyOptional({
      description: 'Préférences de notifications',
      type: NotificationPreferencesDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationPreferencesDto)
    notifications?: NotificationPreferencesDto;
  
    @ApiPropertyOptional({
      description: 'Paramètres de confidentialité',
      type: PrivacySettingsDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => PrivacySettingsDto)
    privacy?: PrivacySettingsDto;
  }