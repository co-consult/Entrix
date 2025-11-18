// src/modules/users/dto/profiles/upload-avatar.dto.ts

import {
    IsOptional,
    IsBoolean,
    IsIn,
    IsString,
  } from 'class-validator';
  import { ApiPropertyOptional } from '@nestjs/swagger';
  import { USER_CONSTANTS } from '../../constants/user.constants';
  
  export class UploadAvatarDto {
    @ApiPropertyOptional({
      description: 'Remplacer l\'avatar existant',
      example: true,
      default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'replace doit être un booléen' })
    replace?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Générer automatiquement les différentes tailles',
      example: true,
      default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'generateSizes doit être un booléen' })
    generateSizes?: boolean = true;
  
    @ApiPropertyOptional({
      description: 'Format de sortie souhaité',
      example: 'webp',
      enum: USER_CONSTANTS.AVATAR.ALLOWED_FORMATS,
    })
    @IsOptional()
    @IsString({ message: 'Le format doit être une chaîne de caractères' })
    @IsIn(USER_CONSTANTS.AVATAR.ALLOWED_FORMATS, {
      message: `Le format doit être l'un de: ${USER_CONSTANTS.AVATAR.ALLOWED_FORMATS.join(', ')}`,
    })
    outputFormat?: string = 'webp';
  
    @ApiPropertyOptional({
      description: 'Qualité de compression (1-100)',
      example: 85,
    })
    @IsOptional()
    quality?: number = 85;
  
    @ApiPropertyOptional({
      description: 'Conserver les métadonnées EXIF',
      example: false,
      default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'keepMetadata doit être un booléen' })
    keepMetadata?: boolean = false;
  }
  
  // DTO de réponse pour l'upload d'avatar
  export class UploadAvatarResponseDto {
    @ApiPropertyOptional({
      description: 'URL de l\'avatar original',
      example: 'https://cdn.entrix.tn/avatars/user123/original.webp',
    })
    originalUrl: string;
  
    @ApiPropertyOptional({
      description: 'URL de la vignette',
      example: 'https://cdn.entrix.tn/avatars/user123/thumbnail.webp',
    })
    thumbnailUrl: string;
  
    @ApiPropertyOptional({
      description: 'URLs des différentes tailles',
      example: {
        small: 'https://cdn.entrix.tn/avatars/user123/50x50.webp',
        medium: 'https://cdn.entrix.tn/avatars/user123/100x100.webp',
        large: 'https://cdn.entrix.tn/avatars/user123/200x200.webp',
        xlarge: 'https://cdn.entrix.tn/avatars/user123/400x400.webp',
      },
    })
    sizes: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  
    @ApiPropertyOptional({
      description: 'Date de l\'upload',
      example: '2025-07-17T10:30:00Z',
    })
    uploadedAt: string;
  
    @ApiPropertyOptional({
      description: 'Taille du fichier en octets',
      example: 125432,
    })
    fileSize: number;
  
    @ApiPropertyOptional({
      description: 'Type MIME du fichier',
      example: 'image/webp',
    })
    mimeType: string;
  
    @ApiPropertyOptional({
      description: 'Dimensions de l\'image originale',
      example: { width: 400, height: 400 },
    })
    dimensions: {
      width: number;
      height: number;
    };
  }