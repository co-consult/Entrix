"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSalesModule = void 0;
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
const users_module_1 = require("../users/users.module");
const auth_module_1 = require("../auth/auth.module");
const subscription_sales_controller_1 = require("./controllers/subscription-sales.controller");
const subscription_sales_service_1 = require("./services/subscription-sales.service");
const subscription_plans_service_1 = require("./services/subscription-plans.service");
const zones_and_seats_service_1 = require("./services/zones-and-seats.service");
const sales_flow_service_1 = require("./services/sales-flow.service");
let SubscriptionSalesModule = class SubscriptionSalesModule {
};
exports.SubscriptionSalesModule = SubscriptionSalesModule;
exports.SubscriptionSalesModule = SubscriptionSalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
        ],
        controllers: [
            subscription_sales_controller_1.SubscriptionSalesController,
        ],
        providers: [
            subscription_sales_service_1.SubscriptionSalesService,
            subscription_plans_service_1.SubscriptionPlansService,
            zones_and_seats_service_1.ZonesAndSeatsService,
            sales_flow_service_1.SalesFlowService,
        ],
        exports: [
            subscription_sales_service_1.SubscriptionSalesService,
            subscription_plans_service_1.SubscriptionPlansService,
            zones_and_seats_service_1.ZonesAndSeatsService,
            sales_flow_service_1.SalesFlowService,
        ],
    })
], SubscriptionSalesModule);
//# sourceMappingURL=subscription-sales.module.js.map