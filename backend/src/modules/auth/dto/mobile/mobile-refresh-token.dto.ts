import { 
  IsString, 
  IsNotEmpty 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO Mobile Refresh Token Request Entrix V3.0
 * Renouvellement de token pour mobile
 */

export class MobileRefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement',
    example: 'refresh_token_123456789'
  })
  @IsString()
  @IsNotEmpty({ message: 'Token de rafraîchissement requis' })
  refreshToken: string;
} 