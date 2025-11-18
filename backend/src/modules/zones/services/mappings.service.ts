// src/modules/zones/services/mappings.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateMappingDto, UpdateMappingDto, MappingDto } from '../dto/mapping.dto';

@Injectable()
export class MappingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('MappingsService');
  }

  async getAllMappings(venueId?: string): Promise<MappingDto[]> {
    const operationId = this.logger.startOperation('getAllMappings', { venueId });

    try {
      const where: any = {};
      if (venueId) {
        where.venue_id = venueId;
      }

      const mappings = await this.prisma.venue_mappings.findMany({
        where,
        select: {
          id: true,
          venue_id: true,
          name: true,
          code: true,
          description: true,
          mapping_type: true,
          event_categories: true,
          effective_capacity: true,
          valid_from: true,
          valid_until: true,
          is_active: true,
          metadata: true,
        },
        orderBy: [
          { is_active: 'desc' },
          { name: 'asc' },
        ],
      });

      const result = mappings.map(mapping => ({
        id: mapping.id,
        venue_id: mapping.venue_id,
        name: mapping.name,
        code: mapping.code,
        description: mapping.description || undefined,
        mapping_type: mapping.mapping_type,
        event_categories: mapping.event_categories,
        effective_capacity: mapping.effective_capacity,
        valid_from: mapping.valid_from || undefined,
        valid_until: mapping.valid_until || undefined,
        is_active: mapping.is_active,
        metadata: mapping.metadata,
      })) as MappingDto[];

      this.logger.info(`Retrieved ${result.length} mappings from database`);
      this.logger.endOperation('getAllMappings', operationId, true);

      return result;
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'MappingsService.getAllMappings',
        undefined,
        JSON.stringify({ venueId }),
      );
      this.logger.endOperation('getAllMappings', operationId, false);
      throw error;
    }
  }

  async getMappingById(id: string): Promise<MappingDto> {
    const operationId = this.logger.startOperation('getMappingById', { id });

    try {
      const mapping = await this.prisma.venue_mappings.findUnique({
        where: { id },
        select: {
          id: true,
          venue_id: true,
          name: true,
          code: true,
          description: true,
          mapping_type: true,
          event_categories: true,
          effective_capacity: true,
          valid_from: true,
          valid_until: true,
          is_active: true,
          metadata: true,
        },
      });

      if (!mapping) {
        throw new NotFoundException(`Mapping with ID ${id} not found`);
      }

      const result = {
        id: mapping.id,
        venue_id: mapping.venue_id,
        name: mapping.name,
        code: mapping.code,
        description: mapping.description || undefined,
        mapping_type: mapping.mapping_type,
        event_categories: mapping.event_categories,
        effective_capacity: mapping.effective_capacity,
        valid_from: mapping.valid_from || undefined,
        valid_until: mapping.valid_until || undefined,
        is_active: mapping.is_active,
        metadata: mapping.metadata,
      } as MappingDto;

      this.logger.endOperation('getMappingById', operationId, true);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'MappingsService.getMappingById',
        undefined,
        JSON.stringify({ id }),
      );
      this.logger.endOperation('getMappingById', operationId, false);
      throw error;
    }
  }

  async createMapping(data: CreateMappingDto): Promise<MappingDto> {
    const operationId = this.logger.startOperation('createMapping', { name: data.name, code: data.code });

    try {
      // Check if venue exists
      const venue = await this.prisma.venues.findUnique({
        where: { id: data.venue_id },
      });

      if (!venue) {
        throw new NotFoundException(`Venue with ID ${data.venue_id} not found`);
      }

      // Check if code is unique within the venue
      const existingMapping = await this.prisma.venue_mappings.findFirst({
        where: {
          venue_id: data.venue_id,
          code: data.code,
        },
      });

      if (existingMapping) {
        throw new ConflictException(`Mapping with code ${data.code} already exists in this venue`);
      }

      // Create the mapping
      const mapping = await this.prisma.venue_mappings.create({
        data: {
          venue_id: data.venue_id,
          name: data.name,
          code: data.code,
          description: data.description,
          mapping_type: data.mapping_type as any,
          event_categories: data.event_categories,
          effective_capacity: data.effective_capacity,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
          is_active: data.is_active ?? true,
          metadata: data.metadata,
        },
        select: {
          id: true,
          venue_id: true,
          name: true,
          code: true,
          description: true,
          mapping_type: true,
          event_categories: true,
          effective_capacity: true,
          valid_from: true,
          valid_until: true,
          is_active: true,
          metadata: true,
        },
      });

      const result = {
        id: mapping.id,
        venue_id: mapping.venue_id,
        name: mapping.name,
        code: mapping.code,
        description: mapping.description || undefined,
        mapping_type: mapping.mapping_type,
        event_categories: mapping.event_categories,
        effective_capacity: mapping.effective_capacity,
        valid_from: mapping.valid_from || undefined,
        valid_until: mapping.valid_until || undefined,
        is_active: mapping.is_active,
        metadata: mapping.metadata,
      } as MappingDto;

      this.logger.info(`Created mapping: ${result.name} (${result.code})`);
      this.logger.endOperation('createMapping', operationId, true);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'MappingsService.createMapping',
        undefined,
        JSON.stringify(data),
      );
      this.logger.endOperation('createMapping', operationId, false);
      throw error;
    }
  }

  async updateMapping(id: string, data: UpdateMappingDto): Promise<MappingDto> {
    const operationId = this.logger.startOperation('updateMapping', { id });

    try {
      const existingMapping = await this.prisma.venue_mappings.findUnique({
        where: { id },
      });

      if (!existingMapping) {
        throw new NotFoundException(`Mapping with ID ${id} not found`);
      }

      // Check if code is unique within the venue (if code is being updated)
      if (data.code && data.code !== existingMapping.code) {
        const codeExists = await this.prisma.venue_mappings.findFirst({
          where: {
            venue_id: existingMapping.venue_id,
            code: data.code,
            id: { not: id },
          },
        });

        if (codeExists) {
          throw new ConflictException(`Mapping with code ${data.code} already exists in this venue`);
        }
      }

      // Update the mapping
      const mapping = await this.prisma.venue_mappings.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.mapping_type && { mapping_type: data.mapping_type as any }),
          ...(data.event_categories && { event_categories: data.event_categories }),
          ...(data.effective_capacity !== undefined && { effective_capacity: data.effective_capacity }),
          ...(data.valid_from !== undefined && { valid_from: data.valid_from }),
          ...(data.valid_until !== undefined && { valid_until: data.valid_until }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
          updated_at: new Date(),
        },
        select: {
          id: true,
          venue_id: true,
          name: true,
          code: true,
          description: true,
          mapping_type: true,
          event_categories: true,
          effective_capacity: true,
          valid_from: true,
          valid_until: true,
          is_active: true,
          metadata: true,
        },
      });

      const result = {
        id: mapping.id,
        venue_id: mapping.venue_id,
        name: mapping.name,
        code: mapping.code,
        description: mapping.description || undefined,
        mapping_type: mapping.mapping_type,
        event_categories: mapping.event_categories,
        effective_capacity: mapping.effective_capacity,
        valid_from: mapping.valid_from || undefined,
        valid_until: mapping.valid_until || undefined,
        is_active: mapping.is_active,
        metadata: mapping.metadata,
      } as MappingDto;

      this.logger.info(`Updated mapping: ${result.name} (${result.code})`);
      this.logger.endOperation('updateMapping', operationId, true);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'MappingsService.updateMapping',
        undefined,
        JSON.stringify({ id, data }),
      );
      this.logger.endOperation('updateMapping', operationId, false);
      throw error;
    }
  }

  async deleteMapping(id: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteMapping', { id });

    try {
      const mapping = await this.prisma.venue_mappings.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              venue_zones: true,
              access_points: true,
              events: true,
            },
          },
        },
      });

      if (!mapping) {
        throw new NotFoundException(`Mapping with ID ${id} not found`);
      }

      // Check if mapping has dependent records
      if (mapping._count.venue_zones > 0) {
        throw new BadRequestException(`Cannot delete mapping: ${mapping._count.venue_zones} zone(s) are associated with this mapping`);
      }

      if (mapping._count.access_points > 0) {
        throw new BadRequestException(`Cannot delete mapping: ${mapping._count.access_points} access point(s) are associated with this mapping`);
      }

      if (mapping._count.events > 0) {
        throw new BadRequestException(`Cannot delete mapping: ${mapping._count.events} event(s) are associated with this mapping`);
      }

      // Delete the mapping
      await this.prisma.venue_mappings.delete({
        where: { id },
      });

      this.logger.info(`Deleted mapping: ${mapping.name} (${mapping.code})`);
      this.logger.endOperation('deleteMapping', operationId, true);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'MappingsService.deleteMapping',
        undefined,
        JSON.stringify({ id }),
      );
      this.logger.endOperation('deleteMapping', operationId, false);
      throw error;
    }
  }
}

