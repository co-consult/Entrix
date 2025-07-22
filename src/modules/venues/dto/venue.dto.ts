// src/modules/venues/dto/venue.dto.ts
/**
 * DTOs pour les venues
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
  IsISO31661Alpha2,
  IsUrl,
  IsPositive,
  IsInt,
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

import { 
  VENUE_VALIDATION_LIMITS,
  VENUE_DEFAULTS,
  SUPPORTED_COUNTRIES,
  COMMON_AMENITIES,
  VenueSortField,
  SortDirection
} from '../constants/venues.constants';

// ================================
// COORDINATES DTO
// ================================

export class CoordinatesDto {
  @ApiProperty({
    description: 'Latitude',
    example: 36.8065,
    minimum: VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
  })
  @IsLatitude({ message: 'Latitude invalide' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: 10.1815,
    minimum: VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
  })
  @IsLongitude({ message: 'Longitude invalide' })
  longitude: number;
}

// ================================
// VENUE METADATA DTO
// ================================

export class VenueMetadataDto {
  @ApiPropertyOptional({
    description: 'Année de construction',
    example: 1967,
    minimum: 1800,
    maximum: new Date().getFullYear(),
  })
  @IsOptional()
  @IsInt({ message: 'L\'année de construction doit être un entier' })
  @Min(1800, { message: 'L\'année de construction ne peut pas être antérieure à 1800' })
  @Max(new Date().getFullYear(), { message: 'L\'année de construction ne peut pas être future' })
  construction_year?: number;

  @ApiPropertyOptional({
    description: 'Année de rénovation',
    example: 2010,
    minimum: 1800,
    maximum: new Date().getFullYear(),
  })
  @IsOptional()
  @IsInt({ message: 'L\'année de rénovation doit être un entier' })
  @Min(1800, { message: 'L\'année de rénovation ne peut pas être antérieure à 1800' })
  @Max(new Date().getFullYear(), { message: 'L\'année de rénovation ne peut pas être future' })
  renovation_year?: number;

  @ApiPropertyOptional({
    description: 'Architecte',
    example: 'Hassan Fathy',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Le nom de l\'architecte doit être une chaîne de caractères' })
  @Length(1, 200, { message: 'Le nom de l\'architecte doit contenir entre 1 et 200 caractères' })
  architect?: string;

  @ApiPropertyOptional({
    description: 'Certifications de sécurité',
    example: ['ISO_14001', 'OHSAS_18001'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les certifications doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque certification doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 certifications autorisées' })
  safety_certifications?: string[];

  @ApiPropertyOptional({
    description: 'Caractéristiques de durabilité',
    example: ['PANNEAUX_SOLAIRES', 'RECUPERATION_EAU_PLUIE'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les caractéristiques de durabilité doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque caractéristique doit être une chaîne de caractères' })
  @ArrayMaxSize(20, { message: 'Maximum 20 caractéristiques autorisées' })
  sustainability_features?: string[];
}

// ================================
// CREATE VENUE DTO
// ================================

export class CreateVenueDto {
  @ApiProperty({
    description: 'Nom du lieu',
    example: 'Stade Olympique de Tunis',
    minLength: VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH, VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH, {
    message: `Le nom doit contenir entre ${VENUE_VALIDATION_LIMITS.NAME_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.NAME_MAX_LENGTH} caractères`
  })
  name: string;

  @ApiProperty({
    description: 'Slug unique pour l\'URL',
    example: 'stade-olympique-tunis',
    minLength: VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH,
    maxLength: VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Le slug est obligatoire' })
  @IsString({ message: 'Le slug doit être une chaîne de caractères' })
  @Length(VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH, VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH, {
    message: `Le slug doit contenir entre ${VENUE_VALIDATION_LIMITS.SLUG_MIN_LENGTH} et ${VENUE_VALIDATION_LIMITS.SLUG_MAX_LENGTH} caractères`
  })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets'
  })
  slug: string;

  @ApiProperty({
    description: 'Adresse complète',
    example: 'Avenue du Stade Olympique, Radès',
    maxLength: VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'L\'adresse est obligatoire' })
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  @Length(1, VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH, {
    message: `L\'adresse ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.ADDRESS_MAX_LENGTH} caractères`
  })
  address: string;

  @ApiProperty({
    description: 'Ville',
    example: 'Radès',
    maxLength: VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'La ville est obligatoire' })
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @Length(1, VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH, {
    message: `La ville ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH} caractères`
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '2040',
    maxLength: VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Le code postal doit être une chaîne de caractères' })
  @Length(1, VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH, {
    message: `Le code postal ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.POSTAL_CODE_MAX_LENGTH} caractères`
  })
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Code pays ISO 3166-1 alpha-2',
    example: 'TN',
    default: VENUE_DEFAULTS.COUNTRY,
    enum: SUPPORTED_COUNTRIES,
  })
  @IsOptional()
  @IsISO31661Alpha2({ message: 'Code pays invalide' })
  @IsEnum(SUPPORTED_COUNTRIES, { message: 'Pays non supporté' })
  country?: string = VENUE_DEFAULTS.COUNTRY;

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

  @ApiProperty({
    description: 'Capacité maximale du lieu',
    example: 60000,
    minimum: VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN,
    maximum: VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX,
  })
  @IsNotEmpty({ message: 'La capacité maximale est obligatoire' })
  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN, {
    message: `La capacité minimale est de ${VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN}`
  })
  @Max(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX, {
    message: `La capacité maximale est de ${VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX}`
  })
  max_capacity: number;

  @ApiPropertyOptional({
    description: 'Description du lieu',
    example: 'Le Stade Olympique de Tunis est un stade multi-usage...',
    maxLength: VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @Length(0, VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, {
    message: `La description ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} caractères`
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'URLs des images du lieu',
    example: ['https://cdn.entrix.tn/venues/stade-olympique-1.jpg'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les images doivent être un tableau' })
  @IsUrl({}, { each: true, message: 'Chaque image doit être une URL valide' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_IMAGES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_IMAGES} images autorisées`
  })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Équipements globaux du lieu',
    example: ['PARKING_GENERAL', 'WIFI', 'RESTAURATION'],
    isArray: true,
    type: String,
    enum: COMMON_AMENITIES,
  })
  @IsOptional()
  @IsArray({ message: 'Les équipements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' })
  @ArrayMaxSize(VENUE_VALIDATION_LIMITS.MAX_AMENITIES, {
    message: `Maximum ${VENUE_VALIDATION_LIMITS.MAX_AMENITIES} équipements autorisés`
  })
  global_amenities?: string[];

  @ApiPropertyOptional({
    description: 'ID du propriétaire principal',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du propriétaire doit être un UUID valide' })
  primary_owner_id?: string;

  @ApiPropertyOptional({
    description: 'ID du gestionnaire principal',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du gestionnaire doit être un UUID valide' })
  primary_manager_id?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées du lieu',
    type: VenueMetadataDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet' })
  @ValidateNested()
  @Type(() => VenueMetadataDto)
  metadata?: VenueMetadataDto;
}

// ================================
// UPDATE VENUE DTO
// ================================

export class UpdateVenueDto extends PartialType(CreateVenueDto) {
  @ApiPropertyOptional({
    description: 'ID de la configuration par défaut',
    example: 'mapping-123',
  })
  @IsOptional()
  @IsString({ message: 'L\'ID de la configuration doit être une chaîne de caractères' })
  default_mapping_id?: string;

  @ApiPropertyOptional({
    description: 'Statut actif du lieu',
    example: true,
    default: VENUE_DEFAULTS.IS_ACTIVE,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  is_active?: boolean;
}

// ================================
// VENUE SEARCH DTO
// ================================

export class VenueSearchDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle',
    example: 'stade olympique',
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
    description: 'Ville',
    example: 'Tunis',
    maxLength: VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @Length(1, VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH, {
    message: `La ville ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.CITY_MAX_LENGTH} caractères`
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Code pays',
    example: 'TN',
    enum: SUPPORTED_COUNTRIES,
  })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES, { message: 'Pays non supporté' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Capacité minimale',
    example: 1000,
    minimum: VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité minimale doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN, {
    message: `La capacité minimale doit être d'au moins ${VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN}`
  })
  @Transform(({ value }) => parseInt(value))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Capacité maximale',
    example: 100000,
    maximum: VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité maximale doit être un nombre entier' })
  @Max(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX, {
    message: `La capacité maximale ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX}`
  })
  @Transform(({ value }) => parseInt(value))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Équipements requis',
    example: ['PARKING_GENERAL', 'WIFI'],
    isArray: true,
    type: String,
    enum: COMMON_AMENITIES,
  })
  @IsOptional()
  @IsArray({ message: 'Les équipements doivent être un tableau' })
  @IsString({ each: true, message: 'Chaque équipement doit être une chaîne de caractères' })
  amenities?: string[];

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
    description: 'Avec événements actifs uniquement',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le filtre événements actifs doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  hasActiveEvents?: boolean;

  @ApiPropertyOptional({
    description: 'ID du propriétaire',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du propriétaire doit être un UUID valide' })
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'ID du gestionnaire',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID(4, { message: 'L\'ID du gestionnaire doit être un UUID valide' })
  managerId?: string;

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
  @Min(VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE, {
    message: `La limite doit être d'au moins ${VENUE_VALIDATION_LIMITS.MIN_PAGE_SIZE}`
  })
  @Max(VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE, {
    message: `La limite ne peut pas dépasser ${VENUE_VALIDATION_LIMITS.MAX_PAGE_SIZE}`
  })
  @Transform(({ value }) => parseInt(value) || VENUE_DEFAULTS.LIMIT)
  limit?: number = VENUE_DEFAULTS.LIMIT;

  // Tri
  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'name',
    enum: ['name', 'city', 'max_capacity', 'created_at', 'updated_at'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  @IsEnum(['name', 'city', 'max_capacity', 'created_at', 'updated_at'], {
    message: 'Champ de tri non valide'
  })
  sortField?: VenueSortField;

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
    description: 'Inclure les configurations',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion des configurations doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeMappings?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure la configuration par défaut',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion de la configuration par défaut doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeDefaultMapping?: boolean = false;

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
// GEO SEARCH DTO
// ================================

export class VenueGeoSearchDto {
  @ApiProperty({
    description: 'Latitude du centre de recherche',
    example: 36.8065,
    minimum: VENUE_VALIDATION_LIMITS.LATITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LATITUDE_MAX,
  })
  @IsLatitude({ message: 'Latitude invalide' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude du centre de recherche',
    example: 10.1815,
    minimum: VENUE_VALIDATION_LIMITS.LONGITUDE_MIN,
    maximum: VENUE_VALIDATION_LIMITS.LONGITUDE_MAX,
  })
  @IsLongitude({ message: 'Longitude invalide' })
  longitude: number;

  @ApiProperty({
    description: 'Rayon de recherche en kilomètres',
    example: 50,
    minimum: VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN,
    maximum: VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX,
  })
  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @Min(VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN, {
    message: `Le rayon minimum est de ${VENUE_VALIDATION_LIMITS.GEO_RADIUS_MIN} km`
  })
  @Max(VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX, {
    message: `Le rayon maximum est de ${VENUE_VALIDATION_LIMITS.GEO_RADIUS_MAX} km`
  })
  radiusKm: number;

  @ApiPropertyOptional({
    description: 'Inclure la distance dans les résultats',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'L\'inclusion de la distance doit être un booléen' })
  @Transform(({ value }) => value === 'true' || value === true)
  includeDistance?: boolean = true;

  // Hérite des autres filtres de VenueSearchDto
  @ApiPropertyOptional({
    description: 'Capacité minimale',
    example: 1000,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité minimale doit être un nombre entier' })
  @Min(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MIN)
  @Transform(({ value }) => parseInt(value))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Capacité maximale',
    example: 100000,
  })
  @IsOptional()
  @IsInt({ message: 'La capacité maximale doit être un nombre entier' })
  @Max(VENUE_VALIDATION_LIMITS.MAX_CAPACITY_MAX)
  @Transform(({ value }) => parseInt(value))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Équipements requis',
    example: ['PARKING_GENERAL', 'WIFI'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray({ message: 'Les équipements doivent être un tableau' })
  @IsString({ each: true })
  amenities?: string[];

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
}

// ================================
// VENUE RESPONSE DTO
// ================================

export class VenueResponseDto {
  @ApiProperty({ description: 'ID du lieu' })
  id: string;

  @ApiProperty({ description: 'Nom du lieu' })
  name: string;

  @ApiProperty({ description: 'Slug du lieu' })
  slug: string;

  @ApiProperty({ description: 'Adresse' })
  address: string;

  @ApiProperty({ description: 'Ville' })
  city: string;

  @ApiPropertyOptional({ description: 'Code postal' })
  postal_code?: string;

  @ApiProperty({ description: 'Code pays' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;

  @ApiProperty({ description: 'Capacité maximale' })
  max_capacity: number;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Images', isArray: true, type: String })
  images?: string[];

  @ApiPropertyOptional({ description: 'Équipements globaux', isArray: true, type: String })
  global_amenities?: string[];

  @ApiProperty({ description: 'Statut actif' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'ID du propriétaire principal' })
  primary_owner_id?: string;

  @ApiPropertyOptional({ description: 'ID du gestionnaire principal' })
  primary_manager_id?: string;

  @ApiPropertyOptional({ description: 'ID de la configuration par défaut' })
  default_mapping_id?: string;

  @ApiPropertyOptional({ description: 'Métadonnées' })
  metadata?: any;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de modification' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Distance (pour recherche géographique)' })
  distance?: number;

  @ApiPropertyOptional({ description: 'Nombre total d\'événements' })
  totalEvents?: number;

  @ApiPropertyOptional({ description: 'Note moyenne' })
  avgRating?: number;
}