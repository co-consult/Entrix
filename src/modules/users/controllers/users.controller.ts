// src/modules/users/controllers/users.controller.ts

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
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import { UserSearchDto } from '../dto/users/user-search.dto';
import { UpdatePrivacyDto } from '../dto/users/update-privacy.dto';
import { UserPreferencesDto } from '../dto/users/user-preferences.dto';

// Services
import { UsersService } from '../services/users.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Decorators
import { CurrentUser } from '../decorators/current-user.decorator';

// Types et interfaces
import { UserResponse } from '../types/user.types';
import { 
  UserSearchParams, 
  UserFilters, 
  PaginationParams,
  UserStats,
  UserGroupInfo,
  UserRoleInfo 
} from '../interfaces/user.interface';

// Types de réponse partagés
import { 
  StandardResponse, 
  PaginatedResponse, 
  CreatedResponse, 
  UpdatedResponse, 
  DeletedResponse 
} from '../types/response.types';

// Exceptions
import { 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur',
    description: 'Créer un compte utilisateur avec les informations de base',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
  })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<CreatedResponse<UserResponse>> {
    try {
      const user = await this.usersService.create({
        email: dto.email,
        password: dto.password,
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone,
        avatar: dto.avatar,
        isActive: dto.is_active ?? true,
        emailVerified: dto.email_verified ?? false,
        phoneVerified: dto.phone_verified ?? false,
        metadata: dto.metadata,
      });
      
      return { 
        success: true, 
        data: user, 
        message: 'Utilisateur créé avec succès' 
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email déjà utilisé');
      }
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Rechercher des utilisateurs',
    description: 'Rechercher et filtrer la liste des utilisateurs',
  })
  @ApiQuery({ name: 'query', required: false, description: 'Terme de recherche', example: 'ahmed' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 20 })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif', example: true })
  @ApiQuery({ name: 'emailVerified', required: false, description: 'Filtrer par email vérifié', example: true })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrer par pays', example: 'TN' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  async searchUsers(@Query() searchDto: UserSearchDto): Promise<PaginatedResponse<UserResponse>> {
    const searchParams: UserSearchParams = {
      query: searchDto.query,
      filters: {
        isActive: searchDto.is_active,
        emailVerified: searchDto.email_verified,
        phoneVerified: searchDto.phone_verified,
        country: searchDto.country,
        city: searchDto.city,
        language: searchDto.language,
        createdAfter: searchDto.createdAfter ? new Date(searchDto.createdAfter) : undefined,
        createdBefore: searchDto.createdBefore ? new Date(searchDto.createdBefore) : undefined,
      },
      pagination: {
        page: searchDto.page || 1,
        limit: searchDto.limit || 20,
      },
      sorting: searchDto.sortBy && searchDto.sortOrder
        ? { field: searchDto.sortBy, order: searchDto.sortOrder }
        : undefined,
    };

    const result = await this.usersService.search(searchParams);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtenir mon profil',
    description: 'Récupérer les informations de l\'utilisateur connecté',
  })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getMyProfile(@CurrentUser() user: UserResponse): Promise<StandardResponse<UserResponse>> {
    const fullUser = await this.usersService.findById(user.id);
    
    if (!fullUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return {
      success: true,
      data: fullUser,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Statistiques des utilisateurs',
    description: 'Obtenir les statistiques générales des utilisateurs',
  })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getUserStats(@Query() filters?: UserFilters): Promise<StandardResponse<UserStats>> {
    const stats = await this.usersService.getStats(filters);
    
    return {
      success: true,
      data: stats,
    };
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Liste de tous les rôles', description: 'Récupérer tous les rôles disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des rôles' })
  async getAllRoles() {
    const roles = await this.prisma.roles.findMany({
      select: { id: true, code: true, name: true, description: true, is_active: true }
    });
    return { success: true, data: roles };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtenir un utilisateur par ID',
    description: 'Récupérer les détails d\'un utilisateur spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<StandardResponse<UserResponse>> {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return {
      success: true,
      data: user,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description: 'Modifier les informations d\'un utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdatedResponse<UserResponse>> {
    const user = await this.usersService.update(id, {
      firstName: dto.first_name,
      lastName: dto.last_name,
      phone: dto.phone,
      avatar: dto.avatar,
      isActive: dto.is_active,
      emailVerified: dto.email_verified,
      phoneVerified: dto.phone_verified,
      metadata: dto.metadata,
    });
    
    return {
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    };
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour mon profil',
    description: 'Modifier les informations de mon profil',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  async updateMyProfile(
    @CurrentUser() user: UserResponse,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdatedResponse<UserResponse>> {
    const updatedUser = await this.usersService.update(user.id, {
      firstName: dto.first_name,
      lastName: dto.last_name,
      phone: dto.phone,
      avatar: dto.avatar,
      metadata: dto.metadata,
    });
    
    return {
      success: true,
      data: updatedUser,
      message: 'Profil mis à jour avec succès',
    };
  }

  @Put('me/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour mes paramètres de confidentialité',
    description: 'Modifier les paramètres de confidentialité de mon compte',
  })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour' })
  async updatePrivacySettings(
    @CurrentUser() user: UserResponse,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<UpdatedResponse<UserResponse>> {
    const updatedUser = await this.usersService.update(user.id, {
      metadata: {
        ...user.metadata,
        privacy: dto,
      },
    });
    
    return {
      success: true,
      data: updatedUser,
      message: 'Paramètres de confidentialité mis à jour',
    };
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour mes préférences',
    description: 'Modifier les préférences utilisateur',
  })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour' })
  async updatePreferences(
    @CurrentUser() user: UserResponse,
    @Body() dto: UserPreferencesDto,
  ): Promise<UpdatedResponse<UserResponse>> {
    const updatedUser = await this.usersService.update(user.id, {
      metadata: {
        ...user.metadata,
        preferences: dto,
      },
    });
    
    return {
      success: true,
      data: updatedUser,
      message: 'Préférences mises à jour',
    };
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Activer un utilisateur',
    description: 'Réactiver un compte utilisateur désactivé',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur activé' })
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id', ParseUUIDPipe) id: string): Promise<UpdatedResponse<UserResponse>> {
    const user = await this.usersService.activate(id);
    
    return {
      success: true,
      data: user,
      message: 'Utilisateur activé avec succès',
    };
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Désactiver un utilisateur',
    description: 'Désactiver temporairement un compte utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur désactivé' })
  @HttpCode(HttpStatus.OK)
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string): Promise<UpdatedResponse<UserResponse>> {
    const user = await this.usersService.deactivate(id);
    
    return {
      success: true,
      data: user,
      message: 'Utilisateur désactivé avec succès',
    };
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Vérifier un utilisateur',
    description: 'Marquer un utilisateur comme vérifié',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur vérifié' })
  @HttpCode(HttpStatus.OK)
  async verifyUser(@Param('id', ParseUUIDPipe) id: string): Promise<UpdatedResponse<UserResponse>> {
    const user = await this.usersService.verify(id);
    
    return {
      success: true,
      data: user,
      message: 'Utilisateur vérifié avec succès',
    };
  }

  @Get(':id/groups')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Groupes d\'un utilisateur',
    description: 'Récupérer la liste des groupes d\'un utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des groupes de l\'utilisateur' })
  async getUserGroups(@Param('id', ParseUUIDPipe) id: string): Promise<StandardResponse<UserGroupInfo[]>> {
    const groups = await this.usersService.getUserGroups(id);

    return {
      success: true,
      data: groups,
    };
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Rôles d\'un utilisateur',
    description: 'Récupérer la liste des rôles d\'un utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des rôles de l\'utilisateur' })
  async getUserRoles(@Param('id', ParseUUIDPipe) id: string): Promise<StandardResponse<UserRoleInfo[]>> {
    const roles = await this.usersService.getUserRoles(id);

    return {
      success: true,
      data: roles,
    };
  }

  @Put(':id/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: 'Modifier le mot de passe d\'un utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() passwordData: { oldPassword: string; newPassword: string },
    @CurrentUser() currentUser: UserResponse,
  ): Promise<UpdatedResponse<UserResponse>> {
    // Un utilisateur ne peut changer que son propre mot de passe
    if (currentUser.id !== id) {
      throw new ForbiddenException('Vous ne pouvez changer que votre propre mot de passe');
    }

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      throw new BadRequestException('Ancien et nouveau mot de passe requis');
    }

    const updatedUser = await this.usersService.changePassword(
      id,
      passwordData.oldPassword,
      passwordData.newPassword,
    );

    return {
      success: true,
      data: updatedUser,
      message: 'Mot de passe modifié avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description: 'Supprimer définitivement un compte utilisateur',
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<DeletedResponse> {
    await this.usersService.delete(id);
    
    return {
      success: true,
      data: null,
      message: 'Utilisateur supprimé avec succès',
    };
  }
}