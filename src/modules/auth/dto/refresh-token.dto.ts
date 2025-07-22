// src/modules/auth/dto/refresh-token.dto.ts
/**
 * DTO pour le rafraîchissement des tokens
 * 
 * Validation :
 * - Refresh token requis et format JWT
 * - Vérification longueur et caractères autorisés
 * 
 * Utilisation :
 * - Endpoint POST /auth/refresh
 * - Renouvellement access token
 * - Maintien de session active
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  IsString, 
  IsNotEmpty, 
  Matches,
  MaxLength
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  /**
   * Refresh token JWT
   */
  @ApiProperty({
    description: 'Refresh token JWT pour renouveler l\'access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$',
  })
  @IsString({ 
    message: 'Le refresh token doit être une chaîne de caractères' 
  })
  @IsNotEmpty({ 
    message: 'Le refresh token est requis' 
  })
  @MaxLength(2048, { 
    message: 'Le refresh token ne peut pas dépasser 2048 caractères' 
  })
  @Matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, {
    message: 'Le refresh token doit être au format JWT valide'
  })
  refreshToken: string;
}