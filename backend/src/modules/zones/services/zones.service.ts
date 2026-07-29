// src/modules/zones/services/zones.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { ZoneDto, GetZonesQueryDto, CreateZoneDto, UpdateZoneDto } from '../dto/zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ZonesService');
  }

  /**
   * Get all zones with optional filters
   */
  async getAllZones(query?: GetZonesQueryDto): Promise<ZoneDto[]> {
    const operationId = this.logger.startOperation('getAllZones', query || {});

    try {
      const where: any = {};

      // Filter by active status
      if (query?.active !== undefined) {
        // Explicitly filter by active status (true or false)
        where.is_active = query.active;
      }
      // If active is undefined, don't filter by status (show all zones)

      // Filter by zone type
      if (query?.zone_type) {
        where.zone_type = query.zone_type;
      }

      // Filter by category
      if (query?.category) {
        where.category = query.category;
      }

      // Filter by venue_id (through mapping)
      if (query?.venue_id) {
        // Get all mappings for this venue
        const venueMappings = await this.prisma.venue_mappings.findMany({
          where: { venue_id: query.venue_id },
          select: { id: true },
        });
        const mappingIds = venueMappings.map(m => m.id);
        
        if (mappingIds.length > 0) {
          where.mapping_id = { in: mappingIds };
        } else {
          // If no mappings found for this venue, return empty result
          where.mapping_id = { in: [] };
        }
      }

      // Search by name or code - combine with existing OR conditions properly
      if (query?.search) {
        const searchConditions = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ];

        // If we already have an OR condition (from active filter), we need to combine them with AND
        if (where.OR) {
          // Create a new structure that combines both conditions
          where.AND = [
            { OR: where.OR }, // Existing active status filter
            { OR: searchConditions }, // Search conditions
          ];
          delete where.OR; // Remove the old OR since we're using AND now
        } else {
          // No existing OR, just add search conditions
          where.OR = searchConditions;
        }
      }

      const zones = await this.prisma.venue_zones.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
          amenities: true,
          mapping_id: true,
        },
        orderBy: [
          { is_active: 'desc' },
          { name: 'asc' },
        ],
      });

      const result = zones.map(zone => ({
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type,
        category: zone.category,
        amenities: zone.amenities || [],
        mapping_id: zone.mapping_id,
      }));

      this.logger.info(`Retrieved ${result.length} zones from database`);
      this.logger.endOperation('getAllZones', operationId, true);

      return result;
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.getAllZones',
        undefined,
        JSON.stringify(query || {}),
      );
      this.logger.endOperation('getAllZones', operationId, false);
      throw error;
    }
  }

  /**
   * Get a zone by ID
   */
  async getZoneById(id: string): Promise<ZoneDto> {
    const operationId = this.logger.startOperation('getZoneById', { id });

    try {
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
          amenities: true,
          mapping_id: true,
        },
      });

      if (!zone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      const result: ZoneDto = {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type,
        category: zone.category,
        amenities: zone.amenities || [],
        mapping_id: zone.mapping_id,
      };

      this.logger.endOperation('getZoneById', operationId, true);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.getZoneById',
        undefined,
        JSON.stringify({ id }),
      );
      this.logger.endOperation('getZoneById', operationId, false);
      throw error;
    }
  }

  /**
   * Get zones by IDs (for bulk operations)
   */
  async getZonesByIds(ids: string[]): Promise<ZoneDto[]> {
    const operationId = this.logger.startOperation('getZonesByIds', { count: ids.length });

    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      const zones = await this.prisma.venue_zones.findMany({
        where: {
          id: { in: ids },
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
          amenities: true,
          mapping_id: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      const result = zones.map(zone => ({
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type,
        category: zone.category,
        amenities: zone.amenities || [],
        mapping_id: zone.mapping_id,
      }));

      this.logger.info(`Retrieved ${result.length} zones by IDs`);
      this.logger.endOperation('getZonesByIds', operationId, true);

      return result;
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.getZonesByIds',
        undefined,
        JSON.stringify({ ids }),
      );
      this.logger.endOperation('getZonesByIds', operationId, false);
      throw error;
    }
  }

  /**
   * Create a new zone
   */
  /**
   * Ensure that adding/updating a zone with `newCapacity` does not make the sum
   * of all zone capacities in the mapping exceed the allowed limit. The limit is
   * the mapping's effective capacity, bounded by the venue's max capacity.
   * `excludeZoneId` is used on update to ignore the zone being modified.
   */
  private async assertZoneCapacityWithinLimit(
    mappingId: string,
    newCapacity: number,
    excludeZoneId?: string,
  ): Promise<void> {
    const mapping = await this.prisma.venue_mappings.findUnique({
      where: { id: mappingId },
      select: {
        effective_capacity: true,
        venues_venue_mappings_venue_idTovenues: {
          select: { max_capacity: true },
        },
      },
    });

    if (!mapping) {
      return; // Existence is validated by callers; nothing to enforce here.
    }

    const venueMax = mapping.venues_venue_mappings_venue_idTovenues?.max_capacity ?? null;
    const effective = mapping.effective_capacity ?? null;

    // The hard ceiling is the smallest defined capacity in the hierarchy.
    const candidates = [effective, venueMax].filter(
      (c): c is number => typeof c === 'number' && c > 0,
    );
    if (candidates.length === 0) {
      return; // No defined limit to enforce.
    }
    const limit = Math.min(...candidates);

    const aggregate = await this.prisma.venue_zones.aggregate({
      where: {
        mapping_id: mappingId,
        ...(excludeZoneId ? { id: { not: excludeZoneId } } : {}),
      },
      _sum: { capacity: true },
    });

    const currentSum = aggregate._sum.capacity ?? 0;
    const projected = currentSum + (newCapacity ?? 0);

    if (projected > limit) {
      const remaining = Math.max(0, limit - currentSum);
      throw new BadRequestException(
        `La capacité totale des zones (${projected}) dépasse la capacité autorisée (${limit}). ` +
          `Capacité restante disponible : ${remaining}.`,
      );
    }
  }

  async createZone(data: CreateZoneDto): Promise<ZoneDto> {
    const operationId = this.logger.startOperation('createZone', { name: data.name, code: data.code });

    try {
      // Check if mapping exists
      const mapping = await this.prisma.venue_mappings.findUnique({
        where: { id: data.mapping_id },
      });

      if (!mapping) {
        throw new NotFoundException(`Venue mapping with ID ${data.mapping_id} not found`);
      }

      // Check if code is unique within the mapping
      const existingZone = await this.prisma.venue_zones.findFirst({
        where: {
          mapping_id: data.mapping_id,
          code: data.code,
        },
      });

      if (existingZone) {
        throw new ConflictException(`Zone with code ${data.code} already exists in this mapping`);
      }

      // Validate parent zone if provided
      if (data.parent_zone_id) {
        const parentZone = await this.prisma.venue_zones.findUnique({
          where: { id: data.parent_zone_id },
        });

        if (!parentZone) {
          throw new NotFoundException(`Parent zone with ID ${data.parent_zone_id} not found`);
        }

        if (parentZone.mapping_id !== data.mapping_id) {
          throw new BadRequestException('Parent zone must belong to the same mapping');
        }
      }

      // Enforce capacity hierarchy: sum of zone capacities must not exceed the
      // mapping's effective capacity (which itself is bounded by the venue capacity).
      await this.assertZoneCapacityWithinLimit(data.mapping_id, data.capacity);

      // Create the zone
      const zone = await this.prisma.venue_zones.create({
        data: {
          mapping_id: data.mapping_id,
          name: data.name,
          code: data.code,
          zone_type: data.zone_type as any,
          category: data.category as any,
          capacity: data.capacity,
          base_price: data.base_price ?? 0,
          currency: data.currency ?? 'TND',
          description: data.description,
          parent_zone_id: data.parent_zone_id,
          level: data.level ?? 0,
          is_accessible: data.is_accessible ?? false,
          requires_special_access: data.requires_special_access ?? false,
          amenities: data.amenities ?? [],
          coordinates: data.coordinates,
          metadata: data.metadata,
          is_active: data.is_active ?? true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
        },
      });

      const result: ZoneDto = {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type,
        category: zone.category,
      };

      this.logger.info(`Created zone: ${result.name} (${result.code})`);
      this.logger.endOperation('createZone', operationId, true);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.createZone',
        undefined,
        JSON.stringify(data),
      );
      this.logger.endOperation('createZone', operationId, false);
      throw error;
    }
  }

  /**
   * Update a zone
   */
  async updateZone(id: string, data: UpdateZoneDto): Promise<ZoneDto> {
    const operationId = this.logger.startOperation('updateZone', { id });

    try {
      // Check if zone exists
      const existingZone = await this.prisma.venue_zones.findUnique({
        where: { id },
      });

      if (!existingZone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      // Validate mapping if it's being changed
      const targetMappingId = data.mapping_id || existingZone.mapping_id;
      if (data.mapping_id && data.mapping_id !== existingZone.mapping_id) {
        const mapping = await this.prisma.venue_mappings.findUnique({
          where: { id: data.mapping_id },
        });

        if (!mapping) {
          throw new NotFoundException(`Venue mapping with ID ${data.mapping_id} not found`);
        }
      }

      // Check if code is unique within the mapping (if code is being updated or mapping is being changed)
      if ((data.code && data.code !== existingZone.code) || (data.mapping_id && data.mapping_id !== existingZone.mapping_id)) {
        const codeToCheck = data.code || existingZone.code;
        const codeExists = await this.prisma.venue_zones.findFirst({
          where: {
            mapping_id: targetMappingId,
            code: codeToCheck,
            id: { not: id },
          },
        });

        if (codeExists) {
          throw new ConflictException(`Zone with code ${codeToCheck} already exists in this mapping`);
        }
      }

      // Validate parent zone if provided
      if (data.parent_zone_id && data.parent_zone_id !== existingZone.parent_zone_id) {
        if (data.parent_zone_id === id) {
          throw new BadRequestException('Zone cannot be its own parent');
        }

        const parentZone = await this.prisma.venue_zones.findUnique({
          where: { id: data.parent_zone_id },
        });

        if (!parentZone) {
          throw new NotFoundException(`Parent zone with ID ${data.parent_zone_id} not found`);
        }

        if (parentZone.mapping_id !== existingZone.mapping_id) {
          throw new BadRequestException('Parent zone must belong to the same mapping');
        }

        // Check for circular references
        let currentParent = parentZone.parent_zone_id;
        while (currentParent) {
          if (currentParent === id) {
            throw new BadRequestException('Circular reference detected in zone hierarchy');
          }
          const parent = await this.prisma.venue_zones.findUnique({
            where: { id: currentParent },
            select: { parent_zone_id: true },
          });
          currentParent = parent?.parent_zone_id || null;
        }
      }

      // Enforce capacity hierarchy when capacity or mapping changes
      if (data.capacity !== undefined || (data.mapping_id && data.mapping_id !== existingZone.mapping_id)) {
        const newCapacity = data.capacity ?? existingZone.capacity;
        await this.assertZoneCapacityWithinLimit(targetMappingId, newCapacity, id);
      }

      // Update the zone
      const zone = await this.prisma.venue_zones.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code }),
          ...(data.zone_type && { zone_type: data.zone_type as any }),
          ...(data.category && { category: data.category as any }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.base_price !== undefined && { base_price: data.base_price }),
          ...(data.currency && { currency: data.currency }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.parent_zone_id !== undefined && { parent_zone_id: data.parent_zone_id }),
          ...(data.level !== undefined && { level: data.level }),
          ...(data.is_accessible !== undefined && { is_accessible: data.is_accessible }),
          ...(data.requires_special_access !== undefined && { requires_special_access: data.requires_special_access }),
          ...(data.amenities !== undefined && { amenities: data.amenities }),
          ...(data.coordinates !== undefined && { coordinates: data.coordinates }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          ...(data.mapping_id !== undefined && { mapping_id: data.mapping_id }),
          updated_at: new Date(),
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
        },
      });

      const result: ZoneDto = {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type,
        category: zone.category,
      };

      this.logger.info(`Updated zone: ${result.name} (${result.code})`);
      this.logger.endOperation('updateZone', operationId, true);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.updateZone',
        undefined,
        JSON.stringify({ id, data }),
      );
      this.logger.endOperation('updateZone', operationId, false);
      throw error;
    }
  }

  /**
   * Get all seats for a zone with their status
   */
  async getZoneSeats(zoneId: string): Promise<Array<{
    id: string;
    seat_number: string;
    row_number: string | null;
    seat_type: string;
    status: string;
    price_modifier: number | null;
    is_accessible: boolean;
    metadata: any;
  }>> {
    const operationId = this.logger.startOperation('getZoneSeats', { zoneId });

    try {
      // Verify zone exists
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id: zoneId },
        select: { id: true, name: true },
      });

      if (!zone) {
        throw new NotFoundException('Zone not found');
      }

      // Get all seats for this zone
      const seats = await this.prisma.seats.findMany({
        where: { zone_id: zoneId },
        select: {
          id: true,
          seat_number: true,
          row_number: true,
          seat_type: true,
          status: true,
          price_modifier: true,
          is_accessible: true,
          metadata: true,
        },
        orderBy: [
          { row_number: 'asc' },
          { seat_number: 'asc' },
        ],
      });

      // Convert Prisma types to return type
      const formattedSeats = seats.map(seat => ({
        id: seat.id,
        seat_number: seat.seat_number,
        row_number: seat.row_number,
        seat_type: seat.seat_type as string,
        status: seat.status as string,
        price_modifier: seat.price_modifier ? Number(seat.price_modifier) : null,
        is_accessible: seat.is_accessible,
        metadata: seat.metadata,
      }));

      this.logger.endOperation(operationId, 'success', true);
      return formattedSeats;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Get zones that have seats
   */
  async getZonesWithSeats(): Promise<ZoneDto[]> {
    const operationId = this.logger.startOperation('getZonesWithSeats');

    try {
      // Get zones that have at least one seat
      const zones = await this.prisma.venue_zones.findMany({
        where: {
          seats: {
            some: {},
          },
          is_active: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          capacity: true,
          base_price: true,
          currency: true,
          is_active: true,
          zone_type: true,
          category: true,
          amenities: true,
          mapping_id: true,
          _count: {
            select: {
              seats: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const zoneDtos: ZoneDto[] = zones.map(zone => ({
        id: zone.id,
        code: zone.code,
        name: zone.name,
        description: zone.description || undefined,
        capacity: zone.capacity || undefined,
        base_price: zone.base_price ? Number(zone.base_price) : undefined,
        currency: zone.currency || undefined,
        is_active: zone.is_active ?? true,
        zone_type: zone.zone_type || undefined,
        category: zone.category || undefined,
        amenities: zone.amenities || undefined,
        mapping_id: zone.mapping_id || undefined,
      }));

      this.logger.endOperation(operationId, 'success', true);
      return zoneDtos;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Delete a zone
   */
  async deleteZone(id: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteZone', { id });

    try {
      // Check if zone exists
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              seats: true,
              access_rights: true,
              subscription_plan_zones: true,
              tickets: true,
            },
          },
        },
      });

      if (!zone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      // Check if zone has dependent records
      if (zone._count.seats > 0) {
        throw new BadRequestException(`Cannot delete zone: ${zone._count.seats} seat(s) are associated with this zone`);
      }

      if (zone._count.access_rights > 0) {
        throw new BadRequestException(`Cannot delete zone: ${zone._count.access_rights} access right(s) are associated with this zone`);
      }

      if (zone._count.subscription_plan_zones > 0) {
        throw new BadRequestException(`Cannot delete zone: ${zone._count.subscription_plan_zones} subscription plan zone(s) are associated with this zone`);
      }

      if (zone._count.tickets > 0) {
        throw new BadRequestException(`Cannot delete zone: ${zone._count.tickets} ticket(s) are associated with this zone`);
      }

      // Check if zone has child zones
      const childZones = await this.prisma.venue_zones.findMany({
        where: { parent_zone_id: id },
      });

      if (childZones.length > 0) {
        throw new BadRequestException(`Cannot delete zone: ${childZones.length} child zone(s) exist. Please delete or reassign them first.`);
      }

      // Delete the zone
      await this.prisma.venue_zones.delete({
        where: { id },
      });

      this.logger.info(`Deleted zone: ${zone.name} (${zone.code})`);
      this.logger.endOperation('deleteZone', operationId, true);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.logErrorEvent(
        error as Error,
        'ZonesService.deleteZone',
        undefined,
        JSON.stringify({ id }),
      );
      this.logger.endOperation('deleteZone', operationId, false);
      throw error;
    }
  }
}

