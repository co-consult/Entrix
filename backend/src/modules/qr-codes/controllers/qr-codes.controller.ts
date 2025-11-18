// src/modules/qr-codes/controllers/qr-codes.controller.ts

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
  NotFoundException,
  BadRequestException,
  Res,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

// DTOs
import { CreateQRCodeDto } from '../dto/qr-codes/create-qr-code.dto';
import { UpdateQRCodeDto } from '../dto/qr-codes/update-qr-code.dto';
import { QRCodeSearchDto } from '../dto/qr-codes/qr-code-search.dto';
import { CreatePhysicalQRCodeDto } from '../dto/qr-codes/create-physical-qr-code.dto';

// Services
import { QRCodesService } from '../services/qr-codes.service';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Interfaces
import { QRCode, QRCodeStats, QRCodeFilters, QRCodeStatus } from '../interfaces/qr-code.interface';

// Types de réponse
import { 
  StandardResponse, 
  PaginatedResponse, 
  CreatedResponse, 
  UpdatedResponse, 
  DeletedResponse 
} from '../types/response.types';

@ApiTags('QR Codes')
@Controller('qr-codes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QRCodesController {
  constructor(private readonly qrCodesService: QRCodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau QR code',
    description: 'Créer un QR code physique avec les informations de base',
  })
  @ApiResponse({
    status: 201,
    description: 'QR code créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Code QR déjà existant',
  })
  @HttpCode(HttpStatus.CREATED)
  async createQRCode(@Body() dto: CreateQRCodeDto): Promise<CreatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.create({
      code: dto.code,
      type: dto.type,
      seatNumber: dto.seat_number,
      venueId: dto.venue_id,
      eventId: dto.event_id,
      metadata: dto.metadata,
    });

    return {
      success: true,
      data: qrCode,
      message: 'QR code créé avec succès',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Rechercher des QR codes',
    description: 'Rechercher et filtrer les QR codes avec pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des QR codes',
  })
  async searchQRCodes(@Query() searchDto: QRCodeSearchDto): Promise<PaginatedResponse<QRCode>> {
    const filters: QRCodeFilters = {
      type: searchDto.type,
      status: searchDto.status,
      venueId: searchDto.venue_id,
      eventId: searchDto.event_id,
      subscriptionId: searchDto.subscription_id,
      assignedTo: searchDto.assigned_to,
      seatNumber: searchDto.seat_number,
      subscriptionPlanId: searchDto.subscription_plan_id,
      createdAfter: searchDto.created_after ? new Date(searchDto.created_after) : undefined,
      createdBefore: searchDto.created_before ? new Date(searchDto.created_before) : undefined,
      assignedAfter: searchDto.assigned_after ? new Date(searchDto.assigned_after) : undefined,
      assignedBefore: searchDto.assigned_before ? new Date(searchDto.assigned_before) : undefined,
    };

    const pagination = {
      page: searchDto.page || 1,
      limit: searchDto.limit || 20,
    };

    const sorting = {
      field: searchDto.sort_by || 'created_at',
      order: searchDto.sort_order || 'desc',
    };

    const result = await this.qrCodesService.search({
      query: searchDto.query,
      filters,
      pagination,
      sorting,
    });

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtenir les statistiques des QR codes',
    description: 'Récupérer les statistiques détaillées des QR codes',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des QR codes',
  })
  async getQRCodeStats(@Query() filters?: QRCodeFilters): Promise<StandardResponse<QRCodeStats>> {
    const stats = await this.qrCodesService.getStats(filters);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('export')
  @ApiOperation({
    summary: 'Exporter tous les QR codes',
    description: 'Exporter tous les QR codes sans limite de pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les QR codes pour export',
  })
  async exportQRCodes(@Query() searchDto: QRCodeSearchDto): Promise<StandardResponse<QRCode[]>> {
    const filters: QRCodeFilters = {
      type: searchDto.type,
      status: searchDto.status,
      venueId: searchDto.venue_id,
      eventId: searchDto.event_id,
      subscriptionId: searchDto.subscription_id,
      assignedTo: searchDto.assigned_to,
      seatNumber: searchDto.seat_number,
      subscriptionPlanId: searchDto.subscription_plan_id,
      createdAfter: searchDto.created_after ? new Date(searchDto.created_after) : undefined,
      createdBefore: searchDto.created_before ? new Date(searchDto.created_before) : undefined,
      assignedAfter: searchDto.assigned_after ? new Date(searchDto.assigned_after) : undefined,
      assignedBefore: searchDto.assigned_before ? new Date(searchDto.assigned_before) : undefined,
    };

    const result = await this.qrCodesService.exportAll(filters);

    return {
      success: true,
      data: result,
    };
  }



  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un QR code par ID',
    description: 'Récupérer les détails d\'un QR code spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code trouvé' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async getQRCodeById(@Param('id', ParseUUIDPipe) id: string): Promise<StandardResponse<QRCode>> {
    const qrCode = await this.qrCodesService.findById(id);

    if (!qrCode) {
      throw new NotFoundException('QR code non trouvé');
    }

    return {
      success: true,
      data: qrCode,
    };
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Obtenir un QR code par code',
    description: 'Récupérer les détails d\'un QR code par son code unique',
  })
  @ApiParam({ name: 'code', description: 'Code du QR code' })
  @ApiResponse({ status: 200, description: 'QR code trouvé' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async getQRCodeByCode(@Param('code') code: string): Promise<StandardResponse<QRCode>> {
    const qrCode = await this.qrCodesService.findByCode(code);

    if (!qrCode) {
      throw new NotFoundException('QR code non trouvé');
    }

    return {
      success: true,
      data: qrCode,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour un QR code',
    description: 'Modifier les informations d\'un QR code',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code mis à jour' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async updateQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQRCodeDto,
  ): Promise<UpdatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.update(id, {
      code: dto.code,
      type: dto.type,
      status: dto.status,
      seatNumber: dto.seat_number,
      venueId: dto.venue_id,
      eventId: dto.event_id,
      subscriptionId: dto.subscription_id,
      assignedTo: dto.assigned_to,
      assignedAt: dto.assigned_at ? new Date(dto.assigned_at) : undefined,
      metadata: dto.metadata,
    });

    return {
      success: true,
      data: qrCode,
      message: 'QR code mis à jour avec succès',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un QR code',
    description: 'Supprimer définitivement un QR code',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code supprimé' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async deleteQRCode(@Param('id', ParseUUIDPipe) id: string): Promise<DeletedResponse> {
    await this.qrCodesService.delete(id);

    return {
      success: true,
      message: 'QR code supprimé avec succès',
    };
  }

  @Post(':id/assign')
  @ApiOperation({
    summary: 'Assigner un QR code à un abonnement',
    description: 'Assigner un QR code disponible à un abonnement spécifique',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code assigné avec succès' })
  @ApiResponse({ status: 404, description: 'QR code ou abonnement non trouvé' })
  @ApiResponse({ status: 400, description: 'QR code non disponible' })
  async assignQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { subscription_id: string; assigned_to?: string },
  ): Promise<UpdatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.assignToSubscription(
      id,
      body.subscription_id,
      body.assigned_to,
    );

    return {
      success: true,
      data: qrCode,
      message: 'QR code assigné avec succès',
    };
  }

  @Post(':id/release')
  @ApiOperation({
    summary: 'Libérer un QR code',
    description: 'Retirer l\'assignation d\'un QR code et le rendre disponible',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code libéré avec succès' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  async releaseQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string }
  ): Promise<UpdatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.releaseQRCode(id, body.reason);

    return {
      success: true,
      data: qrCode,
      message: 'QR code libéré avec succès',
    };
  }

  @Post(':id/reserve')
  @ApiOperation({
    summary: 'Réserver un QR code',
    description: 'Réserver un QR code pour une utilisation future',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code réservé avec succès' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  @ApiResponse({ status: 400, description: 'QR code non disponible' })
  async reserveQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { note: string; reservedFor: string; reservedUntil: string }
  ): Promise<UpdatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.reserveQRCode(id, body);

    return {
      success: true,
      data: qrCode,
      message: 'QR code réservé avec succès',
    };
  }

  @Post(':id/use')
  @ApiOperation({
    summary: 'Marquer un QR code comme utilisé',
    description: 'Marquer un QR code assigné comme utilisé lors d\'un événement',
  })
  @ApiParam({ name: 'id', description: 'ID du QR code' })
  @ApiResponse({ status: 200, description: 'QR code marqué comme utilisé' })
  @ApiResponse({ status: 404, description: 'QR code non trouvé' })
  @ApiResponse({ status: 400, description: 'QR code non assigné' })
  async markQRCodeAsUsed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { used_by: string; location?: string; device_info?: string },
  ): Promise<UpdatedResponse<QRCode>> {
    const qrCode = await this.qrCodesService.markAsUsed(
      id,
      body.used_by,
      body.location,
      body.device_info,
    );

    return {
      success: true,
      data: qrCode,
      message: 'QR code marqué comme utilisé',
    };
  }

  @Post('generate-batch')
  @ApiOperation({
    summary: 'Générer des QR codes en lot',
    description: 'Générer plusieurs QR codes automatiquement',
  })
  @ApiResponse({ status: 201, description: 'QR codes générés avec succès' })
  async generateBatchQRCodes(
    @Body() body: { count: number; type: string; prefix?: string },
  ): Promise<CreatedResponse<QRCode[]>> {
    const qrCodes = await this.qrCodesService.generateBatch(
      body.count,
      body.type as any,
      body.prefix,
    );

    return {
      success: true,
      data: qrCodes,
      message: `${qrCodes.length} QR codes générés avec succès`,
    };
  }

  @Get('available/count')
  @ApiOperation({
    summary: 'Compter les QR codes disponibles',
    description: 'Obtenir le nombre de QR codes disponibles par type',
  })
  @ApiResponse({ status: 200, description: 'Nombre de QR codes disponibles' })
  async getAvailableCount(): Promise<StandardResponse<any>> {
    const stats = await this.qrCodesService.getStats({ status: QRCodeStatus.AVAILABLE });

    return {
      success: true,
      data: {
        total: stats.availableQRCodes,
        byType: stats.qrCodesByType,
      },
    };
  }

  @Get('assigned/count')
  @ApiOperation({
    summary: 'Compter les QR codes assignés',
    description: 'Obtenir le nombre de QR codes assignés par type',
  })
  @ApiResponse({ status: 200, description: 'Nombre de QR codes assignés' })
  async getAssignedCount(): Promise<StandardResponse<any>> {
    const stats = await this.qrCodesService.getStats({ status: QRCodeStatus.ASSIGNED });

    return {
      success: true,
      data: {
        total: stats.assignedQRCodes,
        byType: stats.qrCodesByType,
      },
    };
  }

  @Get('check/:qrCode')
  @ApiOperation({ summary: 'Check if a QR code already exists' })
  @ApiParam({ name: 'qrCode', description: 'The QR code to check' })
  @ApiResponse({ status: 200, description: 'QR code existence check result' })
  async checkQrCodeExists(@Param('qrCode') qrCode: string) {
    const exists = await this.qrCodesService.checkQrCodeExists(qrCode);
    return { exists, qrCode };
  }

  @Post('check-batch')
  @ApiOperation({ summary: 'Check multiple QR codes for existence' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        codes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of QR codes to check'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Batch QR code existence check results' })
  async checkMultipleQrCodes(@Body() body: { codes: string[] }) {
    const results = await this.qrCodesService.checkMultipleQrCodes(body.codes);
    return { results };
  }

  @Post('create-physical')
  @ApiOperation({
    summary: 'Create physical QR code(s) for a subscription plan',
    description: 'Create single or bulk physical QR codes with proper structure, serial numbers, and uniqueness',
  })
  @ApiResponse({
    status: 201,
    description: 'QR code(s) created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createPhysicalQRCode(
    @Body() dto: CreatePhysicalQRCodeDto,
    @Request() req: any,
  ): Promise<CreatedResponse<QRCode | { created: QRCode[]; errors: Array<{ index: number; error: string }> }>> {
    const { subscription_plan_id, mode, count, zone_id, suffix_type, card_type, card_batch, seat_row, seat_start_number, porte } = dto;
    const userId = req.user?.id;

    if (mode === 'BULK') {
      if (!count || count < 1) {
        throw new BadRequestException('Count is required for BULK mode and must be at least 1');
      }

      const result = await this.qrCodesService.bulkCreatePhysicalQRCodes(
        subscription_plan_id,
        count,
        {
          zoneId: zone_id,
          suffixType: suffix_type,
          cardType: card_type,
          cardBatch: card_batch,
          assignedBy: userId,
          seatRow: seat_row,
          seatStartNumber: seat_start_number,
          porte: porte,
        },
      );

      return {
        success: true,
        data: result,
        message: `${result.created.length} QR code(s) created successfully${result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ''}`,
      };
    } else {
      const qrCode = await this.qrCodesService.createPhysicalQRCode(subscription_plan_id, {
        zoneId: zone_id,
        suffixType: suffix_type,
        cardType: card_type,
        cardBatch: card_batch,
        assignedBy: userId,
        seatRow: seat_row,
        seatStartNumber: seat_start_number,
        porte: porte,
      });

      return {
        success: true,
        data: qrCode,
        message: 'QR code created successfully',
      };
    }
  }

  @Post('create-physical/preview')
  @ApiOperation({
    summary: 'Preview QR code creation without creating them',
    description: 'Get a preview of what would be created (zone, suffix, porte, serial numbers, capacity)',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  async previewQRCodeCreation(
    @Body() dto: { subscription_plan_id: string; count: number; zone_id?: string; suffix_type?: string; card_type?: string; card_batch?: string; seat_row?: string; seat_start_number?: number; porte?: number },
  ): Promise<StandardResponse<any>> {
    const preview = await this.qrCodesService.previewQRCodeCreation(
      dto.subscription_plan_id,
      dto.count,
      {
        zoneId: dto.zone_id,
        suffixType: dto.suffix_type,
        cardType: dto.card_type,
        cardBatch: dto.card_batch,
        seatRow: dto.seat_row,
        seatStartNumber: dto.seat_start_number,
        porte: dto.porte,
      },
    );

    return {
      success: true,
      data: preview,
      message: 'Preview generated successfully',
    };
  }

  @Get('check-plan-has-seats')
  @ApiOperation({
    summary: 'Check if a subscription plan has seats',
    description: 'Returns true if the subscription plan has zones with seats',
  })
  @ApiQuery({
    name: 'subscription_plan_id',
    required: true,
    description: 'Subscription plan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan seat status retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async checkPlanHasSeats(
    @Query('subscription_plan_id') subscriptionPlanId: string,
  ): Promise<StandardResponse<{ hasSeats: boolean }>> {
    if (!subscriptionPlanId) {
      throw new BadRequestException('subscription_plan_id is required');
    }

    const hasSeats = await this.qrCodesService.subscriptionPlanHasSeats(subscriptionPlanId);

    return {
      success: true,
      data: { hasSeats },
      message: hasSeats ? 'This plan has seats' : 'This plan does not have seats',
    };
  }

  @Get('get-last-seat-number')
  @ApiOperation({
    summary: 'Get last seat number for a given row in a subscription plan',
    description: 'Returns the highest seat number for the specified row, or 0 if no seats exist',
  })
  @ApiQuery({
    name: 'subscription_plan_id',
    required: true,
    description: 'Subscription plan ID',
  })
  @ApiQuery({
    name: 'seat_row',
    required: true,
    description: 'Seat row letter (A, B, C, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Last seat number retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async getLastSeatNumber(
    @Query('subscription_plan_id') subscriptionPlanId: string,
    @Query('seat_row') seatRow: string,
  ): Promise<StandardResponse<{ lastSeatNumber: number }>> {
    if (!subscriptionPlanId || !seatRow) {
      throw new BadRequestException('subscription_plan_id and seat_row are required');
    }

    const lastSeatNumber = await this.qrCodesService.getLastSeatNumberForRow(
      subscriptionPlanId,
      seatRow,
    );

    return {
      success: true,
      data: { lastSeatNumber },
      message: `Last seat number for row ${seatRow.toUpperCase()}: ${lastSeatNumber}`,
    };
  }

  @Get('get-available-seat-rows')
  @ApiOperation({
    summary: 'Get available seat rows for a subscription plan',
    description: 'Returns an array of unique seat row letters found in QR code metadata',
  })
  @ApiQuery({
    name: 'subscription_plan_id',
    required: true,
    description: 'Subscription plan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Available seat rows retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async getAvailableSeatRows(
    @Query('subscription_plan_id') subscriptionPlanId: string,
  ): Promise<StandardResponse<{ seatRows: string[] }>> {
    if (!subscriptionPlanId) {
      throw new BadRequestException('subscription_plan_id is required');
    }

    const seatRows = await this.qrCodesService.getAvailableSeatRows(subscriptionPlanId);

    return {
      success: true,
      data: { seatRows },
      message: `Found ${seatRows.length} seat row(s)`,
    };
  }

  @Get('get-zones')
  @ApiOperation({
    summary: 'Get all venue zones',
    description: 'Returns all available venue zones from the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
  })
  async getZones(): Promise<StandardResponse<Array<{ id: string; code: string; name: string }>>> {
    const zones = await this.qrCodesService.getAllZones();

    return {
      success: true,
      data: zones,
      message: `Found ${zones.length} zone(s)`,
    };
  }

  @Get('get-zones-for-plan/:subscriptionPlanId')
  @ApiOperation({
    summary: 'Get zones for a subscription plan',
    description: 'Returns zones associated with a subscription plan from subscription_plan_zones table',
  })
  @ApiParam({
    name: 'subscriptionPlanId',
    description: 'Subscription plan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription plan not found',
  })
  async getZonesForPlan(
    @Param('subscriptionPlanId', ParseUUIDPipe) subscriptionPlanId: string,
  ): Promise<StandardResponse<Array<{ id: string; code: string; name: string }>>> {
    const zones = await this.qrCodesService.getZonesForSubscriptionPlan(subscriptionPlanId);

    return {
      success: true,
      data: zones,
      message: `Found ${zones.length} zone(s) for this subscription plan`,
    };
  }

  @Post('create-physical/export')
  @ApiOperation({
    summary: 'Export created QR codes to CSV',
    description: 'Export QR codes with QR code, onboarding key, and serial number',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV export generated successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async exportCreatedQRCodes(
    @Body() dto: { qr_code_ids: string[] },
    @Res() res: any,
  ): Promise<void> {
    const { csv, filename } = await this.qrCodesService.exportCreatedQRCodes(dto.qr_code_ids);
    
    res.setHeader('Content-Type', 'text/csv');
    // Add filename to Content-Disposition header
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    // Also add as custom header for easier access
    res.setHeader('X-Filename', `${filename}.csv`);
    res.send(csv);
  }

  @Post('sync-seats')
  @ApiOperation({
    summary: 'Synchroniser tous les sièges avec les QR codes',
    description: 'Met à jour le statut de tous les sièges en fonction du statut de leurs QR codes associés',
  })
  @ApiResponse({ status: 200, description: 'Synchronisation terminée' })
  async syncAllSeatStatuses(): Promise<{ success: boolean; data: { synced: number; errors: number } }> {
    const result = await this.qrCodesService.syncAllSeatStatuses();
    return {
      success: true,
      data: result,
    };
  }
} 