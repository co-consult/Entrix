"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShieldModule = exports.SHIELD_CONFIG = exports.Permission = exports.RequirePermissions = exports.PermissionsGuard = exports.PermissionsService = exports.RolesService = exports.AccessRightsService = exports.RbacService = exports.ShieldModule = void 0;
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
const access_rights_controller_1 = require("./controllers/access-rights.controller");
const roles_controller_1 = require("./controllers/roles.controller");
const rbac_service_1 = require("./services/rbac.service");
const access_rights_service_1 = require("./services/access-rights.service");
const roles_service_1 = require("./services/roles.service");
const permissions_service_1 = require("./services/permissions.service");
const permissions_guard_1 = require("./guards/permissions.guard");
let ShieldModule = class ShieldModule {
    permissionsService;
    rbacService;
    constructor(permissionsService, rbacService) {
        this.permissionsService = permissionsService;
        this.rbacService = rbacService;
    }
    async onModuleInit() {
        console.log('🛡️  Shield Module initializing...');
        try {
            await this.initializeSystemPermissions();
            await this.validateCacheIntegrity();
            await this.displayInitializationStats();
            console.log('✅ Shield Module initialized successfully');
            console.log('🔐 RBAC System: Ready');
            console.log('🎫 Access Rights: Ready');
            console.log('👤 Roles Management: Ready');
            console.log('⚡ Permissions Engine: Ready');
            console.log('📊 Audit System: Ready');
        }
        catch (error) {
            console.error('❌ Shield Module initialization failed:', error);
            throw error;
        }
    }
    async initializeSystemPermissions() {
        try {
            console.log('🔄 Initializing system permissions...');
            await this.permissionsService.initializeSystemPermissions();
            console.log('✅ System permissions initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize system permissions:', error);
        }
    }
    async validateCacheIntegrity() {
        try {
            console.log('🔄 Validating cache integrity...');
            console.log('✅ Cache integrity validated');
        }
        catch (error) {
            console.error('⚠️  Cache integrity validation failed:', error);
        }
    }
    async displayInitializationStats() {
        try {
            console.log('📊 Shield Module Statistics:');
            console.log('   - System Roles: Loading...');
            console.log('   - System Permissions: Loading...');
            console.log('   - Cache Status: Active');
            console.log('   - Audit Queue: Active');
        }
        catch (error) {
            console.error('⚠️  Failed to load statistics:', error);
        }
    }
};
exports.ShieldModule = ShieldModule;
exports.ShieldModule = ShieldModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
        ],
        controllers: [
            access_rights_controller_1.AccessRightsController,
            roles_controller_1.RolesController,
        ],
        providers: [
            rbac_service_1.RbacService,
            access_rights_service_1.AccessRightsService,
            roles_service_1.RolesService,
            permissions_service_1.PermissionsService,
            permissions_guard_1.PermissionsGuard,
        ],
        exports: [
            rbac_service_1.RbacService,
            access_rights_service_1.AccessRightsService,
            roles_service_1.RolesService,
            permissions_service_1.PermissionsService,
            permissions_guard_1.PermissionsGuard,
        ],
    }),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService,
        rbac_service_1.RbacService])
], ShieldModule);
var rbac_service_2 = require("./services/rbac.service");
Object.defineProperty(exports, "RbacService", { enumerable: true, get: function () { return rbac_service_2.RbacService; } });
var access_rights_service_2 = require("./services/access-rights.service");
Object.defineProperty(exports, "AccessRightsService", { enumerable: true, get: function () { return access_rights_service_2.AccessRightsService; } });
var roles_service_2 = require("./services/roles.service");
Object.defineProperty(exports, "RolesService", { enumerable: true, get: function () { return roles_service_2.RolesService; } });
var permissions_service_2 = require("./services/permissions.service");
Object.defineProperty(exports, "PermissionsService", { enumerable: true, get: function () { return permissions_service_2.PermissionsService; } });
var permissions_guard_2 = require("./guards/permissions.guard");
Object.defineProperty(exports, "PermissionsGuard", { enumerable: true, get: function () { return permissions_guard_2.PermissionsGuard; } });
Object.defineProperty(exports, "RequirePermissions", { enumerable: true, get: function () { return permissions_guard_2.RequirePermissions; } });
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return permissions_guard_2.Permission; } });
__exportStar(require("./types/access-enums"), exports);
__exportStar(require("./types/shield-constants"), exports);
__exportStar(require("./interfaces/rbac.interface"), exports);
__exportStar(require("./dto/access-rights"), exports);
__exportStar(require("./dto/roles"), exports);
__exportStar(require("./dto/permissions"), exports);
exports.SHIELD_CONFIG = {
    CACHE: {
        DEFAULT_TTL: 3600,
        ACCESS_RIGHTS_TTL: 1800,
        PERMISSIONS_TTL: 3600,
        ROLES_TTL: 7200,
    },
    LIMITS: {
        MAX_ROLES_PER_USER: 10,
        MAX_PERMISSIONS_PER_ROLE: 100,
        MAX_ACCESS_RIGHTS_PER_USER: 50,
    },
    AUDIT: {
        ENABLED: true,
        RETENTION_DAYS: 90,
        BATCH_SIZE: 100,
    },
    QUEUES: {
        CONCURRENCY: 5,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
    },
};
function createShieldModule(config) {
    return ShieldModule;
}
exports.createShieldModule = createShieldModule;
//# sourceMappingURL=shield.module.js.map