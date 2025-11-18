// src/modules/subscription-sales/dto/convert-anonymous-subscription.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO réutilisé
import { CustomerInfoDto } from './create-subscription-sale.dto';

/**
 * DTO pour conversion d'abonnement anonyme vers client enregistré
 */
export class ConvertAnonymousSubscriptionDto {
  @ApiProperty({
    description: 'Clé d\'onboarding imprimée au dos de la carte physique',
    example: 'ONB_2025_ABC_XYZ123',
    minLength: 10,
    maxLength: 50,
  })
  @IsString({ message: 'La clé d\'onboarding doit être une chaîne de caractères' })
  @Length(10, 50, { message: 'La clé d\'onboarding doit contenir entre 10 et 50 caractères' })
  @Matches(/^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$/, { 
    message: 'Format de clé d\'onboarding invalide. Format attendu: ONB_YYYY_XXX_XXXXXXX' 
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  onboardingKey: string;

  @ApiProperty({
    description: 'Informations client pour création du compte',
    type: CustomerInfoDto,
  })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiPropertyOptional({
    description: 'Mot de passe pour le compte (optionnel, généré automatiquement si non fourni)',
    example: 'MonMotDePasse123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @Length(8, 128, { message: 'Le mot de passe doit contenir entre 8 et 128 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { 
      message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial' 
    }
  )
  password?: string;
}