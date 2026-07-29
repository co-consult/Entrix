import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { EventGatesController } from './controllers/event-gates.controller';
import { EventGatesService } from './services/event-gates.service';
import { EventStatisticsController } from './controllers/event-statistics.controller';
import { EventStatisticsService } from './services/event-statistics.service';
import { TicketValidationController } from './controllers/ticket-validation.controller';
import { EventTicketsController } from './controllers/event-tickets.controller';
import { EventTicketsService } from './services/event-tickets.service';
import { TicketValidationService } from './services/ticket-validation.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [
    EventTicketsController,
    EventsController,
    EventGatesController,
    EventStatisticsController,
    TicketValidationController,
  ],
  providers: [
    EventsService,
    EventGatesService,
    EventStatisticsService,
    TicketValidationService,
    EventTicketsService,
  ],
  exports: [
    EventsService,
    EventGatesService,
    EventStatisticsService,
    TicketValidationService,
    EventTicketsService,
  ],
})
export class EventsModule {}
