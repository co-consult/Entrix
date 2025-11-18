import { 
  IsString, 
  IsNotEmpty 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO Mobile Validate Token Request Entrix V3.0
 * Validation de token pour mobile
 */

export class MobileValidateTokenDto {
  @ApiProperty({
    description: 'Token d\'accès à valider',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty({ message: 'Token d\'accès requis' })
  accessToken: string;
} 