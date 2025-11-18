// src/modules/zones/controllers/zones.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZonesService } from '../services/zones.service';
import { MappingsService } from '../services/mappings.service';
import { ZoneDto, GetZonesQueryDto, CreateZoneDto, UpdateZoneDto } from '../dto/zone.dto';
import { MappingDto, CreateMappingDto, UpdateMappingDto } from '../dto/mapping.dto';
import { StandardResponse } from '../../qr-codes/types/response.types';

@ApiTags('Zones')
@Controller('zones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ZonesController {
  constructor(
    private readonly zonesService: ZonesService,
    private readonly mappingsService: MappingsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all zones',
    description: 'Retrieve all venue zones with optional filters. By default, returns only active zones.',
  })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'zone_type', required: false, type: String, description: 'Filter by zone type' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or code' })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
    type: [ZoneDto],
  })
  async getAllZones(
    @Query() query: GetZonesQueryDto,
  ): Promise<StandardResponse<ZoneDto[]>> {
    const zones = await this.zonesService.getAllZones(query);

    return {
      success: true,
      data: zones,
      message: `Found ${zones.length} zone(s)`,
    };
  }

  // ============================================================================
  // MAPPINGS ENDPOINTS (must come before @Get(':id') to avoid route conflicts)
  // ============================================================================

  @Get('mappings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all mappings',
    description: 'Retrieve all venue mappings with optional venue filter',
  })
  @ApiQuery({ name: 'venue_id', required: false, type: String, description: 'Filter by venue ID' })
  @ApiResponse({
    status: 200,
    description: 'Mappings retrieved successfully',
  })
  async getAllMappings(
    @Query('venue_id') venueId?: string,
  ): Promise<StandardResponse<MappingDto[]>> {
    const mappings = await this.mappingsService.getAllMappings(venueId);

    return {
      success: true,
      data: mappings,
      message: `Found ${mappings.length} mapping(s)`,
    };
  }

  @Get('mappings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get mapping by ID',
    description: 'Retrieve a specific mapping by its ID',
  })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Mapping not found',
  })
  async getMappingById(
    @Param('id') id: string,
  ): Promise<StandardResponse<MappingDto>> {
    const mapping = await this.mappingsService.getMappingById(id);

    return {
      success: true,
      data: mapping,
      message: 'Mapping retrieved successfully',
    };
  }

  @Post('mappings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new mapping',
    description: 'Create a new venue mapping',
  })
  @ApiBody({ type: CreateMappingDto })
  @ApiResponse({
    status: 201,
    description: 'Mapping created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  async createMapping(
    @Body() createMappingDto: CreateMappingDto,
  ): Promise<StandardResponse<MappingDto>> {
    const mapping = await this.mappingsService.createMapping(createMappingDto);

    return {
      success: true,
      data: mapping,
      message: 'Mapping created successfully',
    };
  }

  @Put('mappings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a mapping',
    description: 'Update an existing venue mapping',
  })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiBody({ type: UpdateMappingDto })
  @ApiResponse({
    status: 200,
    description: 'Mapping updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Mapping not found',
  })
  async updateMapping(
    @Param('id') id: string,
    @Body() updateMappingDto: UpdateMappingDto,
  ): Promise<StandardResponse<MappingDto>> {
    const mapping = await this.mappingsService.updateMapping(id, updateMappingDto);

    return {
      success: true,
      data: mapping,
      message: 'Mapping updated successfully',
    };
  }

  @Delete('mappings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a mapping',
    description: 'Delete a venue mapping',
  })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({
    status: 200,
    description: 'Mapping deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Mapping not found',
  })
  async deleteMapping(
    @Param('id') id: string,
  ): Promise<StandardResponse<void>> {
    await this.mappingsService.deleteMapping(id);

    return {
      success: true,
      data: undefined,
      message: 'Mapping deleted successfully',
    };
  }

  // ============================================================================
  // ZONE ENDPOINTS
  // ============================================================================

  @Get('zones-with-seats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get zones with seats',
    description: 'Retrieve all zones that have at least one seat configured',
  })
  @ApiResponse({
    status: 200,
    description: 'Zones with seats retrieved successfully',
    type: [ZoneDto],
  })
  async getZonesWithSeats(): Promise<StandardResponse<ZoneDto[]>> {
    const zones = await this.zonesService.getZonesWithSeats();

    return {
      success: true,
      data: zones,
      message: `Found ${zones.length} zone(s) with seats`,
    };
  }

  @Get(':id/seats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all seats for a zone',
    description: 'Retrieve all seats in a zone with their status (available, sold, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Seats retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Zone not found',
  })
  async getZoneSeats(
    @Param('id') id: string,
  ): Promise<StandardResponse<any[]>> {
    const seats = await this.zonesService.getZoneSeats(id);

    return {
      success: true,
      data: seats,
      message: `Found ${seats.length} seat(s)`,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get zone by ID',
    description: 'Retrieve a specific zone by its ID',
  })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Zone retrieved successfully',
    type: ZoneDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Zone not found',
  })
  async getZoneById(
    @Param('id') id: string,
  ): Promise<StandardResponse<ZoneDto>> {
    const zone = await this.zonesService.getZoneById(id);

    return {
      success: true,
      data: zone,
      message: 'Zone retrieved successfully',
    };
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get zones by IDs',
    description: 'Retrieve multiple zones by their IDs (bulk operation)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of zone IDs',
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
    type: [ZoneDto],
  })
  async getZonesByIds(
    @Body('ids') ids: string[],
  ): Promise<StandardResponse<ZoneDto[]>> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No zone IDs provided',
      };
    }

    const zones = await this.zonesService.getZonesByIds(ids);

    return {
      success: true,
      data: zones,
      message: `Found ${zones.length} zone(s)`,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new zone',
    description: 'Create a new venue zone',
  })
  @ApiBody({ type: CreateZoneDto })
  @ApiResponse({
    status: 201,
    description: 'Zone created successfully',
    type: ZoneDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue mapping not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Zone code already exists in this mapping',
  })
  async createZone(
    @Body() createZoneDto: CreateZoneDto,
  ): Promise<StandardResponse<ZoneDto>> {
    const zone = await this.zonesService.createZone(createZoneDto);

    return {
      success: true,
      data: zone,
      message: 'Zone created successfully',
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a zone',
    description: 'Update an existing venue zone',
  })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiBody({ type: UpdateZoneDto })
  @ApiResponse({
    status: 200,
    description: 'Zone updated successfully',
    type: ZoneDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Zone not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Zone code already exists in this mapping',
  })
  async updateZone(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateZoneDto,
  ): Promise<StandardResponse<ZoneDto>> {
    const zone = await this.zonesService.updateZone(id, updateZoneDto);

    return {
      success: true,
      data: zone,
      message: 'Zone updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a zone',
    description: 'Delete a venue zone. Zone cannot be deleted if it has associated seats, access rights, subscription plans, tickets, or child zones.',
  })
  @ApiParam({ name: 'id', description: 'Zone ID' })
  @ApiResponse({
    status: 200,
    description: 'Zone deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Zone not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete zone - has dependent records',
  })
  async deleteZone(
    @Param('id') id: string,
  ): Promise<StandardResponse<void>> {
    await this.zonesService.deleteZone(id);

    return {
      success: true,
      data: undefined,
      message: 'Zone deleted successfully',
    };
  }
}

