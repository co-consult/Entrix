import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventStatisticsService } from '../services/event-statistics.service';

@ApiTags('Event Statistics')
@Controller('events')
export class EventStatisticsController {
  constructor(private readonly eventStatisticsService: EventStatisticsService) {}

  @Get(':eventId/stats')
  @ApiOperation({ summary: 'Get event statistics (alias for /statistics)' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventStats(@Param('eventId') eventId: string) {
    return this.eventStatisticsService.getEventStatistics(eventId);
  }

  @Get(':eventId/statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventStatistics(@Param('eventId') eventId: string) {
    return this.eventStatisticsService.getEventStatistics(eventId);
  }

  @Get(':eventId/gates/:gateId/statistics')
  @ApiOperation({ summary: 'Get gate statistics for an event' })
  @ApiResponse({ status: 200, description: 'Gate statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event or gate not found' })
  async getGateStatistics(
    @Param('eventId') eventId: string,
    @Param('gateId') gateId: string,
  ) {
    return this.eventStatisticsService.getGateStatistics(eventId, gateId);
  }

  @Get(':eventId/statistics/realtime')
  @ApiOperation({ summary: 'Get real-time event statistics' })
  @ApiResponse({ status: 200, description: 'Real-time statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getRealTimeStats(@Param('eventId') eventId: string) {
    return this.eventStatisticsService.getRealTimeStats(eventId);
  }
}
