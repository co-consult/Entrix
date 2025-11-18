// src/modules/users/dto/users/user-search.dto.ts

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../../constants/user.constants';

export class UserSearchDto {
  @ApiPropertyOptional({
    description: 'Terme de recherche (nom, prénom, email)',
    example: 'Ahmed',
    minLength: USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'La requête doit être une chaîne de caractères' })
  @MinLength(USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH, {
    message: `La recherche doit contenir au moins ${USER_CONSTANTS.SEARCH.MIN_QUERY_LENGTH} caractères`,
  })
  @Transform(({ value }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par email vérifié',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'email_verified doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  email_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par téléphone vérifié',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'phone_verified doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  phone_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par rôle (code du rôle)',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString({ message: 'Le rôle doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  role?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ville',
    example: 'Tunis',
  })
  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par pays (code ISO)',
    example: 'TN',
  })
  @IsOptional()
  @IsString({ message: 'Le pays doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  country?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par langue',
    example: 'fr',
  })
  @IsOptional()
  @IsString({ message: 'La langue doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  language?: string;

  @ApiPropertyOptional({
    description: 'Date de création après',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD)' })
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Date de création avant',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD)' })
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Inclure le profil utilisateur',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeProfile doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeProfile?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les groupes utilisateur',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeGroups doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeGroups?: boolean = false;

  @ApiPropertyOptional({
    description: 'Inclure les rôles utilisateur',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeRoles doit être un booléen' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRoles?: boolean = false;

  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un nombre entier' })
  @Min(1, { message: 'La page doit être supérieure à 0' })
  page?: number = USER_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  limit?: number = USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'created_at',
    enum: USER_CONSTANTS.SORTABLE_FIELDS,
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  @IsIn(USER_CONSTANTS.SORTABLE_FIELDS, {
    message: `Le champ de tri doit être l'un de: ${USER_CONSTANTS.SORTABLE_FIELDS.join(', ')}`,
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être une chaîne de caractères' })
  @IsIn(['asc', 'desc'], {
    message: 'L\'ordre de tri doit être "asc" ou "desc"',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}