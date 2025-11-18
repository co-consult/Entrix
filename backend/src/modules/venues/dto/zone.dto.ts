// src/modules/venues/dto/zone.dto.ts
/**
 * DTOs pour les zones de lieux
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
  IsDecimal,
  Min,
  Max,
  Length,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
  IsCurrency,
  IsObject,
  Matches
} from 'class-validator';

import { zone_type, zone_category } from '@prisma/client';
import { 
  VENUE_VALIDATION_LIMITS,
  VENUE_DEFAULTS,
  ZONE_TYPES,
  ZONE_CATEGORIES,
  SUPPORTED_CURRENCIES,
  COMMON_AMENITIES,
  ZoneSortField,
  SortDirection
} from '../constants/venues.constants';

// ================================
// ZONE COORDINATES DTO
// ================================

export class ZoneCoordinatesDto {
  @ApiProperty({
    description: 'Coordonnées des points de la zone (GeoJSON Polygon)',
    example: {
      type: 'Polygon',
      coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]
    }
  })
  @IsObject({ message: 'Les coordonnées doivent être un objet GeoJSON valide' })
  coordinates: any;

  @ApiPropertyOptional({
    description: 'Centre de la zone',
    example: { latitude: 36.8065, longitude: 10.1815 }
  })
  @IsOptional()
  @IsObject({ message: 'Le centre doit être un objet avec latitude et longitude' })
  center?: {
    latitude: number;
    longitude: number;
  };

  @ApiPropertyOptional({
    description: 'Surface en mètres carrés',
    example: 2500,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La surface doit être un nombre' })
  @Min(1, { message: 'La surface doit être positive' })
  area_sqm?: number;
}

// ================================
// ZONE METADATA DTO
// ================================

export class ZoneMetadataDto {
  @ApiPropertyOptional({
    description: 'Qualité de la vue',
    example: 'EXCELLENT',
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'OBSTRUCTED'],
  })
  @IsOptional()
  @IsEnum(['EXCELLENT', 'GOOD', 'FAIR', 'OBSTRUCTED'], {
    message: 'Qualité de vue invalide'
  })
  view_quality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'OBSTRUCTED';

  @ApiPropertyOptional({
    description: 'Niveau de bruit',
    example: 'MODERATE',
    enum: ['QUIET', 'MODERATE', 'LOUD'],
  })
  @IsOptional()
  @IsEnum(['QUIET', 'MODERATE', 'LOUD'], {
    message: 'Niveau de bruit invalide'
  })
  noise_level?: 'QUIET' | 'MODERATE' | 'LOUD';

  @ApiPropertyOptional({
    description: 'Exposition au soleil',
    example: 'PARTIAL_SUN',
    enum: ['FULL_SUN', 'PARTIAL_SUN', 'SHADE'],
  })
  @IsOptional()
  @IsEnum(['FULL_SUN', 'PARTIAL_SUN', 'SHADE'], {
    message: 'Exposition au soleil invalide'
  })
  sun_exposure?: 'FULL_SUN' | 'PARTIAL_SUN' | 'SHADE';

  @ApiPropertyOptional({
    description: 'Points d\'entrée',
    example: ['PORTAIL_A', 'PORTAIL_B'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les points d\'entrée doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque point d\'entrée doit être une chaîne de caractères' })
  @ArrayMaxSize(10, { message: 'Maximum 10 points d\'entrée autorisés' })
  entry_points?: string[];

  @ApiPropertyOptional({
    description: 'Points de sortie',
    example: ['SORTIE_1', 'SORTIE_2'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les points de sortie doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque point de sortie doit être une chaîne de caractères' })
  @ArrayMaxSize(10, { message: 'Maximum 10 points de sortie autorisés' })
  exit_points?: string[];

  @ApiPropertyOptional({
    description: 'Installations les plus proches',
    example: ['TOILETTES_A1', 'BUVETTE_B2'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les installations doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque installation doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 installations autorisées' })
  nearest_facilities?: string[];

  @ApiPropertyOptional({
    description: 'Caractéristiques spéciales',
    example: ['VUE_PANORAMIQUE', 'ACCES_VIP'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les caractéristiques spéciales doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque caractéristique doit être une chaîne de caractères' })
  @ArrayMaxSize(15, { message: 'Maximum 15 caractéristiques spéciales autorisées' })
  special_features?: string[];
}

// ================================
// CREATE ZONE DTO
// ================================

export class CreateZoneDto {
  @ApiProperty({
    description: 'ID de la configuration',
    example: 'mapping-123',
  })
  @IsNotEmpty({ message: 'L\'ID de la configuration est obligatoire' })
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  mapping_id: string;

  @ApiPropertyOptional({
    description: 'ID de la zone parent',
    example: 'zone-parent-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de la zone parent doit être une chaîne de caractères' })
  parent_zone_id?: string;

  @ApiProperty({
    description: 'Nom de la zone',
    example: 'Tribune Nord',
    minLength: VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH, VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH, {
    message: `Le nom doit contenir entre ${VENUE_VALIDATION_LIMITS.ZONE_NAME_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.ZONE_NAME_MAX_LENGTH} caractères`
  })
  name: string;

  @ApiProperty({
    description: 'Code unique de la zone',
    example: 'TN_A',
    minLength: VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH, VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH, {
    message: `Le code doit contenir entre ${VENUE_VALIDATION_LIMITS.ZONE_CODE_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.ZONE_CODE_MAX_LENGTH} caractères`
  })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Le code ne peut contenir que des lettres majuscules, des chiffres et des underscores'
  })
  code: string;

  @ApiProperty({
    description: 'Type de zone',
    example: zone_type.SEATING_AREA,
    enum: zone_type,
  })
  @IsNotEmpty({ message: 'Le type de zone est obligatoire' })
  @IsEnum(zone_type, { message: 'Type de zone invalide' })
  zone_type: zone_type;

  @ApiProperty({
    description: 'Catégorie de zone',
    example: zone_category.STANDARD,
    enum: zone_category,
  })
  @IsNotEmpty({ message: 'La catégorie de zone est obligatoire' })
  @IsEnum(zone_category, { message: 'Catégorie de zone invalide' })
  category: zone_category;

  @ApiPropertyOptional({
    description: 'Niveau de la zone',
    example: 0,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX,
    default: VENUE_DEFAULTS.ZONE_LEVEL,
  })
  @IsOptional()
  @IsInt({ message: 'Le niveau doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN, {
    message: `Le niveau minimum est ${VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN}`
  })
  @Max(VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX, {
    message: `Le niveau maximum est ${VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX}`
  })
  level?: number = VENUE_DEFAULTS.ZONE_LEVEL;

  @ApiProperty({
    description: 'Capacité de la zone',
    example: 15000,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX,
  })
  @IsNotEmpty({ message: 'La capacité est obligatoire' })
  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN, {
    message: `La capacité minimale est ${VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN}`
  })
  @Max(VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX, {
    message: `La capacité maximale est ${VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX}`
  })
  capacity: number;

  @ApiPropertyOptional({
    description: 'Prix de base de la zone',
    example: 25.50,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX,
    default: VENUE_DEFAULTS.ZONE_BASE_PRICE,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le prix doit être un nombre avec maximum 2 décimales' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN, {
    message: `Le prix minimum est ${VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN}`
  })
  @Max(VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX, {
    message: `Le prix maximum est ${VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX}`
  })
  base_price?: number = VENUE_DEFAULTS.ZONE_BASE_PRICE;

  @ApiPropertyOptional({
    description: 'Devise',
    example: 'TND',
    default: VENUE_DEFAULTS.ZONE_CURRENCY,
    enum: SUPPORTED_CURRENCIES,
  })
  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH, VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH, {
    message: `La devise doit contenir exactement ${VENUE_VALIDATION_LIMITS.CURRENCY_LENGTH} caractères`
  })
  @IsEnum(SUPPORTED_CURRENCIES, { message: 'Devise non supportée' })
  currency?: string = VENUE_DEFAULTS.ZONE_CURRENCY;

  @ApiPropertyOptional({
    description: 'Coordonnées géographiques de la zone',
    type: ZoneCoordinatesDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les coordonnées doivent être un objet' })
  @ValidateNested()
  @Type(() => ZoneCoordinatesDto)
  coordinates?: ZoneCoordinatesDto;

  @ApiPropertyOptional({
    description: 'Description de la zone',
    example: 'Tribune Nord avec vue panoramique sur le terrain',
    maxLength: VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @Length(0, VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH, {
    message: `La description ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.ZONE_DESCRIPTION_MAX_LENGTH} caractères`
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Équipements de la zone',
    example: ['TOILETTES', 'BUVETTE', 'WIFI'],
    isArray: true,
    type: String,
    enum: COMMON_AMENITIES,
  })
  @IsOptional()
  @IsArray({ message: 'Les équipements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_ZONE_AMENITIES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_ZONE_AMENITIES} équipements autorisés`
  })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Zone accessible aux personnes à mobilité réduite',
    example: false,
    default: VENUE_DEFAULTS.ZONE_IS_ACCESSIBLE,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'accessibilité doit être un booléen' })
  is_accessible?: boolean = VENUE_DEFAULTS.ZONE_IS_ACCESSIBLE;

  @ApiPropertyOptional({
    description: 'Nécessite un accès spécial',
    example: false,
    default: VENUE_DEFAULTS.ZONE_REQUIRES_SPECIAL_ACCESS,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'accès spécial doit être un booléen' })
  requires_special_access?: boolean = VENUE_DEFAULTS.ZONE_REQUIRES_SPECIAL_ACCESS;

  @ApiPropertyOptional({
    description: 'Métadonnées de la zone',
    type: ZoneMetadataDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  @ValidateNested()
  @Type(() => ZoneMetadataDto)
  metadata?: ZoneMetadataDto;
}

// ================================
// UPDATE ZONE DTO
// ================================

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  // Retire mapping_id du update (ne peut pas être modifié)
  mapping_id?: never;
}

// ================================
// ZONE SEARCH DTO
// ================================

export class ZoneSearchDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle',
    example: 'tribune nord',
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
    description: 'Type de zone',
    example: zone_type.SEATING_AREA,
    enum: zone_type,
  })
  @IsOptional()
  @IsEnum(zone_type, { message: 'Type de zone invalide' })
  zoneType?: zone_type;

  @ApiPropertyOptional({
    description: 'Catégorie de zone',
    example: zone_category.STANDARD,
    enum: zone_category,
  })
  @IsOptional()
  @IsEnum(zone_category, { message: 'Catégorie de zone invalide' })
  category?: zone_category;

  @ApiPropertyOptional({
    description: 'Niveau de zone',
    example: 0,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX,
  })
  @IsOptional()
  @IsInt({ message: 'Le niveau doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MIN)
  @Max(VENUE_VALIDATION_LIMITS.ZONE_LEVEL_MAX)
  @Transform(({ value }) => parseInt(value))
  level?: number;

  @ApiPropertyOptional({
    description: 'Capacité minimale',
    example: 1000,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité minimale doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MIN)
  @Transform(({ value }) => parseInt(value))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Capacité maximale',
    example: 50000,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité maximale doit être un nombre entier' })
  @Max(VENUE_VALIDATION_LIMITS.ZONE_CAPACITY_MAX)
  @Transform(({ value }) => parseInt(value))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Prix minimum',
    example: 10.00,
    minimum: VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le prix minimum doit être un nombre' })
  @Min(VENUE_VALIDATION_LIMITS.ZONE_PRICE_MIN)
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Prix maximum',
    example: 100.00,
    maximum: VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le prix maximum doit être un nombre' })
  @Max(VENUE_VALIDATION_LIMITS.ZONE_PRICE_MAX)
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Devise',
    example: 'TND',
    enum: SUPPORTED_CURRENCIES,
  })
  @IsOptional()
  @IsEnum(SUPPORTED_CURRENCIES, { message: 'Devise non supportée' })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Zones accessibles uniquement',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'accessibilité doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  isAccessible?: boolean;

  @ApiPropertyOptional({
    description: 'Équipements requis',
    example: ['TOILETTES', 'WIFI'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les équipements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'ID de la zone parent',
    example: 'zone-parent-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de la zone parent doit être une chaîne de caractères' })
  parentZoneId?: string;

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
    enum: ['name', 'zone_type', 'category', 'capacity', 'base_price', 'level', 'created_at'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  @IsEnum(['name', 'zone_type', 'category', 'capacity', 'base_price', 'level', 'created_at'], {
    message: 'Champ de tri non valide'
  })
  sortField?: ZoneSortField;

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
    description: 'Inclure la configuration',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion de la configuration doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeMapping?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure la zone parent',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion de la zone parent doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeParentZone?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les zones enfants',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des zones enfants doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeChildZones?: boolean = false;

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
// ZONE HIERARCHY DTO
// ================================

export class ZoneHierarchyDto {
  @ApiProperty({
    description: 'ID de la configuration',
    example: 'mapping-123',
  })
  @IsNotEmpty({ message: 'L\'ID de la configuration est obligatoire' })
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  mappingId: string;

  @ApiPropertyOptional({
    description: 'Niveau maximum à inclure',
    example: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Le niveau maximum doit être un nombre entier' })
  @Min(0, { message: 'Le niveau maximum doit être positif' })
  @Max(10, { message: 'Le niveau maximum ne peut pas dépasser 10' })
  @Transform(({ value }) => parseInt(value))
  maxLevel?: number;

  @ApiPropertyOptional({
    description: 'Inclure les zones inactives',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des zones inactives doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeInactive?: boolean = false;
}

// ================================
// ZONE RESPONSE DTO
// ================================

export class ZoneResponseDto {
  @ApiProperty({ description: 'ID de la zone' })
  id: string;

  @ApiProperty({ description: 'ID de la configuration' })
  mapping_id: string;

  @ApiPropertyOptional({ description: 'ID de la zone parent' })
  parent_zone_id?: string;

  @ApiProperty({ description: 'Nom de la zone' })
  name: string;

  @ApiProperty({ description: 'Code de la zone' })
  code: string;

  @ApiProperty({ description: 'Type de zone', enum: zone_type })
  zone_type: zone_type;

  @ApiProperty({ description: 'Catégorie de zone', enum: zone_category })
  category: zone_category;

  @ApiProperty({ description: 'Niveau de la zone' })
  level: number;

  @ApiProperty({ description: 'Capacité de la zone' })
  capacity: number;

  @ApiProperty({ description: 'Prix de base' })
  base_price: number;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiPropertyOptional({ description: 'Coordonnées' })
  coordinates?: any;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Équipements', isArray: true, type: String })
  amenities?: string[];

  @ApiProperty({ description: 'Zone accessible' })
  is_accessible: boolean;

  @ApiProperty({ description: 'Nécessite un accès spécial' })
  requires_special_access: boolean;

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

  @ApiPropertyOptional({ description: 'Zone parent' })
  parentZone?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiPropertyOptional({ description: 'Zones enfants' })
  childZones?: Array<{
    id: string;
    name: string;
    code: string;
    capacity: number;
  }>;

  @ApiPropertyOptional({ description: 'Capacité disponible' })
  availableCapacity?: number;

  @ApiPropertyOptional({ description: 'Taux d\'utilisation (%)' })
  utilization?: number;

  @ApiPropertyOptional({ description: 'Nombre de droits d\'accès actifs' })
  activeAccessRights?: number;
}