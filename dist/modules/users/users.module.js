"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
const users_controller_1 = require("./controllers/users.controller");
const groups_controller_1 = require("./controllers/groups.controller");
const profiles_controller_1 = require("./controllers/profiles.controller");
const anonymous_controller_1 = require("./controllers/anonymous.controller");
const invitations_controller_1 = require("./controllers/invitations.controller");
const users_service_1 = require("./services/users.service");
const groups_service_1 = require("./services/groups.service");
const profiles_service_1 = require("./services/profiles.service");
const anonymous_service_1 = require("./services/anonymous.service");
const invitations_service_1 = require("./services/invitations.service");
const onboarding_service_1 = require("./services/onboarding.service");
const conversion_service_1 = require("./services/conversion.service");
const group_member_guard_1 = require("./guards/group-member.guard");
const group_owner_guard_1 = require("./guards/group-owner.guard");
const welcome_processor_1 = require("./processors/welcome.processor");
const group_invitation_processor_1 = require("./processors/group-invitation.processor");
const anonymous_conversion_processor_1 = require("./processors/anonymous-conversion.processor");
const user_analytics_processor_1 = require("./processors/user-analytics.processor");
const welcome_queue_1 = require("./queues/welcome.queue");
const group_invitation_queue_1 = require("./queues/group-invitation.queue");
const anonymous_conversion_queue_1 = require("./queues/anonymous-conversion.queue");
const user_analytics_queue_1 = require("./queues/user-analytics.queue");
let UsersModule = class UsersModule {
    constructor() {
        console.log('🧑‍🤝‍🧑 Users Module initialized');
        console.log('✅ Services: Users, Groups, Profiles, Anonymous, Invitations');
        console.log('✅ Controllers: 5 REST API endpoints');
        console.log('✅ Guards: Group permissions');
        console.log('✅ Processors: BullMQ job processing');
        console.log('✅ Integration: SharedModule services available');
    }
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
        ],
        controllers: [
            users_controller_1.UsersController,
            groups_controller_1.GroupsController,
            profiles_controller_1.ProfilesController,
            anonymous_controller_1.AnonymousController,
            invitations_controller_1.InvitationsController,
        ],
        providers: [
            users_service_1.UsersService,
            groups_service_1.GroupsService,
            profiles_service_1.ProfilesService,
            anonymous_service_1.AnonymousService,
            invitations_service_1.InvitationsService,
            onboarding_service_1.OnboardingService,
            conversion_service_1.ConversionService,
            group_member_guard_1.GroupMemberGuard,
            group_owner_guard_1.GroupOwnerGuard,
            welcome_processor_1.WelcomeProcessor,
            group_invitation_processor_1.GroupInvitationProcessor,
            anonymous_conversion_processor_1.AnonymousConversionProcessor,
            user_analytics_processor_1.UserAnalyticsProcessor,
            welcome_queue_1.WelcomeQueue,
            group_invitation_queue_1.GroupInvitationQueue,
            anonymous_conversion_queue_1.AnonymousConversionQueue,
            user_analytics_queue_1.UserAnalyticsQueue,
        ],
        exports: [
            users_service_1.UsersService,
            groups_service_1.GroupsService,
            profiles_service_1.ProfilesService,
            anonymous_service_1.AnonymousService,
            conversion_service_1.ConversionService,
            onboarding_service_1.OnboardingService,
            group_member_guard_1.GroupMemberGuard,
            group_owner_guard_1.GroupOwnerGuard,
        ],
    }),
    __metadata("design:paramtypes", [])
], UsersModule);
//# sourceMappingURL=users.module.js.map