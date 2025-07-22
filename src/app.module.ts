import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppController } from './app.controller';

// Import des modules métier (à créer)
// import { AuthModule } from './modules/auth/auth.module';
// import { OrganizersModule } from './modules/organizers/organizers.module';
// import { EventsModule } from './modules/events/events.module';
// import { TicketsModule } from './modules/tickets/tickets.module';
// import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Module partagé avec tous les services communs
    SharedModule,
    UsersModule,
    // Modules métier
    AuthModule,
    // OrganizersModule,
    // EventsModule,
    // TicketsModule,
    // PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    // Intercepteur global pour le logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Filtre global pour les exceptions
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}