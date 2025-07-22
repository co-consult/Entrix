// src/modules/auth/dto/logout.dto.ts
/**
 * DTO pour déconnexion utilisateur
 * 
 * Paramètres optionnels :
 * - Session spécifique à terminer
 * - Révocation des tokens
 * - Nettoyage cache
 * 
 * Utilisation :
 * - Déconnexion session courante
 * - Déconnexion session spécifique
 * - Déconnexion forcée par admin
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsOptional, 
  IsString, 
  IsUUID,
  MaxLength
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  /**
   * ID de session spécifique à terminer (optionnel)
   */
  @ApiPropertyOptional({
    description: 'ID de session spécifique à terminer. Si non fourni, termine la session courante',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsString({ 
    message: 'L\'ID de session doit être une chaîne de caractères' 
  })
  @IsUUID(4, { 
    message: 'L\'ID de session doit être un UUID valide' 
  })
  sessionId?: string;

  /**
   * Refresh token à révoquer (optionnel)
   */
  @ApiPropertyOptional({
    description: 'Refresh token à révoquer explicitement',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString({ 
    message: 'Le refresh token doit être une chaîne de caractères' 
  })
  @MaxLength(2048, { 
    message: 'Le refresh token ne peut pas dépasser 2048 caractères' 
  })
  refreshToken?: string;
}