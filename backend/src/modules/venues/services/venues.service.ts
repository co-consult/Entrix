// src/modules/venues/services/venues.service.ts
/**
 * Service de gestion des lieux
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

// Services partagés
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';

// DTOs
import { CreateVenueDto, UpdateVenueDto, VenueSearchDto } from '../dto/venue.dto';

// Prisma types
import { Prisma } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('VenuesService');
  }

  /**
   * Get all venues with optional filters
   */
  async getAllVenues(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    try {
      const where: Prisma.venuesWhereInput = {};

      // Search filter - only apply if search term is provided and not empty
      if (params?.search && params.search.trim()) {
        where.OR = [
          { name: { contains: params.search.trim(), mode: 'insensitive' } },
          { description: { contains: params.search.trim(), mode: 'insensitive' } },
          { address: { contains: params.search.trim(), mode: 'insensitive' } },
          { city: { contains: params.search.trim(), mode: 'insensitive' } },
        ];
      }

      // Status filter - only apply if status is explicitly set and not 'all'
      if (params?.status && params.status !== 'all') {
        if (params.status === 'active') {
          where.is_active = true;
        } else if (params.status === 'inactive') {
          where.is_active = false;
        }
      }
      // If no status filter, return all venues (both active and inactive)

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const skip = (page - 1) * limit;

      this.logger.log(`Fetching venues with filters: ${JSON.stringify(where)}, page: ${page}, limit: ${limit}`);

      const [venues, total] = await Promise.all([
        this.prisma.venues.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            _count: {
              select: {
                events: true,
              },
            },
          },
        }),
        this.prisma.venues.count({ where }),
      ]);

      this.logger.log(`Found ${venues.length} venues (total: ${total})`);

      // Get additional counts for each venue (zones and mappings)
      const venuesWithCounts = await Promise.all(
        venues.map(async (venue) => {
          // Get zones count (through mappings)
          const zonesCount = await this.prisma.venue_zones.count({
            where: {
              venue_mappings: {
                venue_id: venue.id,
              },
            },
          });

          // Get mappings count
          const mappingsCount = await this.prisma.venue_mappings.count({
            where: { venue_id: venue.id },
          });

          return {
            id: venue.id,
            name: venue.name,
            slug: venue.slug,
            address: venue.address,
            city: venue.city,
            country: venue.country,
            max_capacity: venue.max_capacity,
            capacity: venue.max_capacity, // Alias for frontend compatibility
            is_active: venue.is_active ?? true,
            status: venue.is_active ?? true ? 'ACTIVE' : 'INACTIVE',
            created_at: venue.created_at,
            updated_at: venue.updated_at,
            _count: {
              events: venue._count.events,
              zones: zonesCount,
              mappings: mappingsCount,
            },
          };
        })
      );

      return {
        data: venuesWithCounts,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching venues: ${error.message}`, error);
      throw new BadRequestException('Error fetching venues');
    }
  }

  /**
   * Get venue by ID
   */
  async getVenueById(id: string) {
    try {
      const venue = await this.prisma.venues.findUnique({
        where: { id },
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      return {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        country: venue.country,
        max_capacity: venue.max_capacity,
        is_active: venue.is_active ?? true,
        status: venue.is_active ? 'ACTIVE' : 'INACTIVE',
        created_at: venue.created_at,
        updated_at: venue.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching venue ${id}: ${error.message}`, error);
      throw new BadRequestException('Error fetching venue');
    }
  }

  /**
   * Create a new venue
   */
  async createVenue(data: CreateVenueDto) {
    try {
      // Check if slug already exists
      const existing = await this.prisma.venues.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new ConflictException('A venue with this slug already exists');
      }

      const venue = await this.prisma.venues.create({
        data: {
          name: data.name,
          slug: data.slug,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country || 'TN',
          latitude: data.latitude ? new Prisma.Decimal(data.latitude) : null,
          longitude: data.longitude ? new Prisma.Decimal(data.longitude) : null,
          max_capacity: data.max_capacity,
          description: data.description,
          images: data.images || [],
          global_amenities: data.global_amenities || [],
          primary_owner_id: data.primary_owner_id,
          primary_manager_id: data.primary_manager_id,
          is_active: true, // Default to active for new venues
        },
      });

      return {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        country: venue.country,
        max_capacity: venue.max_capacity,
        is_active: venue.is_active ?? true,
        status: venue.is_active ? 'ACTIVE' : 'INACTIVE',
        created_at: venue.created_at,
        updated_at: venue.updated_at,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating venue: ${error.message}`, error);
      throw new BadRequestException('Error creating venue');
    }
  }

  /**
   * Update a venue
   */
  async updateVenue(id: string, data: UpdateVenueDto) {
    try {
      const existing = await this.prisma.venues.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Venue not found');
      }

      // Check slug uniqueness if changed
      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await this.prisma.venues.findUnique({
          where: { slug: data.slug },
        });
        if (slugExists) {
          throw new ConflictException('A venue with this slug already exists');
        }
      }

      const venue = await this.prisma.venues.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.address && { address: data.address }),
          ...(data.city && { city: data.city }),
          ...(data.postal_code !== undefined && { postal_code: data.postal_code }),
          ...(data.country && { country: data.country }),
          ...(data.latitude && { latitude: new Prisma.Decimal(data.latitude) }),
          ...(data.longitude && { longitude: new Prisma.Decimal(data.longitude) }),
          ...(data.max_capacity && { max_capacity: data.max_capacity }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.images && { images: data.images }),
          ...(data.global_amenities && { global_amenities: data.global_amenities }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
        },
      });

      return {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        address: venue.address,
        city: venue.city,
        country: venue.country,
        max_capacity: venue.max_capacity,
        is_active: venue.is_active ?? true,
        status: venue.is_active ? 'ACTIVE' : 'INACTIVE',
        created_at: venue.created_at,
        updated_at: venue.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating venue ${id}: ${error.message}`, error);
      throw new BadRequestException('Error updating venue');
    }
  }

  /**
   * Delete a venue
   */
  async deleteVenue(id: string) {
    try {
      const venue = await this.prisma.venues.findUnique({
        where: { id },
      });

      if (!venue) {
        throw new NotFoundException('Lieu introuvable');
      }

      const linkedEvents = await this.prisma.events.count({
        where: { venue_id: id },
      });

      if (linkedEvents > 0) {
        throw new BadRequestException(
          `Impossible de supprimer ce lieu : ${linkedEvents} événement(s) y sont encore associés. ` +
            `Supprimez ou réassignez d'abord ces événements depuis la page Événements.`,
        );
      }

      await this.prisma.venues.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error deleting venue ${id}: ${error.message}`, error);
      throw new BadRequestException('Error deleting venue');
    }
  }

  /**
   * Get venue statistics (zones count, events count, etc.)
   */
  async getVenueStatistics(venueId: string) {
    try {
      // Check if venue exists
      const venue = await this.prisma.venues.findUnique({
        where: { id: venueId },
      });

      if (!venue) {
        throw new NotFoundException(`Venue with ID ${venueId} not found`);
      }

      // Get mappings count
      const mappingsCount = await this.prisma.venue_mappings.count({
        where: { venue_id: venueId },
      });

      // Get zones count (through mappings)
      const zonesCount = await this.prisma.venue_zones.count({
        where: {
          venue_mappings: {
            venue_id: venueId,
          },
        },
      });

      // Get events count
      const eventsCount = await this.prisma.events.count({
        where: { venue_id: venueId },
      });

      // Get active events count
      const activeEventsCount = await this.prisma.events.count({
        where: {
          venue_id: venueId,
          status: {
            in: ['CONFIRMED', 'LIVE', 'PUBLISHED'],
          },
        },
      });

      return {
        venue_id: venueId,
        venue_name: venue.name,
        max_capacity: venue.max_capacity,
        zones_count: zonesCount,
        mappings_count: mappingsCount,
        events_count: eventsCount,
        active_events_count: activeEventsCount,
        is_active: venue.is_active,
      };
    } catch (error) {
      this.logger.error(`Error fetching venue statistics: ${error.message}`, error);
      throw error;
    }
  }
}

