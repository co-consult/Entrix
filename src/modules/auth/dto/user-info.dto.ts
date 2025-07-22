// src/modules/auth/dto/user-info.dto.ts
/**
 * DTO pour informations utilisateur
 * 
 * Structure :
 * - Informations de base utilisateur
 * - Status de vérifications
 * - Rôles et permissions
 * - Métadonnées d'authentification
 * 
 * Utilisation :
 * - Réponse endpoint /auth/me
 * - Données utilisateur dans AuthResponse
 * - Profil utilisateur courant
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserRoleDto {
  @ApiProperty({ 
    description: 'ID du rôle',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Code du rôle',
    example: 'USER' 
  })
  code: string;

  @ApiProperty({ 
    description: 'Nom du rôle',
    example: 'Utilisateur' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Niveau hiérarchique du rôle',
    example: 10,
    minimum: 0,
    maximum: 100
  })
  level: number;

  @ApiProperty({ 
    description: 'Date d\'assignation du rôle',
    example: '2025-01-07T10:30:00.000Z' 
  })
  assignedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Date d\'expiration du rôle',
    example: '2026-01-07T10:30:00.000Z' 
  })
  validUntil?: Date;

  @ApiProperty({ 
    description: 'Statut du rôle',
    example: 'ACTIVE',
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'TERMINATED']
  })
  status: string;
}

export class UserInfoDto {
  /**
   * ID unique de l'utilisateur
   */
  @ApiProperty({
    description: 'Identifiant unique de l\'utilisateur',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  id: string;

  /**
   * Adresse email
   */
  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  /**
   * Prénom
   */
  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Mohamed',
  })
  firstName: string;

  /**
   * Nom de famille
   */
  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Ben Ali',
  })
  lastName: string;

  /**
   * URL de l'avatar
   */
  @ApiPropertyOptional({
    description: 'URL de la photo de profil',
    example: 'https://cdn.entrix.tn/avatars/user123.jpg',
    format: 'uri',
  })
  avatar?: string;

  /**
   * Compte actif
   */
  @ApiProperty({
    description: 'Indique si le compte utilisateur est actif',
    example: true,
  })
  isActive: boolean;

  /**
   * Email vérifié
   */
  @ApiPropertyOptional({
    description: 'Date de vérification de l\'email',
    example: '2025-01-07T10:30:00.000Z',
  })
  emailVerified?: Date;

  /**
   * Téléphone vérifié
   */
  @ApiPropertyOptional({
    description: 'Date de vérification du téléphone',
    example: '2025-01-07T11:15:00.000Z',
  })
  phoneVerified?: Date;

  /**
   * Rôles utilisateur
   */
  @ApiProperty({
    description: 'Liste des rôles assignés à l\'utilisateur',
    type: [UserRoleDto],
  })
  @Type(() => UserRoleDto)
  roles: UserRoleDto[];

  /**
   * Permissions agrégées
   */
  @ApiProperty({
    description: 'Liste des permissions de l\'utilisateur (agrégées depuis les rôles)',
    example: ['users.read.self', 'users.update.self', 'events.read'],
    type: [String],
  })
  permissions: string[];

  /**
   * Dernière connexion
   */
  @ApiPropertyOptional({
    description: 'Date et heure de la dernière connexion réussie',
    example: '2025-01-07T09:45:00.000Z',
  })
  lastLogin?: Date;

  /**
   * Date de création du compte
   */
  @ApiProperty({
    description: 'Date de création du compte',
    example: '2024-12-01T14:20:00.000Z',
  })
  createdAt: Date;

  /**
   * Dernière mise à jour
   */
  @ApiProperty({
    description: 'Date de dernière mise à jour du profil',
    example: '2025-01-07T10:30:00.000Z',
  })
  updatedAt: Date;

  /**
   * Statut de vérification global
   */
  @ApiProperty({
    description: 'Statut de vérification global du compte',
    example: 'PARTIALLY_VERIFIED',
    enum: ['UNVERIFIED', 'PARTIALLY_VERIFIED', 'FULLY_VERIFIED'],
  })
  verificationStatus: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'FULLY_VERIFIED';

  /**
   * MFA activé
   */
  @ApiProperty({
    description: 'Indique si l\'authentification multi-facteurs est activée',
    example: true,
  })
  mfaEnabled: boolean;

  /**
   * Nombre de sessions actives
   */
  @ApiProperty({
    description: 'Nombre de sessions actives de l\'utilisateur',
    example: 2,
    minimum: 0,
  })
  activeSessions: number;

  /**
   * Préférences utilisateur (résumé)
   */
  @ApiPropertyOptional({
    description: 'Préférences de base de l\'utilisateur',
    example: {
      language: 'fr',
      timezone: 'Africa/Tunis',
      notifications: true,
      newsletter: false
    },
  })
  preferences?: {
    language: string;
    timezone: string;
    notifications: boolean;
    newsletter: boolean;
  };
}