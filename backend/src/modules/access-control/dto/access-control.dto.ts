import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsObject, IsDateString, IsArray } from 'class-validator';

// Enums for access control
export enum AccessStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  CONDITIONAL = 'CONDITIONAL'
}

export enum DenialReason {
  INVALID_QR = 'INVALID_QR',           // Changed from INVALID_CODE to match DB
  EXPIRED = 'EXPIRED',
  ALREADY_USED = 'ALREADY_USED',
  BLACKLISTED = 'BLACKLISTED',
  WRONG_EVENT = 'WRONG_EVENT',
  WRONG_VENUE = 'WRONG_VENUE',
  WRONG_ZONE = 'WRONG_ZONE',
  WRONG_TIME = 'WRONG_TIME',
  SUSPENDED_USER = 'SUSPENDED_USER',   // Matches database enum
  CANCELLED_TICKET = 'CANCELLED_TICKET', // Matches database enum
  NOT_YET_VALID = 'NOT_YET_VALID',     // Matches database enum
  NO_SUBSCRIPTION = 'NO_SUBSCRIPTION',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SECURITY_FLAG = 'SECURITY_FLAG',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DEVICE_ERROR = 'DEVICE_ERROR',       // Matches database enum
  INSUFFICIENT_RIGHTS = 'INSUFFICIENT_RIGHTS', // Matches database enum
  CAPACITY_FULL = 'CAPACITY_FULL'      // Matches database enum
}

export enum SecurityLevel {
  LOW = 'LOW',
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
  MAXIMUM = 'MAXIMUM',
  CUSTOM = 'CUSTOM'
}

export enum CrowdStatus {
  NORMAL = 'NORMAL',
  BUSY = 'BUSY',
  CROWDED = 'CROWDED',
  CRITICAL = 'CRITICAL'
}

export enum AccessAction {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  RE_ENTRY = 'RE_ENTRY',
  SCAN = 'SCAN'
}

// Request DTOs
export class SecurityContextDto {
  @ApiPropertyOptional({
    description: 'Niveau de sécurité',
    enum: SecurityLevel,
    default: SecurityLevel.STANDARD
  })
  @IsOptional()
  @IsEnum(SecurityLevel)
  security_level?: SecurityLevel = SecurityLevel.STANDARD;

  @ApiPropertyOptional({
    description: 'Statut de la foule',
    enum: CrowdStatus,
    default: CrowdStatus.NORMAL
  })
  @IsOptional()
  @IsEnum(CrowdStatus)
  crowd_status?: CrowdStatus = CrowdStatus.NORMAL;

  @ApiPropertyOptional({
    description: 'Vérifications additionnelles',
    example: ['ID_VERIFICATION', 'SECURITY_CHECK']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additional_checks?: string[];

  @ApiPropertyOptional({
    description: 'Conditions météo',
    example: 'CLEAR'
  })
  @IsOptional()
  @IsString()
  weather_conditions?: string;
}

export class GeolocationDto {
  @ApiProperty({
    description: 'Latitude GPS',
    example: 36.7517
  })
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude GPS',
    example: 10.2817
  })
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Précision en mètres',
    example: 5
  })
  @IsOptional()
  accuracy?: number;
}

export class DeviceInfoDto {
  @ApiProperty({
    description: 'Type d\'appareil',
    example: 'HANDHELD_SCANNER'
  })
  @IsNotEmpty()
  @IsString()
  device_type: string;

  @ApiProperty({
    description: 'ID de l\'appareil',
    example: 'HONEYWELL_001'
  })
  @IsNotEmpty()
  @IsString()
  device_id: string;

  @ApiPropertyOptional({
    description: 'Version du logiciel',
    example: '2.1.5'
  })
  @IsOptional()
  @IsString()
  software_version?: string;
}

export class AccessControlValidationDto {
  @ApiProperty({
    description: 'Code QR à valider',
    example: 'TKT_DER240315001'
  })
  @IsNotEmpty()
  @IsString()
  qr_code: string;

  @ApiProperty({
    description: 'ID du lieu',
    example: 'stade-rades-tunis'
  })
  @IsNotEmpty()
  @IsString()
  venue_id: string;

  @ApiProperty({
    description: 'Point d\'entrée',
    example: 'Entrée A'
  })
  @IsNotEmpty()
  @IsString()
  entry_point: string;

  @ApiPropertyOptional({
    description: 'ID de la zone',
    example: 'tribune-est'
  })
  @IsOptional()
  @IsString()
  zone_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'événement',
    example: 'd1c5cc73-5477-4855-81b5-adcf9f4d5288'
  })
  @IsOptional()
  @IsUUID()
  event_id?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'agent',
    example: 'agent-security-001'
  })
  @IsOptional()
  @IsString()
  agent_id?: string;

  @ApiPropertyOptional({
    description: 'ID du terminal',
    example: 'TERMINAL_A_001'
  })
  @IsOptional()
  @IsString()
  terminal_id?: string;

  @ApiPropertyOptional({
    description: 'Horodatage du scan',
    example: '2024-04-15T19:45:00Z'
  })
  @IsOptional()
  @IsDateString()
  scan_timestamp?: string;

  @ApiPropertyOptional({
    description: 'Contexte de sécurité',
    type: SecurityContextDto
  })
  @IsOptional()
  @IsObject()
  security_context?: SecurityContextDto;

  @ApiPropertyOptional({
    description: 'Géolocalisation',
    type: GeolocationDto
  })
  @IsOptional()
  @IsObject()
  geolocation?: GeolocationDto;

  @ApiPropertyOptional({
    description: 'Informations sur l\'appareil',
    type: DeviceInfoDto
  })
  @IsOptional()
  @IsObject()
  device_info?: DeviceInfoDto;
}

// Response DTOs
export class AccessRightDto {
  @ApiProperty({
    description: 'ID du droit d\'accès'
  })
  id: string;

  @ApiProperty({
    description: 'Code QR'
  })
  qr_code: string;

  @ApiProperty({
    description: 'Code d\'accès'
  })
  access_code: string;

  @ApiProperty({
    description: 'Type d\'accès',
    example: 'TICKET'
  })
  source_type: string;

  @ApiPropertyOptional({
    description: 'Type d\'accès (alias)',
    example: 'TICKET'
  })
  access_type?: string;

  @ApiPropertyOptional({
    description: 'Statut du droit d\'accès'
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Numéro de série de la carte physique'
  })
  serial_number?: string;

  @ApiPropertyOptional({
    description: 'Porte d\'entrée assignée'
  })
  entry_gate?: string;

  @ApiPropertyOptional({
    description: 'Nom de la zone'
  })
  zone_name?: string;

  @ApiPropertyOptional({
    description: 'Numéro du siège'
  })
  seat_number?: string;

  @ApiPropertyOptional({
    description: 'Nom du plan d\'abonnement'
  })
  plan_name?: string;

  @ApiPropertyOptional({
    description: 'Nom de l\'utilisateur'
  })
  user_name?: string;

  @ApiPropertyOptional({
    description: 'Date de validité début'
  })
  valid_from?: Date;

  @ApiPropertyOptional({
    description: 'Date de validité fin'
  })
  valid_until?: Date;

  @ApiPropertyOptional({
    description: 'Nombre maximum d\'utilisations'
  })
  max_uses?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'utilisations actuelles'
  })
  current_uses?: number;

  @ApiPropertyOptional({
    description: 'ID de la zone'
  })
  zone_id?: string;

  @ApiPropertyOptional({
    description: 'ID du siège'
  })
  seat_id?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées d\'accès'
  })
  access_metadata?: any;
}

export class UserInfoDto {
  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur'
  })
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Nom du détenteur'
  })
  holder_name?: string;
}

export class EventInfoDto {
  @ApiPropertyOptional({
    description: 'ID de l\'événement'
  })
  event_id?: string;

  @ApiPropertyOptional({
    description: 'Nom de l\'événement'
  })
  event_name?: string;
}

export class SubscriptionInfoDto {
  @ApiPropertyOptional({
    description: 'ID de l\'abonnement'
  })
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'Nom du plan d\'abonnement'
  })
  plan_name?: string;

  @ApiPropertyOptional({
    description: 'Description du plan'
  })
  plan_description?: string;

  @ApiPropertyOptional({
    description: 'Nom de la zone'
  })
  zone_name?: string;

  @ApiPropertyOptional({
    description: 'Point d\'accès'
  })
  access_point?: string;

  @ApiPropertyOptional({
    description: 'Numéro de siège'
  })
  seat_number?: string;

  @ApiPropertyOptional({
    description: 'Numéro de porte'
  })
  gate_number?: string;

  @ApiPropertyOptional({
    description: 'Section'
  })
  section?: string;

  @ApiPropertyOptional({
    description: 'Rangée'
  })
  row?: string;

  @ApiPropertyOptional({
    description: 'Prix'
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Devise'
  })
  currency?: string;
}

export class DenialDetailsDto {
  @ApiProperty({
    description: 'Raison principale du refus'
  })
  primary_reason: string;

  @ApiPropertyOptional({
    description: 'Raison technique'
  })
  technical_reason?: string;

  @ApiPropertyOptional({
    description: 'Dernière utilisation'
  })
  last_usage?: {
    timestamp: string;
    entry_point: string;
    agent: string;
  };
}

export class ConditionalAccessDto {
  @ApiProperty({
    description: 'Type de condition'
  })
  type: string;

  @ApiProperty({
    description: 'Description de la condition'
  })
  description: string;

  @ApiProperty({
    description: 'Si la condition est obligatoire'
  })
  is_mandatory: boolean;
}

export class AccessControlValidationResponseDto {
  @ApiProperty({
    description: 'Résultat de la validation',
    enum: AccessStatus
  })
  result: AccessStatus;

  @ApiProperty({
    description: 'Si l\'accès est accordé'
  })
  access_granted: boolean;

  @ApiProperty({
    description: 'ID de validation unique'
  })
  validation_id: string;

  @ApiPropertyOptional({
    description: 'Raison du refus',
    enum: DenialReason
  })
  denial_reason?: DenialReason;

  @ApiPropertyOptional({
    description: 'Détails du refus',
    type: DenialDetailsDto
  })
  denial_details?: DenialDetailsDto;

  @ApiPropertyOptional({
    description: 'Droit d\'accès',
    type: AccessRightDto
  })
  access_right?: AccessRightDto;

  @ApiPropertyOptional({
    description: 'Informations utilisateur',
    type: UserInfoDto
  })
  user_info?: UserInfoDto;

  @ApiPropertyOptional({
    description: 'Informations événement',
    type: EventInfoDto
  })
  event_info?: EventInfoDto;

  @ApiPropertyOptional({
    description: 'Informations abonnement',
    type: SubscriptionInfoDto
  })
  subscription_info?: SubscriptionInfoDto;

  @ApiPropertyOptional({
    description: 'Contexte de sécurité',
    type: SecurityContextDto
  })
  security_context?: SecurityContextDto;

  @ApiPropertyOptional({
    description: 'Actions suggérées'
  })
  suggested_actions?: string[];

  @ApiPropertyOptional({
    description: 'Informations de contact'
  })
  contact_info?: {
    supervisor_phone: string;
    customer_service: string;
  };

  @ApiPropertyOptional({
    description: 'Conditions d\'accès',
    type: [ConditionalAccessDto]
  })
  conditions?: ConditionalAccessDto[];

  @ApiPropertyOptional({
    description: 'Instructions spéciales'
  })
  special_instructions?: string[];

  @ApiProperty({
    description: 'Temps de validation en millisecondes'
  })
  validation_time_ms: number;
}

export class AccessControlResponseDto {
  @ApiProperty({
    description: 'Succès de l\'opération'
  })
  success: boolean;

  @ApiProperty({
    description: 'Données de réponse',
    type: AccessControlValidationResponseDto
  })
  data: AccessControlValidationResponseDto;

  @ApiProperty({
    description: 'Horodatage de la réponse'
  })
  timestamp: string;
}
