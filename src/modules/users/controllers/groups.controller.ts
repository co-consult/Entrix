// src/modules/users/controllers/groups.controller.ts

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
import { CreateGroupDto } from '../dto/groups/create-group.dto';
import { UpdateGroupDto } from '../dto/groups/update-group.dto';
import { InviteMemberDto } from '../dto/groups/invite-member.dto';
import { UpdateMemberDto } from '../dto/groups/update-member.dto';

// Services
import { GroupsService } from '../services/groups.service';

// Decorators
import { CurrentUser } from '../decorators/current-user.decorator';

// Types et interfaces
import { UserResponse } from '../types/user.types';
import { Group, GroupWithMembers, GroupRole } from '../types/group.types';

// Types de réponse partagés
import { 
  StandardResponse, 
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

@ApiTags('Groups')
@Controller('groups')
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau groupe',
    description: 'Créer un groupe avec configuration et invitations initiales optionnelles',
  })
  @ApiResponse({
    status: 201,
    description: 'Groupe créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Code de groupe déjà utilisé',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: UserResponse,
  ): Promise<CreatedResponse<Group>> {
    try {
      const result = await this.groupsService.create(createGroupDto, user.id);

      return {
        success: true,
        data: result,
        message: 'Groupe créé avec succès',
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Code de groupe déjà utilisé');
      }
      throw error;
    }
  }

  @Get('my-groups')
  @ApiOperation({
    summary: 'Mes groupes',
    description: 'Récupérer tous les groupes dont je suis membre',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut de membership',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filtrer par rôle dans le groupe',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de mes groupes',
  })
  async getMyGroups(
    @CurrentUser() user: UserResponse,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<StandardResponse<Group[]>> {
    const groups = await this.groupsService.findUserGroups(user.id, {
      status,
      role,
      limit: limit || 20,
      offset: offset || 0,
    });

    return {
      success: true,
      data: groups,
    };
  }

  @Get('public')
  @ApiOperation({
    summary: 'Groupes publics',
    description: 'Rechercher dans les groupes publics disponibles',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Terme de recherche',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Type de groupe',
  })
  @ApiQuery({
    name: 'hasSpace',
    required: false,
    description: 'Groupes avec de la place disponible',
    type: 'boolean',
  })
  @ApiResponse({
    status: 200,
    description: 'Groupes publics trouvés',
  })
  async getPublicGroups(
    @Query('query') query?: string,
    @Query('type') type?: string,
    @Query('hasSpace') hasSpace?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<StandardResponse<Group[]>> {
    const groups = await this.groupsService.findPublicGroups({
      query,
      type,
      hasSpace: hasSpace === true,
      limit: limit || 20,
      offset: offset || 0,
    });

    return {
      success: true,
      data: groups,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détails d\'un groupe',
    description: 'Récupérer les informations détaillées d\'un groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du groupe',
  })
  @ApiResponse({
    status: 404,
    description: 'Groupe introuvable',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StandardResponse<GroupWithMembers>> {
    const group = await this.groupsService.findById(id);

    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }

    return {
      success: true,
      data: group,
    };
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Trouver un groupe par code',
    description: 'Récupérer un groupe via son code unique',
  })
  @ApiParam({
    name: 'code',
    description: 'Code du groupe',
    example: 'CA_SUPPORTERS_2025',
  })
  @ApiResponse({
    status: 200,
    description: 'Groupe trouvé',
  })
  @ApiResponse({
    status: 404,
    description: 'Groupe introuvable',
  })
  async findByCode(
    @Param('code') code: string,
  ): Promise<StandardResponse<Group>> {
    const group = await this.groupsService.findByCode(code);

    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }

    return {
      success: true,
      data: group,
    };
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Statistiques du groupe',
    description: 'Récupérer les statistiques détaillées d\'un groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques du groupe',
  })
  async getGroupStats(@Param('id', ParseUUIDPipe) id: string): Promise<StandardResponse<any>> {
    const stats = await this.groupsService.getGroupStats(id);

    return {
      success: true,
      data: stats,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour un groupe',
    description: 'Modifier les informations d\'un groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Groupe mis à jour',
  })
  @ApiResponse({
    status: 404,
    description: 'Groupe non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission insuffisante',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: UserResponse,
  ): Promise<UpdatedResponse<Group>> {
    const updatedGroup = await this.groupsService.update(id, updateGroupDto, user.id);

    return {
      success: true,
      data: updatedGroup,
      message: 'Groupe mis à jour avec succès',
    };
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Ajouter un membre au groupe',
    description: 'Ajouter un nouvel utilisateur au groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 201,
    description: 'Membre ajouté avec succès',
  })
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() memberData: { userId: string; role?: GroupRole },
    @CurrentUser() user: UserResponse,
  ): Promise<CreatedResponse<any>> {
    // Vérifier les permissions
    const canInvite = await this.groupsService.hasPermission(groupId, user.id, 'canInvite');
    if (!canInvite) {
      throw new ForbiddenException('Vous n\'avez pas la permission d\'ajouter des membres');
    }

    const member = await this.groupsService.addMember(
      groupId,
      memberData.userId,
      memberData.role || 'MEMBER',
      user.id,
    );

    return {
      success: true,
      data: member,
      message: 'Membre ajouté avec succès',
    };
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Retirer un membre du groupe',
    description: 'Supprimer un membre du groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur à retirer',
    example: 'user-789-012',
  })
  @ApiResponse({
    status: 200,
    description: 'Membre retiré avec succès',
  })
  async removeMember(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserResponse,
  ): Promise<StandardResponse<null>> {
    // Vérifier les permissions
    const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
    if (!canManageMembers) {
      throw new ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
    }

    await this.groupsService.removeMember(groupId, userId, user.id);

    return {
      success: true,
      data: null,
      message: 'Membre retiré avec succès',
    };
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({
    summary: 'Modifier le rôle d\'un membre',
    description: 'Changer le rôle d\'un membre dans le groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: 'user-789-012',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour avec succès',
  })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() roleData: { newRole: GroupRole },
    @CurrentUser() user: UserResponse,
  ): Promise<UpdatedResponse<any>> {
    // Vérifier les permissions
    const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
    if (!canManageMembers) {
      throw new ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
    }

    const result = await this.groupsService.updateMemberRole(
      groupId,
      userId,
      roleData.newRole,
      user.id,
    );

    return {
      success: true,
      data: result,
      message: 'Rôle mis à jour avec succès',
    };
  }

  @Put(':id/members/:userId/permissions')
  @ApiOperation({
    summary: 'Modifier les permissions d\'un membre',
    description: 'Mettre à jour les permissions spécifiques d\'un membre',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: 'user-789-012',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions mises à jour avec succès',
  })
  async updateMemberPermissions(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() permissionsData: { permissions: any },
    @CurrentUser() user: UserResponse,
  ): Promise<UpdatedResponse<any>> {
    // Vérifier les permissions
    const canManageMembers = await this.groupsService.hasPermission(groupId, user.id, 'canManageMembers');
    if (!canManageMembers) {
      throw new ForbiddenException('Vous n\'avez pas la permission de gérer les membres');
    }

    const result = await this.groupsService.updateMemberPermissions(
      groupId,
      userId,
      permissionsData.permissions,
      user.id,
    );

    return {
      success: true,
      data: result,
      message: 'Permissions mises à jour avec succès',
    };
  }

  @Post(':id/invite')
  @ApiOperation({
    summary: 'Inviter un utilisateur',
    description: 'Envoyer une invitation à rejoindre le groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation envoyée',
  })
  @HttpCode(HttpStatus.OK)
  async inviteUser(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() inviteData: { email?: string; userId?: string; role?: GroupRole; message?: string },
    @CurrentUser() user: UserResponse,
  ): Promise<StandardResponse<any>> {
    // Vérifier les permissions
    const canInvite = await this.groupsService.hasPermission(groupId, user.id, 'canInvite');
    if (!canInvite) {
      throw new ForbiddenException('Vous n\'avez pas la permission d\'inviter des membres');
    }

    const result = await this.groupsService.inviteUser(groupId, inviteData, user.id);

    return {
      success: true,
      data: result,
      message: 'Invitation envoyée avec succès',
    };
  }

  @Get(':id/permissions/:userId')
  @ApiOperation({
    summary: 'Vérifier les permissions d\'un utilisateur',
    description: 'Obtenir les permissions d\'un utilisateur dans le groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: 'user-789-012',
  })
  @ApiQuery({
    name: 'permission',
    required: false,
    description: 'Permission spécifique à vérifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions de l\'utilisateur',
  })
  async checkPermissions(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('permission') permission?: string,
  ): Promise<StandardResponse<any>> {
    if (permission) {
      const hasPermission = await this.groupsService.hasPermission(groupId, userId, permission);
      return {
        success: true,
        data: { permission, hasPermission },
      };
    }

    const userRole = await this.groupsService.getUserRole(groupId, userId);
    return {
      success: true,
      data: { role: userRole },
    };
  }

  @Get(':id/actions/:userId/:action')
  @ApiOperation({
    summary: 'Vérifier si une action est autorisée',
    description: 'Vérifier si un utilisateur peut effectuer une action spécifique',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID de l\'utilisateur',
    example: 'user-789-012',
  })
  @ApiParam({
    name: 'action',
    description: 'Action à vérifier',
    example: 'EDIT',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la vérification',
  })
  async canPerformAction(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('action') action: string,
  ): Promise<StandardResponse<any>> {
    const result = await this.groupsService.canPerformAction(groupId, userId, action);

    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un groupe',
    description: 'Supprimer définitivement un groupe',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du groupe',
    example: 'group-123-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Groupe supprimé',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserResponse,
  ): Promise<DeletedResponse> {
    await this.groupsService.delete(id, user.id);

    return {
      success: true,
      data: null,
      message: 'Groupe supprimé avec succès',
    };
  }
}