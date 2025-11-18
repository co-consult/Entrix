// src/modules/users/controllers/anonymous.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

// DTOs
import { CreateAnonymousDto } from '../dto/anonymous/create-anonymous.dto';
import { ConvertAnonymousDto } from '../dto/anonymous/convert-anonymous.dto';

// Services
import { AnonymousService } from '../services/anonymous.service';

// Decorators
import { CurrentUser } from '../decorators/current-user.decorator';

// Types et interfaces
import { UserResponse } from '../types/user.types';
import { 
  AnonymousUser,
  CreateAnonymousData,
  ConversionData,
  ConversionResult,
  OnboardingKeyValidation,
  OnboardingKeyData,
  ConversionStats,
  AnonymousStats 
} from '../interfaces/anonymous.interface';
import { IncentiveType } from '../types/enums';

// Types de réponse partagés
import { 
  StandardResponse, 
  CreatedResponse, 
  UpdatedResponse 
} from '../types/response.types';

// Exceptions
import { 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';

@ApiTags('Anonymous Users')
@Controller('anonymous')
export class AnonymousController {
  constructor(
    private readonly anonymousService: AnonymousService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un utilisateur anonyme',
    description: 'Créer un utilisateur anonyme avec clé d\'onboarding optionnelle',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur anonyme créé avec succès',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAnonymousDto: CreateAnonymousDto): Promise<CreatedResponse<AnonymousUser>> {
    try {
      const createData: CreateAnonymousData = {
        guestName: createAnonymousDto.guestName,
        guestEmail: createAnonymousDto.guestEmail,
        guestPhone: createAnonymousDto.guestPhone,
        //incentiveType: createAnonymousDto.incentiveType,
        incentiveValue: createAnonymousDto.incentiveValue,
        incentiveDescription: createAnonymousDto.incentiveDescription,
        expiresAt: createAnonymousDto.expiresAt ? new Date(createAnonymousDto.expiresAt) : undefined,
        metadata: createAnonymousDto.metadata,
      };

      const anonymousUser = await this.anonymousService.createAnonymousUser(createData);

      return {
        success: true,
        data: anonymousUser,
        message: 'Utilisateur anonyme créé avec succès',
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email déjà utilisé');
      }
      throw error;
    }
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'Rechercher par email',
    description: 'Trouver un utilisateur anonyme par son email',
  })
  @ApiParam({
    name: 'email',
    description: 'Email de l\'utilisateur anonyme',
    example: 'temp@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur anonyme trouvé ou null',
  })
  async findByEmail(@Param('email') email: string): Promise<StandardResponse<AnonymousUser | null>> {
    const anonymousUser = await this.anonymousService.findByEmail(email);

    return {
      success: true,
      data: anonymousUser,
    };
  }

  @Get('onboarding/:key')
  @ApiOperation({
    summary: 'Rechercher par clé d\'onboarding',
    description: 'Trouver un utilisateur anonyme par sa clé d\'onboarding',
  })
  @ApiParam({
    name: 'key',
    description: 'Clé d\'onboarding',
    example: 'ONB_2025_EVT_XY9Z23',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur anonyme trouvé ou null',
  })
  async findByOnboardingKey(@Param('key') key: string): Promise<StandardResponse<AnonymousUser | null>> {
    const anonymousUser = await this.anonymousService.findByOnboardingKey(key);

    return {
      success: true,
      data: anonymousUser,
    };
  }

  @Post('convert')
  @ApiOperation({
    summary: 'Convertir en utilisateur enregistré',
    description: 'Convertir un utilisateur anonyme en compte utilisateur complet',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion réussie',
  })
  @ApiResponse({
    status: 400,
    description: 'Données de conversion invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Clé d\'onboarding introuvable',
  })
  @HttpCode(HttpStatus.OK)
  async convertToRegistered(@Body() convertDto: ConvertAnonymousDto): Promise<StandardResponse<ConversionResult>> {
    const conversionData: ConversionData = {
      onboardingKey: convertDto.onboardingKey,
      userData: {
        firstName: convertDto.firstName,
        lastName: convertDto.lastName,
        email: convertDto.email,
        phone: convertDto.phone,
        password: convertDto.password,
      },
      profileData: convertDto.profileData ? {
        city: convertDto.profileData.city,
        country: convertDto.profileData.country,
        language: convertDto.profileData.language,
        dateOfBirth: convertDto.profileData.dateOfBirth ? new Date(convertDto.profileData.dateOfBirth) : undefined,
        gender: convertDto.profileData.gender as 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY',
      } : undefined,
      acceptedTerms: convertDto.acceptedTerms,
      marketingConsent: convertDto.marketingConsent,
    };

    const result = await this.anonymousService.convertToRegistered(conversionData);

    return {
      success: true,
      data: result,
      message: result.success ? 'Conversion réussie' : 'Échec de la conversion',
    };
  }

  @Get('validate/:key')
  @ApiOperation({
    summary: 'Valider une clé d\'onboarding',
    description: 'Vérifier la validité d\'une clé d\'onboarding avant conversion',
  })
  @ApiParam({
    name: 'key',
    description: 'Clé d\'onboarding à valider',
    example: 'ONB_2025_EVT_XY9Z23',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la validation',
  })
  async validateOnboardingKey(@Param('key') key: string): Promise<StandardResponse<OnboardingKeyValidation>> {
    const validation = await this.anonymousService.validateOnboardingKey(key);

    return {
      success: true,
      data: validation,
    };
  }

  @Post('generate-key')
  @ApiOperation({
    summary: 'Générer une clé d\'onboarding',
    description: 'Créer une nouvelle clé d\'onboarding pour un utilisateur anonyme',
  })
  @ApiResponse({
    status: 201,
    description: 'Clé générée avec succès',
  })
  @HttpCode(HttpStatus.CREATED)
  async generateOnboardingKey(
    @Body() keyData: {
      anonymousUserId: string;
      incentiveType: IncentiveType;
      incentiveValue: number;
      description: string;
      expiresInHours?: number;
    },
  ): Promise<CreatedResponse<{ onboardingKey: string; expiresAt: Date }>> {
    const onboardingKeyData: OnboardingKeyData = {
      anonymousUserId: keyData.anonymousUserId,
      incentiveType: keyData.incentiveType,
      incentiveValue: keyData.incentiveValue,
      description: keyData.description,
      expiresInHours: keyData.expiresInHours,
    };

    const onboardingKey = await this.anonymousService.generateOnboardingKey(onboardingKeyData);

    const expiresAt = new Date(
      Date.now() + (keyData.expiresInHours || 168) * 60 * 60 * 1000
    );

    return {
      success: true,
      data: {
        onboardingKey,
        expiresAt,
      },
      message: 'Clé d\'onboarding générée avec succès',
    };
  }

  @Post('apply-incentive')
  @ApiOperation({
    summary: 'Appliquer un incentive',
    description: 'Appliquer un incentive à un utilisateur enregistré',
  })
  @ApiResponse({
    status: 200,
    description: 'Incentive appliqué avec succès',
  })
  @HttpCode(HttpStatus.OK)
  async applyIncentive(
    @Body() incentiveData: {
      userId: string;
      incentiveType: IncentiveType;
      value: number;
    },
  ): Promise<StandardResponse<null>> {
    await this.anonymousService.applyIncentive(
      incentiveData.userId,
      incentiveData.incentiveType,
      incentiveData.value,
    );

    return {
      success: true,
      data: null,
      message: 'Incentive appliqué avec succès',
    };
  }

  @Get('stats/conversion')
  @ApiOperation({
    summary: 'Statistiques de conversion',
    description: 'Obtenir les statistiques de conversion anonyme → enregistré',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date de début (ISO string)',
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Date de fin (ISO string)',
    example: '2025-12-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques de conversion',
  })
  async getConversionStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<StandardResponse<ConversionStats>> {
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to),
    } : undefined;

    const stats = await this.anonymousService.getConversionStats(dateRange);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('stats/general')
  @ApiOperation({
    summary: 'Statistiques générales des anonymes',
    description: 'Obtenir les statistiques générales des utilisateurs anonymes',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques générales',
  })
  async getAnonymousStats(): Promise<StandardResponse<AnonymousStats>> {
    const stats = await this.anonymousService.getAnonymousStats();

    return {
      success: true,
      data: stats,
    };
  }
}