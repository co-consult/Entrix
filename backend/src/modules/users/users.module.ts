// src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';

// Controllers
import { UsersController } from './controllers/users.controller';
import { GroupsController } from './controllers/groups.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { AnonymousController } from './controllers/anonymous.controller';
import { InvitationsController } from './controllers/invitations.controller';

// Services
import { UsersService } from './services/users.service';
import { GroupsService } from './services/groups.service';
import { ProfilesService } from './services/profiles.service';
import { AnonymousService } from './services/anonymous.service';
import { InvitationsService } from './services/invitations.service';
import { OnboardingService } from './services/onboarding.service';
import { ConversionService } from './services/conversion.service';

// Guards
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupOwnerGuard } from './guards/group-owner.guard';

// Processors (BullMQ)
import { WelcomeProcessor } from './processors/welcome.processor';
import { GroupInvitationProcessor } from './processors/group-invitation.processor';
import { AnonymousConversionProcessor } from './processors/anonymous-conversion.processor';
import { UserAnalyticsProcessor } from './processors/user-analytics.processor';

// Queues
import { WelcomeQueue } from './queues/welcome.queue';
import { GroupInvitationQueue } from './queues/group-invitation.queue';
import { AnonymousConversionQueue } from './queues/anonymous-conversion.queue';
import { UserAnalyticsQueue } from './queues/user-analytics.queue';

@Module({
  imports: [
    SharedModule, // Importe PrismaService, RedisService, BullMqService, EmailService, LoggerService
  ],
  controllers: [
    UsersController,
    GroupsController,
    ProfilesController,
    AnonymousController,
    InvitationsController,
  ],
  providers: [
    // Services principaux
    UsersService,
    GroupsService,
    ProfilesService,
    AnonymousService,
    InvitationsService,
    OnboardingService,
    ConversionService,

    // Guards spécifiques au module
    GroupMemberGuard,
    GroupOwnerGuard,

    // Processors BullMQ
    WelcomeProcessor,
    GroupInvitationProcessor,
    AnonymousConversionProcessor,
    UserAnalyticsProcessor,

    // Queues BullMQ
    WelcomeQueue,
    GroupInvitationQueue,
    AnonymousConversionQueue,
    UserAnalyticsQueue,
  ],
  exports: [
    // Services exportés pour utilisation dans d'autres modules
    UsersService,
    GroupsService,
    ProfilesService,
    AnonymousService,
    ConversionService,
    OnboardingService,
    
    // Guards exportés pour utilisation dans d'autres modules
    GroupMemberGuard,
    GroupOwnerGuard,
  ],
})
export class UsersModule {
  constructor() {
    // Log d'initialisation du module
    console.log('🧑‍🤝‍🧑 Users Module initialized');
    console.log('✅ Services: Users, Groups, Profiles, Anonymous, Invitations');
    console.log('✅ Controllers: 5 REST API endpoints');
    console.log('✅ Guards: Group permissions');
    console.log('✅ Processors: BullMQ job processing');
    console.log('✅ Integration: SharedModule services available');
  }
}