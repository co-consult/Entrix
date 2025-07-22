"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingModule = void 0;
const common_1 = require("@nestjs/common");
const rate_limiting_service_1 = require("./rate-limiting.service");
const rate_limiting_guard_1 = require("./rate-limiting.guard");
let RateLimitingModule = class RateLimitingModule {
};
exports.RateLimitingModule = RateLimitingModule;
exports.RateLimitingModule = RateLimitingModule = __decorate([
    (0, common_1.Module)({
        providers: [rate_limiting_service_1.RateLimitingService, rate_limiting_guard_1.RateLimitingGuard],
        exports: [rate_limiting_service_1.RateLimitingService, rate_limiting_guard_1.RateLimitingGuard],
    })
], RateLimitingModule);
//# sourceMappingURL=rate-limiting.module.js.map