// src/modules/venues/dto/mapping.dto.ts
/**
 * DTOs pour les configurations de lieux (mappings)
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
  IsInt,
  IsDate,
  Min,
  Max,
  Length,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
  IsUUID,
  Matches,
  IsObject
} from 'class-validator';

import { mapping_type } from '@prisma/client';
import { 
  VENUE_VALIDATION_LIMITS,
  VENUE_DEFAULTS,
  MAPPING_TYPES,
  SUPPORTED_EVENT_CATEGORIES,
  MappingSortField,
  SortDirection
} from '../constants/venues.constants';

// ================================
// MAPPING METADATA DTO
// ================================

export class MappingMetadataDto {
  @ApiPropertyOptional({
    description: 'Notes de configuration',
    example: 'Configuration optimisée pour les matchs de football',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @Length(0, 1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' })
  configuration_notes?: string;

  @ApiPropertyOptional({
    description: 'Temps de montage en minutes',
    example: 120,
    minimum: 0,
    maximum: 1440, // 24 heures
  })
  @IsOptional()
  @IsInt({ message: 'Le temps de montage doit être un nombre entier' })
  @Min(0, { message: 'Le temps de montage ne peut pas être négatif' })
  @Max(1440, { message: 'Le temps de montage ne peut pas dépasser 24 heures' })
  setup_time_minutes?: number;

  @ApiPropertyOptional({
    description: 'Temps de démontage en minutes',
    example: 90,
    minimum: 0,
    maximum: 1440,
  })
  @IsOptional()
  @IsInt({ message: 'Le temps de démontage doit être un nombre entier' })
  @Min(0, { message: 'Le temps de démontage ne peut pas être négatif' })
  @Max(1440, { message: 'Le temps de démontage ne peut pas dépasser 24 heures' })
  breakdown_time_minutes?: number;

  @ApiPropertyOptional({
    description: 'Personnel requis',
    example: 25,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt({ message: 'Le personnel requis doit être un nombre entier' })
  @Min(0, { message: 'Le personnel requis ne peut pas être négatif' })
  @Max(1000, { message: 'Le personnel requis ne peut pas dépasser 1000' })
  required_staff?: number;

  @ApiPropertyOptional({
    description: 'Exigences techniques',
    example: ['ECLAIRAGE_RENFORCE', 'SONORISATION_STADIUM'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les exigences techniques doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque exigence doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 exigences techniques autorisées' })
  technical_requirements?: string[];

  @ApiPropertyOptional({
    description: 'Considérations de sécurité',
    example: ['CONTROLE_ACCES_RENFORCE', 'SURVEILLANCE_VIDEO'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les considérations de sécurité doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque considération doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 considérations de sécurité autorisées' })
  safety_considerations?: string[];

  @ApiPropertyOptional({
    description: 'Dépendances météorologiques',
    example: ['PAS_DE_PLUIE', 'VENT_FAIBLE'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les dépendances météorologiques doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque dépendance doit être une chaîne de caractères' })
  @ArrayMaxSize(10, { message: 'Maximum 10 dépendances météorologiques autorisées' })
  weather_dependencies?: string[];
}

// ================================
// CREATE MAPPING DTO
// ================================

export class CreateMappingDto {
  @ApiProperty({
    description: 'ID du lieu',
    example: 'venue-123',
  })
  @IsNotEmpty({ message: 'L\'ID du lieu est obligatoire' })
  @IsString({ message: 'L\'ID du lieu doit être une chaîne de caractères' })
  venue_id: string;

  @ApiProperty({
    description: 'Nom de la configuration',
    example: 'Configuration Football Standard',
    minLength: VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH, VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH, {
    message: `Le nom doit contenir entre ${VENUE_VALIDATION_LIMITS.MAPPING_NAME_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.MAPPING_NAME_MAX_LENGTH} caractères`
  })
  name: string;

  @ApiProperty({
    description: 'Code unique de la configuration',
    example: 'FOOTBALL_STD',
    minLength: VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH, VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH, {
    message: `Le code doit contenir entre ${VENUE_VALIDATION_LIMITS.MAPPING_CODE_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.MAPPING_CODE_MAX_LENGTH} caractères`
  })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Description de la configuration',
    example: 'Configuration standard pour les matchs de football avec toutes les tribunes ouvertes',
    maxLength: VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @Length(0, VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH, {
    message: `La description ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.MAPPING_DESCRIPTION_MAX_LENGTH} caractères`
  })
  description?: string;

  @ApiProperty({
    description: 'Type de configuration',
    example: mapping_type.DEFAULT,
    enum: mapping_type,
  })
  @IsNotEmpty({ message: 'Le type de configuration est obligatoire' })
  @IsEnum(mapping_type, { message: 'Type de configuration invalide' })
  mapping_type: mapping_type;

  @ApiProperty({
    description: 'Catégories d\'événements supportées',
    example: ['FOOTBALL', 'CONCERT'],
    isArray: true,
    type: String,
    enum: SUPPORTED_EVENT_CATEGORIES,
  })
  @IsNotEmpty({ message: 'Au moins une catégorie d\'événement est obligatoire' })
  @IsArray({ message: 'Les catégories d\'événements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque catégorie doit être une chaîne de caractères' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_EVENT_CATEGORIES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_EVENT_CATEGORIES} catégories autorisées`
  })
  event_categories: string[];

  @ApiProperty({
    description: 'Capacité effective de la configuration',
    example: 45000,
    minimum: VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN,
    maximum: VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX,
  })
  @IsNotEmpty({ message: 'La capacité effective est obligatoire' })
  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN, {
    message: `La capacité minimale est de ${VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN}`
  })
  @Max(VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX, {
    message: `La capacité maximale est de ${VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX}`
  })
  effective_capacity: number;

  @ApiPropertyOptional({
    description: 'Date de début de validité',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate({ message: 'La date de début doit être une date valide' })
  @Type(() => Date)
  valid_from?: Date;

  @ApiPropertyOptional({
    description: 'Date de fin de validité',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDate({ message: 'La date de fin doit être une date valide' })
  @Type(() => Date)
  valid_until?: Date;

  @ApiPropertyOptional({
    description: 'Métadonnées de la configuration',
    type: MappingMetadataDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  @ValidateNested()
  @Type(() => MappingMetadataDto)
  metadata?: MappingMetadataDto;
}

// ================================
// UPDATE MAPPING DTO
// ================================

export class UpdateMappingDto extends PartialType(CreateMappingDto) {
  @ApiPropertyOptional({
    description: 'Statut actif de la configuration',
    example: true,
    default: VENUE_DEFAULTS.MAPPING_IS_ACTIVE,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  is_active?: boolean;

  // Retire venue_id du update (ne peut pas être modifié)
  venue_id?: never;
}

// ================================
// MAPPING SEARCH DTO
// ================================

export class MappingSearchDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle',
    example: 'football',
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
    description: 'ID du lieu',
    example: 'venue-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID du lieu doit être une chaîne de caractères' })
  venueId?: string;

  @ApiPropertyOptional({
    description: 'Type de configuration',
    example: mapping_type.DEFAULT,
    enum: mapping_type,
  })
  @IsOptional()
  @IsEnum(mapping_type, { message: 'Type de configuration invalide' })
  mappingType?: mapping_type;

  @ApiPropertyOptional({
    description: 'Catégories d\'événements',
    example: ['FOOTBALL', 'CONCERT'],
    isArray: true,
    type: String,
    enum: SUPPORTED_EVENT_CATEGORIES,
  })
  @IsOptional()
  @IsArray({ message: 'Les catégories d\'événements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque catégorie doit être une chaîne de caractères' })
  eventCategories?: string[];

  @ApiPropertyOptional({
    description: 'Capacité minimale',
    example: 1000,
    minimum: VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité minimale doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN, {
    message: `La capacité minimale doit être d'au moins ${VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MIN}`
  })
  @Transform(({ value }) => parseInt(value))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Capacité maximale',
    example: 100000,
    maximum: VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité maximale doit être un nombre entier' })
  @Max(VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX, {
    message: `La capacité maximale ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.EFFECTIVE_CAPACITY_MAX}`
  })
  @Transform(({ value }) => parseInt(value))
  maxCapacity?: number;

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
    description: 'Date de validité',
    example: '2025-07-11T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate({ message: 'La date de validité doit être une date valide' })
  @Type(() => Date)
  validAt?: Date;

  // Pagination
  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    minimum: 1,
    default: VENUE_DEFAULTS.PAGE,
  })
  @IsOptional()
  @IsInt({ message: 'Le numéro de page doit être un entier' })
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
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE)
  @Max(VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE)
  @Transform(({ value }) => parseInt(value) || VENUE_DEFAULTS.LIMIT)
  limit?: number = VENUE_DEFAULTS.LIMIT;

  // Tri
  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'name',
    enum: ['name', 'mapping_type', 'effective_capacity', 'created_at', 'updated_at'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  @IsEnum(['name', 'mapping_type', 'effective_capacity', 'created_at', 'updated_at'], {
    message: 'Champ de tri non valide'
  })
  sortField?: MappingSortField;

  @ApiPropertyOptional({
    description: 'Direction du tri',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString({ message: 'La direction du tri doit être une chaîne de caractères' })
  @IsEnum(['asc', 'desc'], { message: 'Direction de tri non valide' })
  sortDirection?: SortDirection = 'asc';

  // Inclusions
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
    description: 'Inclure les zones',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des zones doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeZones?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les points d\'accès',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des points d\'accès doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeAccessPoints?: boolean = false;

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
// SET DEFAULT MAPPING DTO
// ================================

export class SetDefaultMappingDto {
  @ApiProperty({
    description: 'ID de la configuration à définir par défaut',
    example: 'mapping-123',
  })
  @IsNotEmpty({ message: 'L\'ID de la configuration est obligatoire' })
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  mappingId: string;
}

// ================================
// MAPPING RESPONSE DTO
// ================================

export class MappingResponseDto {
  @ApiProperty({ description: 'ID de la configuration' })
  id: string;

  @ApiProperty({ description: 'ID du lieu' })
  venue_id: string;

  @ApiProperty({ description: 'Nom de la configuration' })
  name: string;

  @ApiProperty({ description: 'Code de la configuration' })
  code: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Type de configuration', enum: mapping_type })
  mapping_type: mapping_type;

  @ApiProperty({ description: 'Catégories d\'événements', isArray: true, type: String })
  event_categories: string[];

  @ApiProperty({ description: 'Capacité effective' })
  effective_capacity: number;

  @ApiPropertyOptional({ description: 'Date de début de validité' })
  valid_from?: Date;

  @ApiPropertyOptional({ description: 'Date de fin de validité' })
  valid_until?: Date;

  @ApiProperty({ description: 'Statut actif' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Métadonnées' })
  metadata?: any;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de modification' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Informations du lieu' })
  venue?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    max_capacity: number;
  };

  @ApiPropertyOptional({ description: 'Nombre de zones' })
  totalZones?: number;

  @ApiPropertyOptional({ description: 'Nombre de points d\'accès' })
  totalAccessPoints?: number;

  @ApiPropertyOptional({ description: 'Capacité totale des zones' })
  totalCapacity?: number;

  @ApiPropertyOptional({ description: 'Zones actives' })
  activeZones?: number;

  @ApiPropertyOptional({ description: 'Points d\'accès actifs' })
  activeAccessPoints?: number;
}