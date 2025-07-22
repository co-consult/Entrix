// src/modules/auth/dto/session-info.dto.ts
/**
 * DTO pour informations de session utilisateur
 * 
 * Structure :
 * - Identifiants de session
 * - Informations device et localisation
 * - Métadonnées de sécurité
 * - Timestamps d'activité
 * 
 * Utilisation :
 * - Liste des sessions actives
 * - Détails session courante
 * - Gestion des sessions multiples
 * - Dashboard sécurité utilisateur
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsBoolean, 
  IsDate, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max
} from 'class-validator';

/**
 * DTO pour coordonnées géographiques
 */
export class GeolocationCoordinatesDto {
  @ApiProperty({
    description: 'Latitude',
    example: 36.8065,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber({}, { message: 'La latitude doit être un nombre' })
  @Min(-90, { message: 'La latitude doit être supérieure ou égale à -90' })
  @Max(90, { message: 'La latitude doit être inférieure ou égale à 90' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: 10.1815,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber({}, { message: 'La longitude doit être un nombre' })
  @Min(-180, { message: 'La longitude doit être supérieure ou égale à -180' })
  @Max(180, { message: 'La longitude doit être inférieure ou égale à 180' })
  longitude: number;
}

/**
 * DTO pour informations de géolocalisation
 */
export class GeolocationDto {
  @ApiPropertyOptional({ 
    description: 'Pays',
    example: 'Tunisia',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Le pays doit être une chaîne de caractères' })
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Région/État',
    example: 'Tunis Governorate',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La région doit être une chaîne de caractères' })
  region?: string;

  @ApiPropertyOptional({ 
    description: 'Ville',
    example: 'Tunis',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Coordonnées géographiques exactes',
    type: GeolocationCoordinatesDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les coordonnées doivent être un objet valide' })
  @ValidateNested()
  @Type(() => GeolocationCoordinatesDto)
  coordinates?: GeolocationCoordinatesDto;

  @ApiPropertyOptional({ 
    description: 'Fournisseur de géolocalisation utilisé',
    example: 'ipapi',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Le fournisseur doit être une chaîne de caractères' })
  provider?: string;
}

/**
 * DTO pour informations device parsées
 */
export class DeviceInfoDto {
  @ApiPropertyOptional({
    description: 'Nom du navigateur',
    example: 'Chrome',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Le navigateur doit être une chaîne de caractères' })
  browser?: string;

  @ApiPropertyOptional({
    description: 'Version du navigateur',
    example: '119.0.0.0',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'La version du navigateur doit être une chaîne de caractères' })
  browserVersion?: string;

  @ApiPropertyOptional({
    description: 'Système d\'exploitation',
    example: 'Windows',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Le système d\'exploitation doit être une chaîne de caractères' })
  os?: string;

  @ApiPropertyOptional({
    description: 'Version du système d\'exploitation',
    example: '10',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'La version de l\'OS doit être une chaîne de caractères' })
  osVersion?: string;

  @ApiPropertyOptional({
    description: 'Type de device',
    example: 'Desktop',
    enum: ['Desktop', 'Mobile', 'Tablet', 'TV', 'Unknown'],
  })
  @IsOptional()
  @IsEnum(['Desktop', 'Mobile', 'Tablet', 'TV', 'Unknown'], {
    message: 'Le type de device doit être Desktop, Mobile, Tablet, TV ou Unknown'
  })
  device?: 'Desktop' | 'Mobile' | 'Tablet' | 'TV' | 'Unknown';

  @ApiPropertyOptional({
    description: 'Fabricant du device',
    example: 'Apple',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Le fabricant doit être une chaîne de caractères' })
  deviceVendor?: string;
}

/**
 * DTO pour informations de sécurité session
 */
export class SessionSecurityInfoDto {
  @ApiProperty({
    description: 'Session marquée comme suspecte',
    example: false,
  })
  @IsBoolean({ message: 'isSuspicious doit être un booléen' })
  isSuspicious: boolean;

  @ApiProperty({
    description: 'Score de risque de 0 à 100',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Le score de risque doit être un nombre' })
  @Min(0, { message: 'Le score de risque doit être supérieur ou égal à 0' })
  @Max(100, { message: 'Le score de risque doit être inférieur ou égal à 100' })
  riskScore: number;

  @ApiProperty({
    description: 'Connexion depuis une nouvelle localisation',
    example: false,
  })
  @IsBoolean({ message: 'newLocation doit être un booléen' })
  newLocation: boolean;

  @ApiProperty({
    description: 'Connexion depuis un nouveau device',
    example: false,
  })
  @IsBoolean({ message: 'newDevice doit être un booléen' })
  newDevice: boolean;

  @ApiPropertyOptional({
    description: 'VPN détecté pour cette session',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'vpnDetected doit être un booléen' })
  vpnDetected?: boolean;

  @ApiProperty({
    description: 'Niveau de menace évalué',
    example: 'LOW',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Le niveau de menace doit être LOW, MEDIUM, HIGH ou CRITICAL'
  })
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * DTO principal pour informations de session
 */
export class SessionInfoDto {
  /**
   * ID unique de la session
   */
  @ApiProperty({
    description: 'Identifiant unique de la session',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString({ message: 'L\'ID de session doit être une chaîne de caractères' })
  id: string;

  /**
   * Adresse IP de la session
   */
  @ApiProperty({
    description: 'Adresse IP de la session',
    example: '197.28.145.67',
    format: 'ipv4',
  })
  @IsString({ message: 'L\'adresse IP doit être une chaîne de caractères' })
  ipAddress: string;

  /**
   * User Agent du navigateur
   */
  @ApiPropertyOptional({
    description: 'User Agent du navigateur/application',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Le User Agent doit être une chaîne de caractères' })
  userAgent?: string;

  /**
   * Empreinte device pour sécurité
   */
  @ApiPropertyOptional({
    description: 'Empreinte unique du device pour sécurité',
    example: 'fp_1234567890abcdef',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'L\'empreinte device doit être une chaîne de caractères' })
  deviceFingerprint?: string;

  /**
   * Informations de géolocalisation
   */
  @ApiPropertyOptional({
    description: 'Informations de géolocalisation de la session',
    type: GeolocationDto,
  })
  @IsOptional()
  @IsObject({ message: 'La géolocalisation doit être un objet valide' })
  @ValidateNested()
  @Type(() => GeolocationDto)
  geolocation?: GeolocationDto;

  /**
   * Session active
   */
  @ApiProperty({
    description: 'Indique si la session est actuellement active',
    example: true,
  })
  @IsBoolean({ message: 'isActive doit être un booléen' })
  isActive: boolean;

  /**
   * Session courante
   */
  @ApiProperty({
    description: 'Indique si c\'est la session courante de l\'utilisateur',
    example: true,
  })
  @IsBoolean({ message: 'isCurrent doit être un booléen' })
  isCurrent: boolean;

  /**
   * Date de création
   */
  @ApiProperty({
    description: 'Date et heure de création de la session',
    example: '2025-01-07T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'createdAt doit être une date valide' })
  createdAt: Date;

  /**
   * Dernière activité
   */
  @ApiProperty({
    description: 'Date et heure de la dernière activité',
    example: '2025-01-07T11:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'lastActivity doit être une date valide' })
  lastActivity: Date;

  /**
   * Expiration de la session
   */
  @ApiProperty({
    description: 'Date et heure d\'expiration de la session',
    example: '2025-01-08T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'expiresAt doit être une date valide' })
  expiresAt: Date;

  /**
   * Informations sur le device
   */
  @ApiPropertyOptional({
    description: 'Informations parsées sur le device utilisé',
    type: DeviceInfoDto,
  })
  @IsOptional()
  @IsObject({ message: 'Les informations device doivent être un objet valide' })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;

  /**
   * Indicateurs de sécurité
   */
  @ApiProperty({
    description: 'Indicateurs de sécurité de la session',
    type: SessionSecurityInfoDto,
  })
  @IsObject({ message: 'Les informations de sécurité doivent être un objet valide' })
  @ValidateNested()
  @Type(() => SessionSecurityInfoDto)
  securityInfo: SessionSecurityInfoDto;

  /**
   * Durée de session (en minutes)
   */
  @ApiProperty({
    description: 'Durée de la session en minutes',
    example: 75,
    minimum: 0,
  })
  @IsNumber({}, { message: 'La durée doit être un nombre' })
  @Min(0, { message: 'La durée doit être positive' })
  durationMinutes: number;

  /**
   * Dernière action effectuée
   */
  @ApiPropertyOptional({
    description: 'Dernière action effectuée dans cette session',
    example: 'GET /api/v1/users/me',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La dernière action doit être une chaîne de caractères' })
  lastAction?: string;

  /**
   * Nombre de requêtes dans cette session
   */
  @ApiProperty({
    description: 'Nombre total de requêtes effectuées dans cette session',
    example: 42,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Le nombre de requêtes doit être un nombre' })
  @Min(0, { message: 'Le nombre de requêtes doit être positif' })
  requestCount: number;
}

/**
 * DTO pour la liste des sessions utilisateur
 */
export class UserSessionsDto {
  @ApiProperty({
    description: 'Liste des sessions actives de l\'utilisateur',
    type: [SessionInfoDto],
  })
  @ValidateNested({ each: true })
  @Type(() => SessionInfoDto)
  sessions: SessionInfoDto[];

  @ApiProperty({
    description: 'Nombre total de sessions actives',
    example: 3,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Le nombre total de sessions doit être un nombre' })
  @Min(0, { message: 'Le nombre total de sessions doit être positif' })
  totalActiveSessions: number;

  @ApiProperty({
    description: 'Limite de sessions concurrentes autorisées',
    example: 5,
    minimum: 1,
  })
  @IsNumber({}, { message: 'La limite de sessions doit être un nombre' })
  @Min(1, { message: 'La limite de sessions doit être au moins 1' })
  maxConcurrentSessions: number;

  @ApiProperty({
    description: 'Nombre de sessions suspectes détectées',
    example: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Le nombre de sessions suspectes doit être un nombre' })
  @Min(0, { message: 'Le nombre de sessions suspectes doit être positif' })
  suspiciousSessions: number;

  @ApiProperty({
    description: 'ID de la session courante dans la liste',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString({ message: 'L\'ID de session courante doit être une chaîne de caractères' })
  currentSessionId: string;

  @ApiProperty({
    description: 'Timestamp de la dernière vérification des sessions',
    example: '2025-01-07T11:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'lastUpdated doit être une date valide' })
  lastUpdated: Date;
}

/**
 * DTO pour réponse simple de session courante
 */
export class CurrentSessionDto {
  @ApiProperty({
    description: 'Informations de la session courante',
    type: SessionInfoDto,
  })
  @ValidateNested()
  @Type(() => SessionInfoDto)
  session: SessionInfoDto;

  @ApiProperty({
    description: 'Nombre total de sessions actives pour cet utilisateur',
    example: 3,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Le nombre total de sessions doit être un nombre' })
  @Min(1, { message: 'Le nombre total de sessions doit être au moins 1' })
  totalActiveSessions: number;
}

/**
 * DTO pour les statistiques de sessions
 */
export class SessionStatsDto {
  @ApiProperty({
    description: 'Nombre total de sessions actives',
    example: 3,
  })
  @IsNumber({}, { message: 'Le nombre total doit être un nombre' })
  totalActive: number;

  @ApiProperty({
    description: 'Nombre de sessions desktop',
    example: 2,
  })
  @IsNumber({}, { message: 'Le nombre desktop doit être un nombre' })
  desktop: number;

  @ApiProperty({
    description: 'Nombre de sessions mobile',
    example: 1,
  })
  @IsNumber({}, { message: 'Le nombre mobile doit être un nombre' })
  mobile: number;

  @ApiProperty({
    description: 'Nombre de sessions suspectes',
    example: 0,
  })
  @IsNumber({}, { message: 'Le nombre de sessions suspectes doit être un nombre' })
  suspicious: number;

  @ApiProperty({
    description: 'Pays d\'origine des sessions',
    example: ['Tunisia', 'France'],
    type: [String],
  })
  countries: string[];

  @ApiProperty({
    description: 'Session la plus ancienne',
    example: '2025-01-06T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'oldestSession doit être une date valide' })
  oldestSession: Date;

  @ApiProperty({
    description: 'Session la plus récente',
    example: '2025-01-07T11:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate({ message: 'newestSession doit être une date valide' })
  newestSession: Date;
}