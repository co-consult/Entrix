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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireScopes = exports.Experimental = exports.FeatureFlag = exports.BusinessMetric = exports.Monitor = exports.TransformOutput = exports.ValidateInput = exports.NoCache = exports.Cache = exports.RiskScore = exports.Sensitive = exports.SecurityLevel = exports.AuditLog = exports.RateLimit = exports.Permissions = exports.Roles = exports.RequireTrustedDevice = exports.RequireMfa = exports.DeviceFingerprint = exports.ClientInfo = exports.SessionId = exports.CurrentSession = exports.CurrentUserId = exports.CurrentUser = exports.IS_PUBLIC_KEY = exports.Public = void 0;
var public_decorator_1 = require("./public.decorator");
Object.defineProperty(exports, "Public", { enumerable: true, get: function () { return public_decorator_1.Public; } });
Object.defineProperty(exports, "IS_PUBLIC_KEY", { enumerable: true, get: function () { return public_decorator_1.IS_PUBLIC_KEY; } });
var auth_decorators_1 = require("./auth.decorators");
Object.defineProperty(exports, "CurrentUser", { enumerable: true, get: function () { return auth_decorators_1.CurrentUser; } });
Object.defineProperty(exports, "CurrentUserId", { enumerable: true, get: function () { return auth_decorators_1.CurrentUserId; } });
Object.defineProperty(exports, "CurrentSession", { enumerable: true, get: function () { return auth_decorators_1.CurrentSession; } });
Object.defineProperty(exports, "SessionId", { enumerable: true, get: function () { return auth_decorators_1.SessionId; } });
Object.defineProperty(exports, "ClientInfo", { enumerable: true, get: function () { return auth_decorators_1.ClientInfo; } });
Object.defineProperty(exports, "DeviceFingerprint", { enumerable: true, get: function () { return auth_decorators_1.DeviceFingerprint; } });
Object.defineProperty(exports, "RequireMfa", { enumerable: true, get: function () { return auth_decorators_1.RequireMfa; } });
Object.defineProperty(exports, "RequireTrustedDevice", { enumerable: true, get: function () { return auth_decorators_1.RequireTrustedDevice; } });
Object.defineProperty(exports, "Roles", { enumerable: true, get: function () { return auth_decorators_1.Roles; } });
Object.defineProperty(exports, "Permissions", { enumerable: true, get: function () { return auth_decorators_1.Permissions; } });
Object.defineProperty(exports, "RateLimit", { enumerable: true, get: function () { return auth_decorators_1.RateLimit; } });
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return auth_decorators_1.AuditLog; } });
Object.defineProperty(exports, "SecurityLevel", { enumerable: true, get: function () { return auth_decorators_1.SecurityLevel; } });
Object.defineProperty(exports, "Sensitive", { enumerable: true, get: function () { return auth_decorators_1.Sensitive; } });
Object.defineProperty(exports, "RiskScore", { enumerable: true, get: function () { return auth_decorators_1.RiskScore; } });
Object.defineProperty(exports, "Cache", { enumerable: true, get: function () { return auth_decorators_1.Cache; } });
Object.defineProperty(exports, "NoCache", { enumerable: true, get: function () { return auth_decorators_1.NoCache; } });
Object.defineProperty(exports, "ValidateInput", { enumerable: true, get: function () { return auth_decorators_1.ValidateInput; } });
Object.defineProperty(exports, "TransformOutput", { enumerable: true, get: function () { return auth_decorators_1.TransformOutput; } });
Object.defineProperty(exports, "Monitor", { enumerable: true, get: function () { return auth_decorators_1.Monitor; } });
Object.defineProperty(exports, "BusinessMetric", { enumerable: true, get: function () { return auth_decorators_1.BusinessMetric; } });
Object.defineProperty(exports, "FeatureFlag", { enumerable: true, get: function () { return auth_decorators_1.FeatureFlag; } });
Object.defineProperty(exports, "Experimental", { enumerable: true, get: function () { return auth_decorators_1.Experimental; } });
__exportStar(require("./rate-limit.decorator"), exports);
__exportStar(require("./audit-log.decorator"), exports);
var api_key_guard_1 = require("../guards/api-key.guard");
Object.defineProperty(exports, "RequireScopes", { enumerable: true, get: function () { return api_key_guard_1.RequireScopes; } });
//# sourceMappingURL=index.js.map