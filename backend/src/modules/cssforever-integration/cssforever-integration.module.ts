import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionSalesModule } from '../subscription-sales/subscription-sales.module';
import { OrdersModule } from '../orders/orders.module';
import cssforeverConfig from './config/cssforever.config';
import { CssForeverSubscriptionsController } from './controllers/cssforever-subscriptions.controller';
import { PartnerApiGuard } from './guards/partner-api.guard';
import { CssForeverAuditService } from './services/cssforever-audit.service';
import { CssForeverMapperService } from './services/cssforever-mapper.service';
import { CssForeverLegacySubscriberService } from './services/cssforever-legacy-subscriber.service';
import { CssForeverEligibilityService } from './services/cssforever-eligibility.service';
import { CssForeverSeatStatusService } from './services/cssforever-seat-status.service';
import { CssForeverConfirmService } from './services/cssforever-confirm.service';
import { CssForeverLifecycleService } from './services/cssforever-lifecycle.service';
import { CssForeverReceiptService } from './services/cssforever-receipt.service';

@Module({
  imports: [
    ConfigModule.forFeature(cssforeverConfig),
    SharedModule,
    AuthModule,
    SubscriptionSalesModule,
    OrdersModule,
  ],
  controllers: [CssForeverSubscriptionsController],
  providers: [
    PartnerApiGuard,
    CssForeverAuditService,
    CssForeverMapperService,
    CssForeverLegacySubscriberService,
    CssForeverEligibilityService,
    CssForeverSeatStatusService,
    CssForeverConfirmService,
    CssForeverLifecycleService,
    CssForeverReceiptService,
  ],
  exports: [
    CssForeverMapperService,
    CssForeverLegacySubscriberService,
    CssForeverEligibilityService,
  ],
})
export class CssForeverIntegrationModule {}
