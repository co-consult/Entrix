import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EventTicketsService } from '../services/event-tickets.service';
import {
  UpsertEventTicketConfigDto,
  GenerateEventTicketsBatchDto,
} from '../dto/event-tickets.dto';
import { ListEventTicketsQueryDto } from '../dto/list-event-tickets.dto';
import {
  SellEventTicketsDto,
  ListEventTicketSalesQueryDto,
} from '../dto/sell-event-tickets.dto';

@ApiTags('Event Tickets')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORGANIZER_ADMIN')
@ApiBearerAuth()
export class EventTicketsController {
  constructor(private readonly eventTicketsService: EventTicketsService) {}

  @Get(':eventId/tickets')
  @ApiOperation({ summary: 'List tickets for an event (admin, paginated)' })
  async listTickets(
    @Param('eventId') eventId: string,
    @Query() query: ListEventTicketsQueryDto,
  ) {
    return this.eventTicketsService.listEventTickets(eventId, query);
  }

  @Get(':eventId/ticket-configs')
  @ApiOperation({ summary: 'List ticket tiers/configs for an event' })
  async listTicketConfigs(@Param('eventId') eventId: string) {
    return this.eventTicketsService.listTicketConfigs(eventId);
  }

  @Delete(':eventId/ticket-configs/:configId')
  @ApiOperation({ summary: 'Delete or deactivate a ticket tier' })
  async deleteTicketConfig(
    @Param('eventId') eventId: string,
    @Param('configId') configId: string,
  ) {
    return this.eventTicketsService.deleteTicketConfig(eventId, configId);
  }

  @Post(':eventId/ticket-config')
  @ApiOperation({ summary: 'Upsert event ticket configuration' })
  async upsertConfig(
    @Param('eventId') eventId: string,
    @Body() dto: UpsertEventTicketConfigDto,
  ) {
    return this.eventTicketsService.upsertTicketConfig(eventId, dto);
  }

  @Post(':eventId/tickets/generate-batch')
  @ApiOperation({ summary: 'Batch generate digital event tickets with QR codes' })
  async generateBatch(
    @Param('eventId') eventId: string,
    @Body() dto: GenerateEventTicketsBatchDto,
  ) {
    return this.eventTicketsService.generateBatch(eventId, dto);
  }

  @Get(':eventId/tickets/sellable-options')
  @ApiOperation({ summary: 'List sellable ticket options (unsold generated QRs)' })
  async listSellableOptions(@Param('eventId') eventId: string) {
    return this.eventTicketsService.listSellableOptions(eventId);
  }

  @Post(':eventId/tickets/sell')
  @ApiOperation({ summary: 'Sell pre-generated event tickets (counter sale)' })
  async sellTickets(
    @Param('eventId') eventId: string,
    @Body() dto: SellEventTicketsDto,
    @Req() req: { user?: { id?: string; email?: string; first_name?: string; last_name?: string } },
  ) {
    return this.eventTicketsService.sellTickets(eventId, dto, req.user);
  }

  @Get(':eventId/ticket-sales')
  @ApiOperation({ summary: 'List ticket sales for an event' })
  async listTicketSales(
    @Param('eventId') eventId: string,
    @Query() query: ListEventTicketSalesQueryDto,
  ) {
    return this.eventTicketsService.listTicketSales(eventId, query);
  }
}
