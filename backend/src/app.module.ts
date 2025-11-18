import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionSalesModule } from './modules/subscription-sales/subscription-sales.module';
import { QRCodesModule } from './modules/qr-codes/qr-codes.module';
import { ZonesModule } from './modules/zones/zones.module';
import { VenuesModule } from './modules/venues/venues.module';
import { EventsModule } from './modules/events/events.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { OrdersModule } from './modules/orders/orders.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Module partagé avec tous les services communs
    SharedModule,
    UsersModule,
    // Modules métier
    AuthModule,
    SubscriptionSalesModule,
    QRCodesModule,
    ZonesModule,
    VenuesModule,
    EventsModule,
    AccessControlModule,
    OrdersModule,
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