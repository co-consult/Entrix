// src/modules/users/controllers/invitations.controller.ts

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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';

// DTOs - EXACTEMENT ceux qui existent
import { SendInvitationDto } from '../dto/invitations/send-invitation.dto';
import { BulkInvitationDto } from '../dto/invitations/bulk-invitation.dto';
import { RespondInvitationDto } from '../dto/invitations/respond-invitation.dto';

// Service - celui qui existe vraiment
import { InvitationsService } from '../services/invitations.service';

// Types - ceux qui existent dans le service
import { 
  StandardResponse,
  CreatedResponse
} from '../types/response.types';

// Exceptions
import { 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';

// Constants
import { INVITATION_CONSTANTS } from '../constants/invitation.constants';

// Types des réponses du service (tels que définis dans le service)
interface InvitationResult {
  id: string;
  token: string;
  type: string;
  status: string;
  contextId: string;
  contextName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  expiresAt: Date;
  invitationUrl: string;
  emailSent: boolean;
  smsSent: boolean;
}

interface BulkInvitationResult {
  total: number;
  successful: InvitationResult[];
  failed: Array<{
    email?: string;
    userId?: string;
    name?: string;
    error: string;
    code: string;
  }>;
  duplicates?: Array<{
    email?: string;
    userId?: string;
    reason: string;
  }>;
  processingTime: number;
  warnings?: string[];
}

interface StoredInvitation {
  id: string;
  type: string;
  status: string;
  token: string;
  contextId: string;
  contextName: string;
  invitedBy: string;
  inviterName: string;
  invitedEmail?: string;
  invitedUserId?: string;
  invitedName?: string;
  proposedRole?: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  remindersSent: number;
  lastReminderAt?: string;
  viewedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface InvitationValidation {
  isValid: boolean;
  isExpired: boolean;
  isAlreadyMember: boolean;
  canAccept: boolean;
  errors: string[];
  warnings: string[];
  invitation?: StoredInvitation;
}

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Envoyer une invitation',
    description: 'Envoyer une invitation à rejoindre un groupe, événement ou pour une amitié',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation envoyée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données d\'invitation invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes pour inviter',
  })
  @ApiResponse({
    status: 409,
    description: 'Invitation déjà existante ou utilisateur déjà membre',
  })
  @HttpCode(HttpStatus.CREATED)
  async sendInvitation(
    @Body() dto: SendInvitationDto,
    @Query('invitedBy') invitedBy: string,
    @Req() req: Request,
  ): Promise<CreatedResponse<InvitationResult>> {
    try {
      const result = await this.invitationsService.send(dto, invitedBy);

      return {
        success: true,
        data: result,
        message: `Invitation ${dto.type.toLowerCase()} envoyée avec succès`,
      };
    } catch (error) {
      if (error.message.includes('already member')) {
        throw new ConflictException('L\'utilisateur est déjà membre');
      }
      if (error.message.includes('already invited')) {
        throw new ConflictException('Une invitation est déjà en attente pour cette personne');
      }
      if (error.message.includes('permission')) {
        throw new ForbiddenException('Permissions insuffisantes pour envoyer cette invitation');
      }
      if (error.message.includes('limit')) {
        throw new BadRequestException('Limite d\'invitations atteinte');
      }
      throw error;
    }
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Envoyer des invitations en masse',
    description: 'Envoyer plusieurs invitations simultanément',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitations en masse traitées',
  })
  @ApiResponse({
    status: 400,
    description: 'Données d\'invitations invalides',
  })
  @HttpCode(HttpStatus.CREATED)
  async sendBulkInvitations(
    @Body() dto: BulkInvitationDto,
    @Query('invitedBy') invitedBy: string,
    @Req() req: Request,
  ): Promise<CreatedResponse<BulkInvitationResult>> {
    try {
      const result = await this.invitationsService.sendBulk(dto, invitedBy);

      const successMessage = result.failed.length === 0
        ? `${result.successful.length} invitations envoyées avec succès`
        : `${result.successful.length} invitations envoyées, ${result.failed.length} échecs`;

      return {
        success: true,
        data: result,
        message: successMessage,
      };
    } catch (error) {
      if (error.message.includes('limit')) {
        throw new BadRequestException('Limite d\'invitations en masse atteinte');
      }
      throw error;
    }
  }

  @Get('token/:token')
  @ApiOperation({
    summary: 'Récupérer invitation par token',
    description: 'Récupérer les détails d\'une invitation via son token public',
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token d\'invitation',
    example: 'abc123def456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitation trouvée' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invitation introuvable ou expirée' 
  })
  async getInvitationByToken(
    @Param('token') token: string,
  ): Promise<StandardResponse<StoredInvitation>> {
    const invitation = await this.invitationsService.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation introuvable ou expirée');
    }

    return {
      success: true,
      data: invitation,
    };
  }

  @Post('accept/:token')
  @ApiOperation({
    summary: 'Accepter une invitation par token',
    description: 'Accepter une invitation directement via son token',
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token d\'invitation' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitation acceptée avec succès' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invitation ne peut pas être acceptée' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invitation introuvable' 
  })
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Param('token') token: string,
    @Query('userId') userId: string,
    @Req() req: Request,
  ): Promise<StandardResponse<any>> {
    try {
      const result = await this.invitationsService.accept(
        token,
        userId,
        req.ip,
        req.get('User-Agent')
      );

      return {
        success: true,
        data: result,
        message: 'Invitation acceptée avec succès',
      };
    } catch (error) {
      if (error.message.includes('expired')) {
        throw new BadRequestException('Cette invitation a expiré');
      }
      if (error.message.includes('already responded')) {
        throw new BadRequestException('Vous avez déjà répondu à cette invitation');
      }
      if (error.message.includes('not found')) {
        throw new NotFoundException('Invitation introuvable');
      }
      throw error;
    }
  }

  @Post('decline/:id')
  @ApiOperation({
    summary: 'Refuser une invitation',
    description: 'Refuser une invitation reçue',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de l\'invitation' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitation refusée' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invitation ne peut pas être refusée' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invitation introuvable' 
  })
  @HttpCode(HttpStatus.OK)
  async declineInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondInvitationDto,
    @Query('userId') userId: string,
    @Req() req: Request,
  ): Promise<StandardResponse<null>> {
    try {
      await this.invitationsService.decline(id, userId, dto.reason);

      return {
        success: true,
        data: null,
        message: 'Invitation refusée',
      };
    } catch (error) {
      if (error.message.includes('expired')) {
        throw new BadRequestException('Cette invitation a expiré');
      }
      if (error.message.includes('already responded')) {
        throw new BadRequestException('Vous avez déjà répondu à cette invitation');
      }
      if (error.message.includes('not found')) {
        throw new NotFoundException('Invitation introuvable');
      }
      throw error;
    }
  }
}