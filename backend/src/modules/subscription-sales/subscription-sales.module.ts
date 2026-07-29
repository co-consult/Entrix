// src/modules/subscription-sales/subscription-sales.module.ts

import { Module, forwardRef } from '@nestjs/common';

// Services partagés Entrix
import { SharedModule } from '../../shared/shared.module';

// Modules externes
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

// Controllers
import { SubscriptionSalesController } from './controllers/subscription-sales.controller';

// Services
import { SubscriptionSalesService } from './services/subscription-sales.service';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { ZonesAndSeatsService } from './services/zones-and-seats.service';
import { SalesFlowService } from './services/sales-flow.service';
import { SeasonOperationsService } from './services/season-operations.service';
import { SeasonQRMigrationService } from './services/season-qr-migration.service';

/**
 * Module de Vente d'Abonnements Entrix V3.0 - Grade A+
 * 
 * Fonctionnalités :
 * - Vente d'abonnements physiques avec QR codes pré-imprimés
 * - Support clients identifiés et anonymes
 * - Gestion quantités multiples
 * - Conversion anonyme via clés onboarding physiques
 * - Intégration complète avec les modules Users et Auth
 */
@Module({
  imports: [
    // Services partagés (Prisma, Redis, BullMQ, Email, Logger)
    SharedModule,
    
    // Modules avec forwardRef pour éviter dépendances circulaires
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],

  controllers: [
    SubscriptionSalesController,
  ],

  providers: [
    // Services principaux du module
    SubscriptionSalesService,
    SubscriptionPlansService,
    ZonesAndSeatsService,
    SalesFlowService,
    SeasonOperationsService,
    SeasonQRMigrationService,
  ],

  exports: [
    // Export des services pour utilisation dans autres modules
    SubscriptionSalesService,
    SubscriptionPlansService,
    ZonesAndSeatsService,
    SalesFlowService,
    SeasonOperationsService,
    SeasonQRMigrationService,
  ],
})
export class SubscriptionSalesModule {}