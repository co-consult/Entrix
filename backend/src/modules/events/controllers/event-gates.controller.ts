import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventGatesService } from '../services/event-gates.service';

@ApiTags('Event Gates')
@Controller('events')
export class EventGatesController {
  constructor(private readonly eventGatesService: EventGatesService) {}

  @Get(':eventId/gates')
  @ApiOperation({ summary: 'Get all gates for an event' })
  @ApiResponse({ status: 200, description: 'Gates retrieved successfully' })
  async getEventGates(@Param('eventId') eventId: string) {
    return this.eventGatesService.getEventGates(eventId);
  }

  @Get(':eventId/gates/:gateId')
  @ApiOperation({ summary: 'Get specific gate details' })
  @ApiResponse({ status: 200, description: 'Gate details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Gate not found' })
  async getGateById(
    @Param('eventId') eventId: string,
    @Param('gateId') gateId: string,
  ) {
    return this.eventGatesService.getGateById(gateId);
  }

  @Get(':eventId/gates/:gateId/statistics')
  @ApiOperation({ summary: 'Get gate statistics' })
  @ApiResponse({ status: 200, description: 'Gate statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Gate not found' })
  async getGateStatistics(
    @Param('eventId') eventId: string,
    @Param('gateId') gateId: string,
  ) {
    return this.eventGatesService.getGateStatistics(gateId);
  }
}
