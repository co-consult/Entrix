import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateEventDto, UpdateEventDto, EventResponseDto, EventFiltersDto, EventStatus, EventVisibility } from '../dto/event.dto';

@Injectable()
export class EventsService {
  private readonly logger: LoggerService;
  private static readonly DEFAULT_ORGANIZER_ID = 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
  // Default venue and mapping for football events
  private static readonly DEFAULT_FOOTBALL_VENUE_ID = 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a';
  private static readonly DEFAULT_FOOTBALL_MAPPING_ID = '9f33b2cb-4742-4527-aa38-5f49a969f85d';
  // Default venue and mapping for basketball/volleyball events
  private static readonly DEFAULT_BASKETBALL_VOLLEYBALL_VENUE_ID = '6ab09470-8ee8-42ed-b4fe-f976f54f2ab1';
  private static readonly DEFAULT_BASKETBALL_VOLLEYBALL_MAPPING_ID = '56496292-1fe9-46b0-8fef-befeeba7e4a6';

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EventsService');
  }

  async createEvent(createEventDto: CreateEventDto, organizerId: string): Promise<EventResponseDto> {
    const operationId = this.logger.startOperation('createEvent', { name: createEventDto.name });

    try {
      // Force configured organizer for event ownership
      const effectiveOrganizerId = EventsService.DEFAULT_ORGANIZER_ID;
      // The creator is the authenticated user (req.user.id passed in)
      const creatorUserId = organizerId;
      
      // Determine effective venue and mapping IDs
      let effectiveVenueId = createEventDto.venueId;
      let effectiveMappingId = createEventDto.mappingId;
      
      // Auto-assign venue and mapping for specific sport categories
      const categoryId = createEventDto.category;
      if (categoryId) {
        // Check if this is a football category
        const isFootballCategory = await this.isFootballCategory(categoryId);
        if (isFootballCategory) {
          // Auto-assign default football venue and mapping if not provided
          if (!effectiveVenueId) {
            effectiveVenueId = EventsService.DEFAULT_FOOTBALL_VENUE_ID;
          }
          if (!effectiveMappingId) {
            effectiveMappingId = EventsService.DEFAULT_FOOTBALL_MAPPING_ID;
          }
          if (!effectiveVenueId || !effectiveMappingId) {
            this.logger.info(`Auto-assigning default football venue: ${effectiveVenueId} and mapping: ${effectiveMappingId}`);
          }
        } else {
          // Check if this is a basketball or volleyball category
          const isBasketballOrVolleyballCategory = await this.isBasketballOrVolleyballCategory(categoryId);
          this.logger.info(`Category ${categoryId} is basketball/volleyball: ${isBasketballOrVolleyballCategory}, venue: ${effectiveVenueId}, mapping: ${effectiveMappingId}`);
          if (isBasketballOrVolleyballCategory) {
            // If venue matches the default basketball/volleyball venue, auto-assign the mapping
            if (effectiveVenueId === EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_VENUE_ID && !effectiveMappingId) {
              effectiveMappingId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_MAPPING_ID;
              this.logger.info(`Auto-assigning default basketball/volleyball mapping: ${effectiveMappingId} for venue: ${effectiveVenueId}`);
            } else if (!effectiveVenueId && !effectiveMappingId) {
              // Auto-assign both if neither is provided
              effectiveVenueId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_VENUE_ID;
              effectiveMappingId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_MAPPING_ID;
              this.logger.info(`Auto-assigning default basketball/volleyball venue: ${effectiveVenueId} and mapping: ${effectiveMappingId}`);
            } else if (effectiveVenueId && !effectiveMappingId) {
              // If any venue is selected for basketball/volleyball but no mapping, use the default mapping
              effectiveMappingId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_MAPPING_ID;
              this.logger.info(`Auto-assigning default basketball/volleyball mapping: ${effectiveMappingId} for selected venue: ${effectiveVenueId}`);
            }
          }
        }
      }
      
      // Build the data object - use foreign keys directly, not relation syntax
      const eventData: any = {
        code: this.generateEventCode(createEventDto.name),
        name: createEventDto.name,
        description: createEventDto.description,
        organizer_id: effectiveOrganizerId,
        // Use provided venueId or auto-assigned one, otherwise null
        venue_id: effectiveVenueId || null,
        // Use provided mappingId or auto-assigned one, otherwise null
        mapping_id: effectiveMappingId || null,
        // Use category_id directly (foreign key)
        category_id: createEventDto.category || null,
        scheduled_start: new Date(createEventDto.scheduledStart),
        scheduled_end: new Date(createEventDto.scheduledEnd),
        sales_start: createEventDto.ticketSalesStart ? new Date(createEventDto.ticketSalesStart) : null,
        sales_end: createEventDto.ticketSalesEnd ? new Date(createEventDto.ticketSalesEnd) : null,
        max_capacity: createEventDto.capacityTotal,
        current_capacity: 0,
        status: 'DRAFT',
        visibility: 'PUBLIC',
        created_by: creatorUserId,
        tags: createEventDto.tags || [],
        metadata: createEventDto.metadata || {},
      };

      const event = await this.prisma.events.create({
        data: eventData,
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToResponseDto(event);
    } catch (error: any) {
      this.logger.endOperation(operationId, 'error', error?.message || 'unknown');
      // Map known DB errors to friendly messages
      const rawMessage = String(error?.message || '');
      const code: string | undefined = error?.code;

      // Postgres RAISE EXCEPTION (surfaced as P0001 via Prisma)
      if (code === 'P0001' || rawMessage.includes('exceeds venue mapping capacity') || rawMessage.includes('exceeds venue capacity')) {
        throw new BadRequestException('La capacité de l\'événement dépasse la capacité du lieu sélectionné. Veuillez réduire la capacité ou choisir un autre lieu.');
      }

      // Foreign key constraint (e.g., organizer_id or created_by invalid)
      if (code === 'P2003' || rawMessage.includes('Foreign key constraint')) {
        if (rawMessage.includes('fk_events_created_by')) {
          throw new BadRequestException('Utilisateur créateur invalide. Veuillez vous reconnecter et réessayer.');
        }
        if (rawMessage.includes('fk_events_organizer')) {
          throw new BadRequestException('Organisateur invalide configuré pour la création d\'événement. Contactez l\'administrateur.');
        }
        throw new BadRequestException('Référence invalide lors de la création de l\'événement.');
      }

      // Default fallback
      throw error;
    }
  }

  async getEvents(filters: EventFiltersDto = {}, user?: any): Promise<{ events: EventResponseDto[]; total: number }> {
    const operationId = this.logger.startOperation('getEvents', { filters });

    try {
      const where: any = {};

      // Apply filters
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category_id = filters.category;
      }

      if (filters.venueId) {
        where.venue_id = filters.venueId;
      }

      if (filters.startDate) {
        where.scheduled_start = { gte: new Date(filters.startDate) };
      }

      if (filters.endDate) {
        where.scheduled_end = { lte: new Date(filters.endDate) };
      }

      // Role-based scoping
      const isAdmin = Array.isArray(user?.roles) ? user.roles.includes('ADMIN') : user?.role === 'ADMIN';

      if (isAdmin) {
        // Admins see all events; no extra visibility/status restriction
      } else if (user?.id) {
        // Organizer scope: only events created by this organizer (if your user maps to organizer_id, adjust mapping here)
        where.organizer_id = user.id;
      } else {
        // Public/unauthenticated: only public and currently discoverable events
        where.visibility = 'PUBLIC';
        where.status = { in: [EventStatus.PUBLISHED, EventStatus.LIVE] };
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        this.prisma.events.findMany({
          where,
          include: {
            venues: true,
            organizers: true,
            event_categories: true,
          },
          orderBy: { scheduled_start: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.events.count({ where }),
      ]);

      this.logger.endOperation(operationId, 'success', true);
      return {
        events: events.map(event => this.mapToResponseDto(event)),
        total,
      };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getEventById(id: string, organizerId?: string): Promise<EventResponseDto> {
    const operationId = this.logger.startOperation('getEventById', { id });

    try {
      const event = await this.prisma.events.findUnique({
        where: { id },
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Check access permissions
      if (organizerId && event.organizer_id !== organizerId) {
        if (event.visibility !== 'PUBLIC') {
          throw new NotFoundException('Event not found');
        }
      }

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToResponseDto(event);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, organizerId: string, user?: any): Promise<EventResponseDto> {
    const operationId = this.logger.startOperation('updateEvent', { id });

    try {
      // Check if user is admin - admins can update any event
      const isAdmin = Array.isArray(user?.roles) ? user.roles.includes('ADMIN') : user?.role === 'ADMIN';
      
      // For non-admins, check against the default organizer ID (since all events use DEFAULT_ORGANIZER_ID)
      // For admins, allow updating any event
      const where: any = { id };
      if (!isAdmin) {
        where.organizer_id = EventsService.DEFAULT_ORGANIZER_ID;
      }
      
      const event = await this.prisma.events.findFirst({
        where,
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const updateData: any = {};

      if (updateEventDto.name) updateData.name = updateEventDto.name;
      if (updateEventDto.description) updateData.description = updateEventDto.description;
      
      // Handle venue and mapping - apply auto-assignment for sport categories if not provided
      let effectiveVenueId = updateEventDto.venueId;
      let effectiveMappingId = updateEventDto.mappingId;
      
      // Auto-assign venue and mapping for specific sport categories if missing
      if (!effectiveVenueId || !effectiveMappingId) {
        const categoryId = updateEventDto.category || event.category_id;
        if (categoryId) {
          const isFootballCategory = await this.isFootballCategory(categoryId);
          if (isFootballCategory) {
            // Auto-assign default football venue and mapping if not provided
            if (!effectiveVenueId) {
              effectiveVenueId = EventsService.DEFAULT_FOOTBALL_VENUE_ID;
              this.logger.info(`Auto-assigning default football venue during update: ${effectiveVenueId}`);
            }
            if (!effectiveMappingId) {
              effectiveMappingId = EventsService.DEFAULT_FOOTBALL_MAPPING_ID;
              this.logger.info(`Auto-assigning default football mapping during update: ${effectiveMappingId}`);
            }
          } else {
            // Check if this is a basketball or volleyball category
            const isBasketballOrVolleyballCategory = await this.isBasketballOrVolleyballCategory(categoryId);
            if (isBasketballOrVolleyballCategory) {
              // Auto-assign default basketball/volleyball venue and mapping if not provided
              if (!effectiveVenueId) {
                effectiveVenueId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_VENUE_ID;
                this.logger.info(`Auto-assigning default basketball/volleyball venue during update: ${effectiveVenueId}`);
              }
              if (!effectiveMappingId) {
                effectiveMappingId = EventsService.DEFAULT_BASKETBALL_VOLLEYBALL_MAPPING_ID;
                this.logger.info(`Auto-assigning default basketball/volleyball mapping during update: ${effectiveMappingId}`);
              }
            }
          }
        }
      }
      
      if (effectiveVenueId) updateData.venue_id = effectiveVenueId;
      if (effectiveMappingId) updateData.mapping_id = effectiveMappingId;
      
      if (updateEventDto.scheduledStart) updateData.scheduled_start = new Date(updateEventDto.scheduledStart);
      if (updateEventDto.scheduledEnd) updateData.scheduled_end = new Date(updateEventDto.scheduledEnd);
      if (updateEventDto.capacityTotal) updateData.max_capacity = updateEventDto.capacityTotal;
      if (updateEventDto.ticketSalesStart) updateData.sales_start = new Date(updateEventDto.ticketSalesStart);
      if (updateEventDto.ticketSalesEnd) updateData.sales_end = new Date(updateEventDto.ticketSalesEnd);
      if (updateEventDto.tags) updateData.tags = updateEventDto.tags;
      if (updateEventDto.metadata) updateData.metadata = updateEventDto.metadata;
      if (updateEventDto.category) updateData.category_id = updateEventDto.category;

      const savedEvent = await this.prisma.events.update({
        where: { id },
        data: updateData,
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToResponseDto(savedEvent);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async deleteEvent(id: string, user: any): Promise<void> {
    const operationId = this.logger.startOperation('deleteEvent', { id });

    try {
      const isAdmin = Array.isArray(user?.roles) ? user.roles.includes('ADMIN') : user?.role === 'ADMIN';
      const where: any = { id };
      if (!isAdmin && user?.id) {
        // Restrict to own events for non-admins
        where.organizer_id = user.id;
      }
      const event = await this.prisma.events.findFirst({ where });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      await this.prisma.events.delete({
        where: { id },
      });

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  // Mobile app specific endpoints
  async getAvailableEvents(): Promise<EventResponseDto[]> {
    const operationId = this.logger.startOperation('getAvailableEvents');

    try {
      // Get start and end of today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

      const events = await this.prisma.events.findMany({
        where: {
          visibility: 'PUBLIC',
          status: { in: [EventStatus.PUBLISHED, EventStatus.LIVE] },
          // Only events scheduled for today
          scheduled_start: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
        orderBy: { scheduled_start: 'asc' },
      });

      this.logger.endOperation(operationId, 'success', true);
      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getActiveEvents(): Promise<EventResponseDto[]> {
    const operationId = this.logger.startOperation('getActiveEvents');

    try {
      const events = await this.prisma.events.findMany({
        where: {
          status: EventStatus.LIVE,
          scheduled_start: { lte: new Date() },
          scheduled_end: { gte: new Date() },
        },
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
        orderBy: { scheduled_start: 'asc' },
      });

      this.logger.endOperation(operationId, 'success', true);
      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getEventBySlug(slug: string): Promise<EventResponseDto> {
    const operationId = this.logger.startOperation('getEventBySlug', { slug });

    try {
      const event = await this.prisma.events.findUnique({
        where: { code: slug },
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToResponseDto(event);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async updateEventStatus(id: string, status: EventStatus, user: any): Promise<EventResponseDto> {
    const operationId = this.logger.startOperation('updateEventStatus', { id, status });

    try {
      // Admins can update any event; organizer admins are scoped to their own
      const isAdmin = Array.isArray(user?.roles) ? user.roles.includes('ADMIN') : user?.role === 'ADMIN';
      const where: any = { id };
      if (!isAdmin) {
        where.organizer_id = user?.id;
      }

      const event = await this.prisma.events.findFirst({ where });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Validate status transition
      this.validateStatusTransition(event.status as EventStatus, status);

      const savedEvent = await this.prisma.events.update({
        where: { id },
        data: { status: status as any },
        include: {
          venues: true,
          organizers: true,
          event_categories: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToResponseDto(savedEvent);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async getEventCapacity(id: string): Promise<{ total: number; current: number; available: number }> {
    const operationId = this.logger.startOperation('getEventCapacity', { id });

    try {
      const event = await this.prisma.events.findUnique({
        where: { id },
        select: { max_capacity: true, current_capacity: true },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      this.logger.endOperation(operationId, 'success', true);
      return {
        total: event.max_capacity || 0,
        current: event.current_capacity || 0,
        available: (event.max_capacity || 0) - (event.current_capacity || 0),
      };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  async incrementEventCapacity(id: string, increment: number = 1): Promise<void> {
    const operationId = this.logger.startOperation('incrementEventCapacity', { id, increment });

    try {
      await this.prisma.events.update({
        where: { id },
        data: {
          current_capacity: {
            increment,
          },
        },
      });

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Check if a category ID or code represents a football category
   */
  private async isFootballCategory(categoryIdOrCode: string): Promise<boolean> {
    try {
      // Try to find the category by ID first, then by code
      const category = await this.prisma.event_categories.findFirst({
        where: {
          OR: [
            { id: categoryIdOrCode },
            { code: categoryIdOrCode },
          ],
        },
        select: {
          code: true,
          name: true,
        },
      });

      if (!category) {
        return false;
      }

      // Check if it's a football category by code or name
      const codeLower = category.code?.toLowerCase() || '';
      const nameLower = category.name?.toLowerCase() || '';
      
      return codeLower.includes('foot') || 
             codeLower.includes('football') || 
             nameLower.includes('foot') || 
             nameLower.includes('football');
    } catch (error) {
      this.logger.warn(`Error checking if category is football: ${error}`);
      return false;
    }
  }

  /**
   * Check if a category ID or code represents a basketball or volleyball category
   */
  private async isBasketballOrVolleyballCategory(categoryIdOrCode: string): Promise<boolean> {
    try {
      // Try to find the category by ID first, then by code
      const category = await this.prisma.event_categories.findFirst({
        where: {
          OR: [
            { id: categoryIdOrCode },
            { code: categoryIdOrCode },
          ],
        },
        select: {
          code: true,
          name: true,
        },
      });

      if (!category) {
        return false;
      }

      // Check if it's a basketball or volleyball category by code or name
      const codeLower = category.code?.toLowerCase() || '';
      const nameLower = category.name?.toLowerCase() || '';
      
      return codeLower.includes('basket') || 
             codeLower.includes('basketball') ||
             codeLower.includes('volley') ||
             codeLower.includes('volleyball') ||
             nameLower.includes('basket') || 
             nameLower.includes('basketball') ||
             nameLower.includes('volley') ||
             nameLower.includes('volleyball');
    } catch (error) {
      this.logger.warn(`Error checking if category is basketball/volleyball: ${error}`);
      return false;
    }
  }

  private generateEventCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50) + '-' + Date.now().toString().slice(-6);
  }

  private validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
    const validTransitions = {
      [EventStatus.DRAFT]: [EventStatus.SCHEDULED, EventStatus.CANCELLED],
      [EventStatus.SCHEDULED]: [EventStatus.CONFIRMED, EventStatus.CANCELLED, EventStatus.POSTPONED, EventStatus.RESCHEDULED],
      [EventStatus.CONFIRMED]: [EventStatus.PUBLISHED, EventStatus.CANCELLED, EventStatus.POSTPONED, EventStatus.RESCHEDULED],
      [EventStatus.PUBLISHED]: [EventStatus.LIVE, EventStatus.CANCELLED, EventStatus.POSTPONED, EventStatus.RESCHEDULED],
      [EventStatus.LIVE]: [EventStatus.FINISHED, EventStatus.SUSPENDED],
      [EventStatus.FINISHED]: [], // Final state
      [EventStatus.CANCELLED]: [], // Final state
      [EventStatus.POSTPONED]: [EventStatus.SCHEDULED, EventStatus.CONFIRMED, EventStatus.CANCELLED],
      [EventStatus.SUSPENDED]: [EventStatus.LIVE, EventStatus.CANCELLED],
      [EventStatus.RESCHEDULED]: [EventStatus.SCHEDULED, EventStatus.CONFIRMED, EventStatus.CANCELLED],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      const userFriendlyMessage = this.getUserFriendlyTransitionMessage(currentStatus, newStatus);
      throw new BadRequestException(userFriendlyMessage);
    }
  }

  private getUserFriendlyTransitionMessage(currentStatus: EventStatus, newStatus: EventStatus): string {
    const statusMessages = {
      [EventStatus.DRAFT]: 'draft',
      [EventStatus.SCHEDULED]: 'scheduled',
      [EventStatus.CONFIRMED]: 'confirmed',
      [EventStatus.PUBLISHED]: 'published',
      [EventStatus.LIVE]: 'live',
      [EventStatus.FINISHED]: 'finished',
      [EventStatus.CANCELLED]: 'cancelled',
      [EventStatus.POSTPONED]: 'postponed',
      [EventStatus.SUSPENDED]: 'suspended',
      [EventStatus.RESCHEDULED]: 'rescheduled',
    };

    const currentStatusText = statusMessages[currentStatus] || currentStatus.toLowerCase();
    const newStatusText = statusMessages[newStatus] || newStatus.toLowerCase();

    // Provide specific guidance based on the current status
    const guidance = this.getStatusTransitionGuidance(currentStatus);
    
    return `Cannot change event status from "${currentStatusText}" to "${newStatusText}". ${guidance}`;
  }

  private getStatusTransitionGuidance(currentStatus: EventStatus): string {
    switch (currentStatus) {
      case EventStatus.DRAFT:
        return 'You can only schedule the event or cancel it from draft status.';
      case EventStatus.SCHEDULED:
        return 'You can confirm the event, cancel it, postpone it, or reschedule it.';
      case EventStatus.CONFIRMED:
        return 'You can publish the event, cancel it, postpone it, or reschedule it.';
      case EventStatus.PUBLISHED:
        return 'You can start the live event, cancel it, postpone it, or reschedule it.';
      case EventStatus.LIVE:
        return 'You can only finish the event or suspend it while it\'s live.';
      case EventStatus.FINISHED:
        return 'This event is already finished and cannot be changed.';
      case EventStatus.CANCELLED:
        return 'This event is cancelled and cannot be changed.';
      case EventStatus.POSTPONED:
        return 'You can reschedule the event, confirm it, or cancel it.';
      case EventStatus.SUSPENDED:
        return 'You can resume the live event or cancel it.';
      case EventStatus.RESCHEDULED:
        return 'You can schedule the event, confirm it, or cancel it.';
      default:
        return 'Please check the event status transition rules.';
    }
  }

  private mapToResponseDto(event: any): EventResponseDto {
    const category = event.event_categories || null;
    return {
      id: event.id,
      name: event.name,
      displayName: event.name,
      subtitle: undefined,
      description: event.description || '',
      shortDescription: event.description?.substring(0, 200),
      type: (event as any)?.type || undefined,
      category: category?.name || 'Sans catégorie',
      categoryId: event.category_id || undefined,
      categoryCode: category?.code || undefined,
      categoryColorPrimary: category?.color_primary || undefined,
      categoryColorSecondary: category?.color_secondary || undefined,
      subcategory: undefined,
      venueId: event.venue_id,
      mappingId: event.mapping_id || undefined,
      venueName: event.venues?.name || '',
      scheduledStart: event.scheduled_start.toISOString(),
      scheduledEnd: event.scheduled_end.toISOString(),
      doorsOpen: undefined,
      checkInStart: undefined,
      capacityTotal: event.max_capacity,
      capacityCurrent: event.current_capacity,
      ticketSalesStart: event.sales_start?.toISOString(),
      ticketSalesEnd: event.sales_end?.toISOString(),
      earlyBirdEnd: undefined,
      status: event.status as EventStatus,
      visibility: event.visibility as EventVisibility,
      featuredImageUrl: undefined,
      coverImageUrl: undefined,
      galleryUrls: undefined,
      tags: event.tags || [],
      createdAt: event.created_at.toISOString(),
      updatedAt: event.updated_at.toISOString(),
    };
  }

  async getEventCategories(): Promise<{ success: boolean; data: any[]; message?: string }> {
    try {
      const categories = await this.prisma.event_categories.findMany({
        where: {
          is_active: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          default_duration: true,
          default_capacity: true,
          requires_referee: true,
          allows_draw: true,
          has_overtime: true,
          has_penalties: true,
          icon_url: true,
          color_primary: true,
          color_secondary: true,
          default_ticket_price: true,
          currency: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: categories.map(cat => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          description: cat.description,
          default_duration: cat.default_duration,
          default_capacity: cat.default_capacity,
          requires_referee: cat.requires_referee,
          allows_draw: cat.allows_draw,
          has_overtime: cat.has_overtime,
          has_penalties: cat.has_penalties,
          icon_url: cat.icon_url,
          color_primary: cat.color_primary,
          color_secondary: cat.color_secondary,
          default_ticket_price: cat.default_ticket_price ? Number(cat.default_ticket_price) : null,
          currency: cat.currency,
        })),
        message: `Found ${categories.length} active category(ies)`,
      };
    } catch (error) {
      this.logger.error('Error fetching event categories', error);
      throw new BadRequestException('Failed to fetch event categories');
    }
  }
}
