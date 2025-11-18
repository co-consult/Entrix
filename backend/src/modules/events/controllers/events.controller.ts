import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import { CreateEventDto, UpdateEventDto, EventResponseDto, EventFiltersDto, EventStatus } from '../dto/event.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully', type: EventResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.createEvent(createEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get events with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, enum: EventStatus, description: 'Event type filter' })
  @ApiQuery({ name: 'category', required: false, description: 'Category filter' })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus, description: 'Status filter' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Venue ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size', type: Number })
  async getEvents(
    @Query() filters: EventFiltersDto,
    @Request() req: any,
  ): Promise<{ events: EventResponseDto[]; total: number }> {
    // Pass the full user; service will apply role-based scoping
    return this.eventsService.getEvents(filters, req.user);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all events with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEventsAdmin(
    @Query() filters: EventFiltersDto,
    @Request() req: any,
  ): Promise<{ events: EventResponseDto[]; total: number }> {
    return this.eventsService.getEvents(filters, req.user);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available events for mobile app' })
  @ApiResponse({ status: 200, description: 'Available events retrieved successfully', type: [EventResponseDto] })
  async getAvailableEvents(): Promise<EventResponseDto[]> {
    return this.eventsService.getAvailableEvents();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active events' })
  @ApiResponse({ status: 200, description: 'Active events retrieved successfully', type: [EventResponseDto] })
  async getActiveEvents(): Promise<EventResponseDto[]> {
    return this.eventsService.getActiveEvents();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all event categories' })
  @ApiResponse({ status: 200, description: 'Event categories retrieved successfully' })
  async getEventCategories(): Promise<{ success: boolean; data: any[]; message?: string }> {
    return this.eventsService.getEventCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<EventResponseDto> {
    const organizerId = req.user?.id;
    return this.eventsService.getEventById(id, organizerId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventBySlug(@Param('slug') slug: string): Promise<EventResponseDto> {
    return this.eventsService.getEventBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ): Promise<EventResponseDto> {
    return this.eventsService.updateEvent(id, updateEventDto, req.user.id, req.user);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event status' })
  @ApiResponse({ status: 200, description: 'Event status updated successfully', type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateEventStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @Request() req: any,
  ): Promise<EventResponseDto> {
    // Pass full user so service can decide scoping based on roles
    return this.eventsService.updateEventStatus(id, status, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteEvent(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.eventsService.deleteEvent(id, req.user);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get event capacity information' })
  @ApiResponse({ status: 200, description: 'Capacity information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventCapacity(@Param('id') id: string): Promise<{ total: number; current: number; available: number }> {
    return this.eventsService.getEventCapacity(id);
  }
}
