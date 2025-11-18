// src/modules/venues/controllers/venues.controller.ts

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
import { VenuesService } from '../services/venues.service';
import { CreateVenueDto, UpdateVenueDto, VenueSearchDto } from '../dto/venue.dto';
import { StandardResponse } from '../../qr-codes/types/response.types';

@ApiTags('Venues')
@Controller('venues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all venues',
    description: 'Retrieve all venues with optional filters (search, status, pagination)',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, description, address, or city' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status: active, inactive, or all' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Venues retrieved successfully',
  })
  async getAllVenues(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ): Promise<StandardResponse<any> & { meta?: any }> {
    // Parse pagination parameters
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    const query = {
      search,
      status,
      page: page && !isNaN(page) ? page : undefined,
      limit: limit && !isNaN(limit) ? limit : undefined,
    };
    
    const result = await this.venuesService.getAllVenues(query);

    return {
      success: true,
      data: result.data,
      message: `Found ${result.data.length} venue(s)`,
      meta: result.meta,
    } as StandardResponse<any> & { meta?: any };
  }

  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get venue statistics',
    description: 'Get statistics for a venue including zones count, events count, and capacity',
  })
  @ApiParam({ name: 'id', type: String, description: 'Venue ID' })
  @ApiResponse({
    status: 200,
    description: 'Venue statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  async getVenueStats(@Param('id') id: string): Promise<StandardResponse<any>> {
    const stats = await this.venuesService.getVenueStatistics(id);

    return {
      success: true,
      data: stats,
      message: 'Venue statistics retrieved successfully',
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get venue by ID',
    description: 'Retrieve a single venue by its ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'Venue ID' })
  @ApiResponse({
    status: 200,
    description: 'Venue retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  async getVenueById(@Param('id') id: string): Promise<StandardResponse<any>> {
    const venue = await this.venuesService.getVenueById(id);

    return {
      success: true,
      data: venue,
      message: 'Venue retrieved successfully',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new venue',
    description: 'Create a new venue with the provided data',
  })
  @ApiBody({ type: CreateVenueDto })
  @ApiResponse({
    status: 201,
    description: 'Venue created successfully',
  })
  async createVenue(@Body() data: CreateVenueDto): Promise<StandardResponse<any>> {
    const venue = await this.venuesService.createVenue(data);

    return {
      success: true,
      data: venue,
      message: 'Venue created successfully',
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a venue',
    description: 'Update an existing venue by ID',
  })
  @ApiParam({ name: 'id', type: String, description: 'Venue ID' })
  @ApiBody({ type: UpdateVenueDto })
  @ApiResponse({
    status: 200,
    description: 'Venue updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  async updateVenue(
    @Param('id') id: string,
    @Body() data: UpdateVenueDto,
  ): Promise<StandardResponse<any>> {
    const venue = await this.venuesService.updateVenue(id, data);

    return {
      success: true,
      data: venue,
      message: 'Venue updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a venue',
    description: 'Delete a venue by ID (only if it has no active events)',
  })
  @ApiParam({ name: 'id', type: String, description: 'Venue ID' })
  @ApiResponse({
    status: 200,
    description: 'Venue deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete venue with active events',
  })
  async deleteVenue(@Param('id') id: string): Promise<StandardResponse<any>> {
    await this.venuesService.deleteVenue(id);

    return {
      success: true,
      data: null,
      message: 'Venue deleted successfully',
    };
  }
}

