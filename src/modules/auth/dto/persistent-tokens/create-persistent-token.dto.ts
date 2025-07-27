// src/modules/auth/dto/persistent-tokens/create-persistent-token.dto.ts

import { IsEnum, IsOptional, IsString, IsArray, IsDate, ValidateNested, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { persistent_token_type } from '@prisma/client';

/**
 * DTOs pour Persistent Tokens Entrix V3.0
 */

// ============================================================================
// DTO CRÉATION PERSISTENT TOKEN
// ============================================================================

export class CreatePersistentTokenDto {
  @ApiProperty({ 
    enum: persistent_token_type,
    description: 'Type de token persistant' 
  })
  @IsEnum(persistent_token_type)
  token_type: persistent_token_type;

  @ApiPropertyOptional({ description: 'Nom du token (affiché à l\'utilisateur)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description du token' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Portées/permissions du token',
    example: ['read:events', 'write:bookings']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ 
    type: String,
    description: 'Date d\'expiration (ISO 8601), null = pas d\'expiration' 
  })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  expires_at?: Date | null;

  @ApiPropertyOptional({ 
    description: 'Informations sur le device (pour tokens mobiles)',
    example: {
      deviceFingerprint: 'abc123',
      userAgent: 'Mozilla/5.0...',
      platform: 'ios',
      appVersion: '1.2.3'
    }
  })
  @IsOptional()
  @IsObject()
  device_info?: {
    deviceFingerprint?: string;
    userAgent?: string;
    platform?: string;
    appVersion?: string;
  };

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ============================================================================
// DTO MISE À JOUR PERSISTENT TOKEN
// ============================================================================

export class UpdatePersistentTokenDto {
  @ApiPropertyOptional({ description: 'Nouveau nom du token' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nouvelle description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Nouvelles portées/permissions' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ 
    type: String,
    description: 'Nouvelle date d\'expiration' 
  })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  expires_at?: Date | null;

  @ApiPropertyOptional({ description: 'Activer/désactiver le token' })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Nouvelles métadonnées' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ============================================================================
// DTO GÉNÉRATION API KEY
// ============================================================================

export class GenerateApiKeyDto {
  @ApiPropertyOptional({ description: 'Nom de la clé API' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Portées de la clé API',
    example: ['read:profile', 'read:events', 'write:bookings']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Description de l\'usage' })
  @IsOptional()
  @IsString()
  description?: string;
}

// ============================================================================
// DTO RÉVOCATION TOKEN
// ============================================================================

export class RevokePersistentTokenDto {
  @ApiPropertyOptional({ description: 'Raison de la révocation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================================================
// DTO FILTRES RECHERCHE
// ============================================================================

export class PersistentTokenFiltersDto {
  @ApiPropertyOptional({ 
    enum: persistent_token_type,
    description: 'Filtrer par type de token' 
  })
  @IsOptional()
  @IsEnum(persistent_token_type)
  token_type?: persistent_token_type;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Filtrer par statut révoqué' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_revoked?: boolean;

  @ApiPropertyOptional({ description: 'Tokens expirant avant cette date' })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  expires_before?: Date;

  @ApiPropertyOptional({ description: 'Tokens expirant après cette date' })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  expires_after?: Date;

  @ApiPropertyOptional({ description: 'Recherche dans nom/description' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ============================================================================
// DTO RESPONSE PERSISTENT TOKEN
// ============================================================================

export class PersistentTokenResponseDto {
  @ApiProperty({ description: 'ID du token' })
  id: string;

  @ApiProperty({ description: 'Type de token' })
  token_type: persistent_token_type;

  @ApiProperty({ description: 'Préfixe visible du token' })
  token_prefix: string;

  @ApiPropertyOptional({ description: 'Nom du token' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description du token' })
  description?: string;

  @ApiProperty({ description: 'Portées du token' })
  scopes: string[];

  @ApiPropertyOptional({ description: 'Date d\'expiration (ISO 8601)' })
  expires_at?: string;

  @ApiPropertyOptional({ description: 'Dernière utilisation (ISO 8601)' })
  last_used_at?: string;

  @ApiProperty({ description: 'Nombre d\'utilisations' })
  usage_count: number;

  @ApiProperty({ description: 'Token actif' })
  is_active: boolean;

  @ApiProperty({ description: 'Date de création (ISO 8601)' })
  created_at: string;
}

// ============================================================================
// DTO RESPONSE TOKEN GÉNÉRÉ
// ============================================================================

export class GeneratedPersistentTokenResponseDto {
  @ApiProperty({ description: 'ID du token généré' })
  id: string;

  @ApiProperty({ 
    description: 'Token complet (ATTENTION : ne sera affiché qu\'une seule fois)',
    example: 'ent_api_abcd1234...'
  })
  token: string;

  @ApiProperty({ description: 'Préfixe du token' })
  token_prefix: string;

  @ApiProperty({ description: 'Type de token' })
  token_type: persistent_token_type;

  @ApiProperty({ description: 'Portées du token' })
  scopes: string[];

  @ApiPropertyOptional({ description: 'Date d\'expiration (ISO 8601)' })
  expires_at?: string;

  @ApiProperty({ description: 'Date de création (ISO 8601)' })
  created_at: string;

  @ApiProperty({ 
    description: 'Message d\'avertissement sécurité',
    example: 'Sauvegardez ce token immédiatement. Il ne sera plus affiché.'
  })
  security_warning: string;
}

// ============================================================================
// DTO STATISTIQUES
// ============================================================================

export class PersistentTokenStatsResponseDto {
  @ApiProperty({ description: 'Nombre total de tokens' })
  total: number;

  @ApiProperty({ description: 'Tokens actifs' })
  active: number;

  @ApiProperty({ description: 'Tokens expirés' })
  expired: number;

  @ApiProperty({ description: 'Tokens révoqués' })
  revoked: number;

  @ApiProperty({ 
    description: 'Répartition par type',
    example: {
      'API_KEY': 5,
      'REFRESH_LONG': 2,
      'ACCESS_LONG': 1
    }
  })
  by_type: Record<string, number>;

  @ApiProperty({ 
    description: 'Utilisation récente',
    example: {
      last_24h: 3,
      last_7d: 15,
      last_30d: 42
    }
  })
  recent_usage: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
}

// ============================================================================
// DTO VALIDATION TOKEN API
// ============================================================================

export class ValidatePersistentTokenDto {
  @ApiProperty({ description: 'Token à valider' })
  @IsString()
  token: string;
}

export class ValidatePersistentTokenResponseDto {
  @ApiProperty({ description: 'Token valide' })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'ID utilisateur si valide' })
  userId?: string;

  @ApiPropertyOptional({ description: 'Portées du token si valide' })
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Erreurs de validation' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Dernière utilisation' })
  lastUsed?: string;

  @ApiPropertyOptional({ description: 'Nombre d\'utilisations' })
  usageCount?: number;

  @ApiPropertyOptional({ description: 'Informations utilisateur' })
  user?: {
    id: string;
    email: string;
    is_active: boolean;
  };
}