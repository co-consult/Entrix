import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  PUBLISHED = 'PUBLISHED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
  SUSPENDED = 'SUSPENDED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum EventType {
  SPORTS_MATCH = 'SPORTS_MATCH',
  TOURNAMENT = 'TOURNAMENT',
  CHAMPIONSHIP = 'CHAMPIONSHIP',
  CONCERT = 'CONCERT',
  THEATER = 'THEATER',
  EXHIBITION = 'EXHIBITION',
  FESTIVAL = 'FESTIVAL',
  CONFERENCE = 'CONFERENCE',
  SEMINAR = 'SEMINAR',
  NETWORKING = 'NETWORKING',
  TRADE_SHOW = 'TRADE_SHOW',
  COMMUNITY = 'COMMUNITY',
  CHARITY = 'CHARITY',
  FAMILY = 'FAMILY',
  EDUCATIONAL = 'EDUCATIONAL',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
  INTERACTIVE = 'INTERACTIVE',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
  ORGANIZER_ONLY = 'ORGANIZER_ONLY',
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Event display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Event subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ enum: EventType, description: 'Event type' })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ description: 'Event category' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Event subcategory' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Venue ID' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Mapping ID' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID()
  mappingId?: string;

  @ApiProperty({ description: 'Scheduled start date' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ description: 'Scheduled end date' })
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional({ description: 'Doors open time' })
  @IsOptional()
  @IsDateString()
  doorsOpen?: string;

  @ApiPropertyOptional({ description: 'Check-in start time' })
  @IsOptional()
  @IsDateString()
  checkInStart?: string;

  @ApiPropertyOptional({ description: 'Total capacity' })
  @IsOptional()
  @IsNumber()
  capacityTotal?: number;

  @ApiPropertyOptional({ description: 'Ticket sales start date' })
  @IsOptional()
  @IsDateString()
  ticketSalesStart?: string;

  @ApiPropertyOptional({ description: 'Ticket sales end date' })
  @IsOptional()
  @IsDateString()
  ticketSalesEnd?: string;

  @ApiPropertyOptional({ description: 'Early bird end date' })
  @IsOptional()
  @IsDateString()
  earlyBirdEnd?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  featuredImageUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Gallery URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Event display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Event subtitle' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ enum: EventType, description: 'Event type' })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ description: 'Event category' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Event subcategory' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Venue ID' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Mapping ID' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID()
  mappingId?: string;

  @ApiPropertyOptional({ description: 'Scheduled start date' })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional({ description: 'Scheduled end date' })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiPropertyOptional({ description: 'Doors open time' })
  @IsOptional()
  @IsDateString()
  doorsOpen?: string;

  @ApiPropertyOptional({ description: 'Check-in start time' })
  @IsOptional()
  @IsDateString()
  checkInStart?: string;

  @ApiPropertyOptional({ description: 'Total capacity' })
  @IsOptional()
  @IsNumber()
  capacityTotal?: number;

  @ApiPropertyOptional({ description: 'Ticket sales start date' })
  @IsOptional()
  @IsDateString()
  ticketSalesStart?: string;

  @ApiPropertyOptional({ description: 'Ticket sales end date' })
  @IsOptional()
  @IsDateString()
  ticketSalesEnd?: string;

  @ApiPropertyOptional({ description: 'Early bird end date' })
  @IsOptional()
  @IsDateString()
  earlyBirdEnd?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  featuredImageUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Gallery URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}

export class EventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Event name' })
  name: string;

  @ApiPropertyOptional({ description: 'Event display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Event subtitle' })
  subtitle?: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiPropertyOptional({ description: 'Short description' })
  shortDescription?: string;

  @ApiPropertyOptional({ enum: EventType, description: 'Event type' })
  type?: EventType;

  @ApiProperty({ description: 'Event category name' })
  category: string;

  @ApiPropertyOptional({ description: 'Event category ID' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Event category code' })
  categoryCode?: string;

  @ApiPropertyOptional({ description: 'Primary color associated with the category' })
  categoryColorPrimary?: string;

  @ApiPropertyOptional({ description: 'Secondary color associated with the category' })
  categoryColorSecondary?: string;

  @ApiPropertyOptional({ description: 'Event subcategory' })
  subcategory?: string;

  @ApiProperty({ description: 'Venue ID' })
  venueId: string;

  @ApiProperty({ description: 'Venue name' })
  venueName: string;

  @ApiProperty({ description: 'Scheduled start date' })
  scheduledStart: string;

  @ApiProperty({ description: 'Scheduled end date' })
  scheduledEnd: string;

  @ApiPropertyOptional({ description: 'Doors open time' })
  doorsOpen?: string;

  @ApiPropertyOptional({ description: 'Check-in start time' })
  checkInStart?: string;

  @ApiPropertyOptional({ description: 'Total capacity' })
  capacityTotal?: number;

  @ApiProperty({ description: 'Current capacity (sold tickets)' })
  capacityCurrent: number;

  @ApiPropertyOptional({ description: 'Ticket sales start date' })
  ticketSalesStart?: string;

  @ApiPropertyOptional({ description: 'Ticket sales end date' })
  ticketSalesEnd?: string;

  @ApiPropertyOptional({ description: 'Early bird end date' })
  earlyBirdEnd?: string;

  @ApiProperty({ enum: EventStatus, description: 'Event status' })
  status: EventStatus;

  @ApiProperty({ enum: EventVisibility, description: 'Event visibility' })
  visibility: EventVisibility;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  featuredImageUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Gallery URLs' })
  galleryUrls?: string[];

  @ApiPropertyOptional({ description: 'Tags' })
  tags?: string[];

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;
}

export class EventFiltersDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EventType, description: 'Event type filter' })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: EventStatus, description: 'Status filter' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Venue ID filter' })
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;
}
