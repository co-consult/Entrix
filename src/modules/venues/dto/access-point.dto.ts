// src/modules/venues/dto/access-point.dto.ts
/**
 * DTOs pour les points d'accès
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
  Length,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
  IsObject,
  Matches
} from 'class-validator';

import { access_type, security_level } from '@prisma/client';
import { 
  VENUE_VALIDATION_LIMITS,
  VENUE_DEFAULTS,
  ACCESS_TYPES,
  SECURITY_LEVELS
} from '../constants/venues.constants';

// ================================
// OPERATING HOURS DTO
// ================================

export class DayScheduleDto {
  @ApiProperty({
    description: 'Heure d\'ouverture (format HH:mm)',
    example: '08:00',
  })
  @IsNotEmpty({ message: 'L\'heure d\'ouverture est obligatoire' })
  @IsString({ message: 'L\'heure d\'ouverture doit être une chaîne de caractères' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'L\'heure d\'ouverture doit être au format HH:mm'
  })
  open: string;

  @ApiProperty({
    description: 'Heure de fermeture (format HH:mm)',
    example: '22:00',
  })
  @IsNotEmpty({ message: 'L\'heure de fermeture est obligatoire' })
  @IsString({ message: 'L\'heure de fermeture doit être une chaîne de caractères' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'L\'heure de fermeture doit être au format HH:mm'
  })
  close: string;

  @ApiPropertyOptional({
    description: 'Pauses dans la journée',
    example: [{ start: '12:00', end: '13:00', reason: 'Pause déjeuner' }],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Les pauses doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => BreakPeriodDto)
  breaks?: BreakPeriodDto[];
}

export class BreakPeriodDto {
  @ApiProperty({
    description: 'Début de la pause (format HH:mm)',
    example: '12:00',
  })
  @IsNotEmpty({ message: 'L\'heure de début de pause est obligatoire' })
  @IsString({ message: 'L\'heure de début doit être une chaîne de caractères' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'L\'heure de début doit être au format HH:mm'
  })
  start: string;

  @ApiProperty({
    description: 'Fin de la pause (format HH:mm)',
    example: '13:00',
  })
  @IsNotEmpty({ message: 'L\'heure de fin de pause est obligatoire' })
  @IsString({ message: 'L\'heure de fin doit être une chaîne de caractères' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'L\'heure de fin doit être au format HH:mm'
  })
  end: string;

  @ApiPropertyOptional({
    description: 'Raison de la pause',
    example: 'Pause déjeuner',
  })
  @IsOptional()
  @IsString({ message: 'La raison doit être une chaîne de caractères' })
  @Length(1, 100, { message: 'La raison doit contenir entre 1 et 100 caractères' })
  reason?: string;
}

export class OperatingHoursDto {
  @ApiPropertyOptional({ description: 'Horaires du lundi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du mardi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du mercredi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du jeudi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du vendredi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du samedi', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Horaires du dimanche', type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday?: DayScheduleDto;
}

// ================================
// ACCESS POINT METADATA DTO
// ================================

export class AccessPointMetadataDto {
  @ApiPropertyOptional({
    description: 'Capacité de file d\'attente',
    example: 200,
    minimum: 0,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La capacité de file d\'attente doit être un nombre' })
  @Min(0, { message: 'La capacité de file d\'attente ne peut pas être négative' })
  @Max(10000, { message: 'La capacité de file d\'attente ne peut pas dépasser 10000' })
  queue_capacity?: number;

  @ApiPropertyOptional({
    description: 'Taux de traitement par minute',
    example: 60,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le taux de traitement doit être un nombre' })
  @Min(1, { message: 'Le taux de traitement doit être positif' })
  @Max(1000, { message: 'Le taux de traitement ne peut pas dépasser 1000' })
  processing_rate_per_minute?: number;

  @ApiPropertyOptional({
    description: 'Personnel requis',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le personnel requis doit être un nombre' })
  @Min(0, { message: 'Le personnel requis ne peut pas être négatif' })
  @Max(50, { message: 'Le personnel requis ne peut pas dépasser 50' })
  staffing_requirements?: number;

  @ApiPropertyOptional({
    description: 'Équipement nécessaire',
    example: ['SCANNER_QR', 'DETECTEUR_METAL'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'L\'équipement nécessaire doit être un tableau' })
  @IsString({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 équipements autorisés' })
  equipment_needed?: string[];

  @ApiPropertyOptional({
    description: 'Heures de pointe',
    example: ['18:00-20:00', '12:00-14:00'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les heures de pointe doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque créneau doit être une chaîne de caractères' })
  @ArrayMaxSize(10, { message: 'Maximum 10 créneaux de pointe autorisés' })
  peak_usage_times?: string[];

  @ApiPropertyOptional({
    description: 'Fonctionnalités d\'accessibilité',
    example: ['RAMPE_ACCES', 'ASSISTANCE_VISUELLE'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les fonctionnalités d\'accessibilité doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque fonctionnalité doit être une chaîne de caractères' })
  @ArrayMaxSize(15, { message: 'Maximum 15 fonctionnalités d\'accessibilité autorisées' })
  accessibility_features?: string[];
}

// ================================
// CREATE ACCESS POINT DTO
// ================================

export class CreateAccessPointDto {
  @ApiProperty({
    description: 'ID de la configuration',
    example: 'mapping-123',
  })
  @IsNotEmpty({ message: 'L\'ID de la configuration est obligatoire' })
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  mapping_id: string;

  @ApiProperty({
    description: 'Nom du point d\'accès',
    example: 'Portail A - Entrée Principale',
    minLength: VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH, VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH, {
    message: `Le nom doit contenir entre ${VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.ACCESS_POINT_NAME_MAX_LENGTH} caractères`
  })
  name: string;

  @ApiProperty({
    description: 'Code unique du point d\'accès',
    example: 'PORTAL_A',
    minLength: VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH, VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH, {
    message: `Le code doit contenir entre ${VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.ACCESS_POINT_CODE_MAX_LENGTH} caractères`
  })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
  })
  code: string;

  @ApiProperty({
    description: 'Type de point d\'accès',
    example: access_type.MAIN_ENTRANCE,
    enum: access_type,
  })
  @IsNotEmpty({ message: 'Le type de point d\'accès est obligatoire' })
  @IsEnum(access_type, { message: 'Type de point d\'accès invalide' })
  access_type: access_type;

  @ApiProperty({
    description: 'Zones autorisées',
    example: ['zone-1', 'zone-2'],
    isArray: true,
    type: String,
  })
  @IsNotEmpty({ message: 'Au moins une zone autorisée est obligatoire' })
  @IsArray({ message: 'Les zones autorisées doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque zone doit être une chaîne de caractères' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_ALLOWED_ZONES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_ALLOWED_ZONES} zones autorisées`
  })
  allowed_zones: string[];

  @ApiPropertyOptional({
    description: 'Zones restreintes',
    example: ['zone-vip'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les zones restreintes doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque zone doit être une chaîne de caractères' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_RESTRICTED_ZONES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_RESTRICTED_ZONES} zones restreintes`
  })
  restricted_zones?: string[];

  @ApiPropertyOptional({
    description: 'Niveau de sécurité',
    example: security_level.STANDARD,
    enum: security_level,
    default: VENUE_DEFAULTS.SECURITY_LEVEL,
  })
  @IsOptional()
  @IsEnum(security_level, { message: 'Niveau de sécurité invalide' })
  security_level?: security_level = VENUE_DEFAULTS.SECURITY_LEVEL;

  @ApiPropertyOptional({
    description: 'Latitude GPS',
    example: 36.8065,
    minimum: VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
  })
  @IsOptional()
  @IsLatitude({ message: 'Latitude invalide' })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude GPS',
    example: 10.1815,
    minimum: VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
  })
  @IsOptional()
  @IsLongitude({ message: 'Longitude invalide' })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Nécessite une permission spéciale',
    example: false,
    default: VENUE_DEFAULTS.REQUIRES_SPECIAL_PERMISSION,
  })
  @IsOptional()
  @IsBoolean({ message: 'La permission spéciale doit être un booléen' })
  requires_special_permission?: boolean = VENUE_DEFAULTS.REQUIRES_SPECIAL_PERMISSION;

  @ApiPropertyOptional({
    description: 'Horaires de fonctionnement',
    type: OperatingHoursDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les horaires doivent être un objet' })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operating_hours?: OperatingHoursDto;

  @ApiPropertyOptional({
    description: 'Métadonnées du point d\'accès',
    type: AccessPointMetadataDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  @ValidateNested()
  @Type(() => AccessPointMetadataDto)
  metadata?: AccessPointMetadataDto;
}

// ================================
// UPDATE ACCESS POINT DTO
// ================================

export class UpdateAccessPointDto extends PartialType(CreateAccessPointDto) {
  @ApiPropertyOptional({
    description: 'Statut actif du point d\'accès',
    example: true,
    default: VENUE_DEFAULTS.ACCESS_POINT_IS_ACTIVE,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  is_active?: boolean;

  // Retire mapping_id du update (ne peut pas être modifié)
  mapping_id?: never;
}

// ================================
// ACCESS POINT SEARCH DTO
// ================================

export class AccessPointSearchDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle',
    example: 'portail',
    minLength: VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La requête de recherche doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH, VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH, {
    message: `La recherche doit contenir entre ${VENUE_VALIDATION_LIMITS.SEARCH_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.SEARCH_MAX_LENGTH} caractères`
  })
  query?: string;

  @ApiPropertyOptional({
    description: 'ID de la configuration',
    example: 'mapping-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  mappingId?: string;

  @ApiPropertyOptional({
    description: 'ID du lieu',
    example: 'venue-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID du lieu doit être une chaîne de caractères' })
  venueId?: string;

  @ApiPropertyOptional({
    description: 'Type de point d\'accès',
    example: access_type.MAIN_ENTRANCE,
    enum: access_type,
  })
  @IsOptional()
  @IsEnum(access_type, { message: 'Type de point d\'accès invalide' })
  accessType?: access_type;

  @ApiPropertyOptional({
    description: 'Niveau de sécurité',
    example: security_level.STANDARD,
    enum: security_level,
  })
  @IsOptional()
  @IsEnum(security_level, { message: 'Niveau de sécurité invalide' })
  securityLevel?: security_level;

  @ApiPropertyOptional({
    description: 'Zones autorisées',
    example: ['zone-1', 'zone-2'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les zones autorisées doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque zone doit être une chaîne de caractères' })
  allowedZones?: string[];

  @ApiPropertyOptional({
    description: 'Zones restreintes',
    example: ['zone-vip'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les zones restreintes doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque zone doit être une chaîne de caractères' })
  restrictedZones?: string[];

  @ApiPropertyOptional({
    description: 'Statut actif uniquement',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Nécessite une permission spéciale',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'La permission spéciale doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  requiresSpecialPermission?: boolean;

  // Pagination
  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    minimum: 1,
    default: VENUE_DEFAULTS.PAGE,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le numéro de page doit être un nombre' })
  @Min(1, { message: 'Le numéro de page doit être supérieur à 0' })
  @Transform(({ value }) => parseInt(value) || VENUE_DEFAULTS.PAGE)
  page?: number = VENUE_DEFAULTS.PAGE;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: VENUE_DEFAULTS.LIMIT,
    minimum: VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE,
    maximum: VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE,
    default: VENUE_DEFAULTS.LIMIT,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE)
  @Max(VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE)
  @Transform(({ value }) => parseInt(value) || VENUE_DEFAULTS.LIMIT)
  limit?: number = VENUE_DEFAULTS.LIMIT;

  // Inclusions
  @ApiPropertyOptional({
    description: 'Inclure la configuration',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion de la configuration doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeMapping?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les informations du lieu',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion du lieu doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeVenue?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les détails des zones autorisées',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des zones autorisées doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeAllowedZones?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les détails des zones restreintes',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des zones restreintes doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeRestrictedZones?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les statistiques',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des statistiques doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeStatistics?: boolean = false;
}

// ================================
// ACCESS POINT RESPONSE DTO
// ================================

export class AccessPointResponseDto {
  @ApiProperty({ description: 'ID du point d\'accès' })
  id: string;

  @ApiProperty({ description: 'ID de la configuration' })
  mapping_id: string;

  @ApiProperty({ description: 'Nom du point d\'accès' })
  name: string;

  @ApiProperty({ description: 'Code du point d\'accès' })
  code: string;

  @ApiProperty({ description: 'Type de point d\'accès', enum: access_type })
  access_type: access_type;

  @ApiProperty({ description: 'Zones autorisées', isArray: true, type: String })
  allowed_zones: string[];

  @ApiPropertyOptional({ description: 'Zones restreintes', isArray: true, type: String })
  restricted_zones?: string[];

  @ApiProperty({ description: 'Niveau de sécurité', enum: security_level })
  security_level: security_level;

  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;

  @ApiProperty({ description: 'Statut actif' })
  is_active: boolean;

  @ApiProperty({ description: 'Nécessite une permission spéciale' })
  requires_special_permission: boolean;

  @ApiPropertyOptional({ description: 'Horaires de fonctionnement' })
  operating_hours?: any;

  @ApiPropertyOptional({ description: 'Métadonnées' })
  metadata?: any;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de modification' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Informations de la configuration' })
  mapping?: {
    id: string;
    name: string;
    venue_id: string;
  };

  @ApiPropertyOptional({ description: 'Informations du lieu' })
  venue?: {
    id: string;
    name: string;
    slug: string;
    city: string;
  };

  @ApiPropertyOptional({ description: 'Détails des zones autorisées' })
  allowedZoneDetails?: Array<{
    id: string;
    name: string;
    code: string;
    zone_type: string;
    capacity: number;
  }>;

  @ApiPropertyOptional({ description: 'Détails des zones restreintes' })
  restrictedZoneDetails?: Array<{
    id: string;
    name: string;
    code: string;
    zone_type: string;
    capacity: number;
  }>;

  @ApiPropertyOptional({ description: 'Temps de traitement moyen (minutes)' })
  averageProcessingTime?: number;

  @ApiPropertyOptional({ description: 'Dernière utilisation' })
  lastUsed?: Date;

  @ApiPropertyOptional({ description: 'Nombre d\'utilisations aujourd\'hui' })
  todayUsageCount?: number;
}