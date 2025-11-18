// src/modules/users/controllers/profiles.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';

// DTOs - SEULEMENT ceux qui existent vraiment
import { CreateProfileDto } from '../dto/profiles/create-profile.dto';
import { UpdateProfileDto } from '../dto/profiles/update-profile.dto';
import { 
  UploadAvatarDto, 
  UploadAvatarResponseDto,
} from '../dto/profiles/upload-avatar.dto';

// Services
import { ProfilesService } from '../services/profiles.service';
import { LoggerService } from '../../../shared/logger/logger.service';

// Guards et decorators (seront créés plus tard)
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../decorators/current-user.decorator';

// Types
import { UserResponse } from '../types/user.types';

// Types de réponse simples (au lieu des DTOs Response inexistants)
interface SimpleResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Contrôleur Grade A+ pour la gestion des profils utilisateurs
 * Utilise SEULEMENT les méthodes qui existent vraiment dans ProfilesService
 */
@ApiTags('Profiles')
@Controller('profiles')
// @ApiBearerAuth() // À décommenter quand les guards seront créés
// @UseGuards(JwtAuthGuard) // À décommenter
export class ProfilesController {
  private readonly logger: LoggerService;

  constructor(
    private readonly profilesService: ProfilesService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ProfilesController');
  }

  /**
   * Créer un profil utilisateur
   * Utilise: profilesService.create(CreateProfileDto)
   */
  @Post()
  @ApiOperation({
    summary: 'Créer un profil utilisateur',
    description: 'Créer le profil complet d\'un utilisateur avec ses informations personnelles',
  })
  @ApiBody({ type: CreateProfileDto })
  @ApiResponse({ status: 201, description: 'Profil créé avec succès' })
  @ApiResponse({ status: 409, description: 'Un profil existe déjà pour cet utilisateur' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async create(
    @Body() createProfileDto: CreateProfileDto,
    @Req() req: Request,
    // @CurrentUser() currentUser: UserResponse, // À décommenter
  ): Promise<SimpleResponse<any>> {
    const operationId = this.logger.startOperation('createProfile', {
      userId: createProfileDto.userId,
      hasDateOfBirth: !!createProfileDto.dateOfBirth,
      hasAddress: !!createProfileDto.city,
    });

    try {
      this.logger.info('Creating user profile', JSON.stringify({
        userId: createProfileDto.userId,
        country: createProfileDto.country,
        language: createProfileDto.language,
      }));

      // TODO: Vérifier que l'utilisateur actuel peut créer ce profil
      // if (currentUser.id !== createProfileDto.userId && !currentUser.isAdmin) {
      //   throw new ForbiddenException('Non autorisé à créer ce profil');
      // }

      // Vérifier si un profil existe déjà - VRAIE méthode
      const existingProfile = await this.profilesService.findByUserId(createProfileDto.userId);
      if (existingProfile) {
        this.logger.warn('Profile already exists', JSON.stringify({
          userId: createProfileDto.userId,
        }));
        throw new ConflictException('Un profil existe déjà pour cet utilisateur');
      }

      // Créer le profil - VRAIE méthode
      const profile = await this.profilesService.create(createProfileDto);

      // Log de l'événement business
      this.logger.logBusinessEvent('PROFILE_CREATED', {
        profileId: profile.id,
        userId: profile.userId,
        country: profile.country,
        language: profile.language,
        completionPercentage: profile.completionPercentage,
      }, profile.userId);

      this.logger.endOperation('createProfile', operationId, true);

      return {
        success: true,
        data: profile,
        message: 'Profil créé avec succès',
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.create',
        createProfileDto.userId,
        JSON.stringify({ userId: createProfileDto.userId }),
      );

      this.logger.endOperation('createProfile', operationId, false);

      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException('Erreur lors de la création du profil');
    }
  }

  /**
   * Obtenir un profil par ID utilisateur
   * Utilise: profilesService.findByUserId(userId)
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Obtenir un profil par ID utilisateur',
    description: 'Récupérer le profil complet d\'un utilisateur',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  async getByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: Request,
  ): Promise<SimpleResponse<any>> {
    const operationId = this.logger.startOperation('getProfileByUserId', { userId });

    try {
      this.logger.info('Getting profile by user ID', JSON.stringify({ userId }));

      // VRAIE méthode du service
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException('Profil non trouvé');
      }

      this.logger.endOperation('getProfileByUserId', operationId, true);

      return {
        success: true,
        data: profile,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.getByUserId',
        userId,
        JSON.stringify({ userId }),
      );

      this.logger.endOperation('getProfileByUserId', operationId, false);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erreur lors de la récupération du profil');
    }
  }

  /**
   * Obtenir le statut de complétion du profil
   * Utilise: profilesService.getCompletionStatus(userId)
   */
  @Get('user/:userId/completion')
  @ApiOperation({
    summary: 'Obtenir le statut de complétion',
    description: 'Récupérer le pourcentage de complétion et les suggestions',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Statut de complétion' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  async getCompletion(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: Request,
  ): Promise<SimpleResponse<any>> {
    const operationId = this.logger.startOperation('getProfileCompletion', { userId });

    try {
      this.logger.info('Getting profile completion', JSON.stringify({ userId }));

      // VRAIE méthode du service avec userId
      const completion = await this.profilesService.getCompletionStatus(userId);
      if (!completion) {
        throw new NotFoundException('Profil non trouvé');
      }

      this.logger.endOperation('getProfileCompletion', operationId, true);

      return {
        success: true,
        data: completion,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.getCompletion',
        undefined,
        JSON.stringify({ userId }),
      );

      this.logger.endOperation('getProfileCompletion', operationId, false);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erreur lors de la récupération du statut de complétion');
    }
  }

  /**
   * Mettre à jour les préférences du profil
   * Utilise: profilesService.updatePreferences(userId, preferences)
   */
  @Put('user/:userId/preferences')
  @ApiOperation({
    summary: 'Mettre à jour les préférences',
    description: 'Mettre à jour les préférences d\'un profil utilisateur',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  async updatePreferences(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() preferences: Record<string, any>,
    @Req() req: Request,
    // @CurrentUser() currentUser: UserResponse, // À décommenter
  ): Promise<SimpleResponse<any>> {
    const operationId = this.logger.startOperation('updatePreferences', { 
      userId,
      preferencesKeys: Object.keys(preferences)
    });

    try {
      this.logger.info('Updating preferences', JSON.stringify({
        userId,
        preferencesKeys: Object.keys(preferences),
      }));

      // TODO: Vérifier les permissions
      // if (currentUser.id !== userId && !currentUser.isAdmin) {
      //   throw new ForbiddenException('Non autorisé à modifier ces préférences');
      // }

      // VRAIE méthode du service
      const updatedProfile = await this.profilesService.updatePreferences(userId, preferences);

      this.logger.logBusinessEvent('PREFERENCES_UPDATED', {
        userId,
        preferencesUpdated: Object.keys(preferences),
      }, userId);

      this.logger.endOperation('updatePreferences', operationId, true);

      return {
        success: true,
        data: updatedProfile,
        message: 'Préférences mises à jour avec succès',
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.updatePreferences',
        undefined,
        JSON.stringify({ userId, preferencesKeys: Object.keys(preferences) }),
      );

      this.logger.endOperation('updatePreferences', operationId, false);

      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException('Erreur lors de la mise à jour des préférences');
    }
  }

  /**
   * Supprimer un profil
   * Utilise: profilesService.delete(userId)
   */
  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un profil',
    description: 'Supprimer définitivement un profil utilisateur',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 204, description: 'Profil supprimé' })
  @ApiResponse({ status: 404, description: 'Profil non trouvé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à supprimer ce profil' })
  async remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: Request,
    // @CurrentUser() currentUser: UserResponse, // À décommenter
  ): Promise<void> {
    const operationId = this.logger.startOperation('deleteProfile', { userId });

    try {
      this.logger.info('Deleting profile', JSON.stringify({ userId }));

      // Vérifier que le profil existe avant suppression
      const profile = await this.profilesService.findByUserId(userId);
      if (!profile) {
        throw new NotFoundException('Profil non trouvé');
      }

      // TODO: Vérifier les permissions
      // if (currentUser.id !== userId && !currentUser.isAdmin) {
      //   throw new ForbiddenException('Non autorisé à supprimer ce profil');
      // }

      // VRAIE méthode du service avec userId
      await this.profilesService.delete(userId);

      this.logger.logBusinessEvent('PROFILE_DELETED', {
        userId,
      }, userId);

      this.logger.endOperation('deleteProfile', operationId, true);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.remove',
        undefined,
        JSON.stringify({ userId }),
      );

      this.logger.endOperation('deleteProfile', operationId, false);

      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException('Erreur lors de la suppression du profil');
    }
  }

  /**
   * NOTE: Les méthodes ci-dessous ne sont PAS implémentées car les méthodes
   * correspondantes n'existent pas dans ProfilesService :
   * 
   * - findById(id) -> N'EXISTE PAS
   * - update(id, data) -> N'EXISTE PAS
   * - uploadAvatar(id, file) -> N'EXISTE PAS
   * - removeAvatar(id) -> N'EXISTE PAS
   * 
   * Si ces fonctionnalités sont nécessaires, il faut d'abord les implémenter
   * dans ProfilesService avant de les ajouter au contrôleur.
   */

  /**
   * Rechercher des profils (utilise les filtres disponibles)
   */
  @Get()
  @ApiOperation({
    summary: 'Rechercher des profils',
    description: 'Rechercher et filtrer les profils utilisateurs',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrer par pays' })
  @ApiQuery({ name: 'language', required: false, description: 'Filtrer par langue' })
  @ApiQuery({ name: 'city', required: false, description: 'Filtrer par ville' })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 20 })
  @ApiResponse({ status: 200, description: 'Liste des profils' })
  async search(
    @Query() query: any,
    @Req() req: Request,
  ): Promise<SimpleResponse<any>> {
    const operationId = this.logger.startOperation('searchProfiles', {
      hasSearch: !!query.search,
      hasFilters: !!(query.country || query.language || query.city),
      page: query.page,
      limit: query.limit,
    });

    try {
      // NOTE: Cette méthode nécessiterait une méthode search() dans ProfilesService
      // qui n'existe peut-être pas encore. À implémenter si nécessaire.
      
      // Pour l'instant, on retourne une liste vide avec message informatif
      this.logger.warn('Search method not implemented in ProfilesService');
      
      this.logger.endOperation('searchProfiles', operationId, true);

      return {
        success: true,
        data: [],
        message: 'Fonctionnalité de recherche en cours d\'implémentation',
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ProfilesController.search',
        undefined,
        JSON.stringify({ query }),
      );

      this.logger.endOperation('searchProfiles', operationId, false);

      throw new InternalServerErrorException('Erreur lors de la recherche de profils');
    }
  }
}