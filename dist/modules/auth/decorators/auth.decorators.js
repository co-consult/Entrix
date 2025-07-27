"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Experimental = exports.FeatureFlag = exports.BusinessMetric = exports.Monitor = exports.TransformOutput = exports.ValidateInput = exports.NoCache = exports.Cache = exports.RiskScore = exports.Sensitive = exports.SecurityLevel = exports.AuditLog = exports.RateLimit = exports.Permissions = exports.Roles = exports.RequireTrustedDevice = exports.RequireMfa = exports.DeviceFingerprint = exports.ClientInfo = exports.SessionId = exports.CurrentSession = exports.CurrentUserId = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
exports.CurrentUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.sub;
});
exports.CurrentSession = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
});
exports.SessionId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sessionId || request.session?.id;
});
exports.ClientInfo = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        ip_address: request.ip || request.connection?.remoteAddress,
        user_agent: request.headers?.['user-agent'],
        device_fingerprint: request.headers?.['x-device-fingerprint'],
        geolocation: request.headers?.['x-geolocation'],
        forwarded_for: request.headers?.['x-forwarded-for'],
    };
});
exports.DeviceFingerprint = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers?.['x-device-fingerprint'] ||
        request.body?.deviceFingerprint ||
        request.query?.deviceFingerprint;
});
const RequireMfa = () => (0, common_1.SetMetadata)('requireMfa', true);
exports.RequireMfa = RequireMfa;
const RequireTrustedDevice = () => (0, common_1.SetMetadata)('requireTrustedDevice', true);
exports.RequireTrustedDevice = RequireTrustedDevice;
const Roles = (...roles) => (0, common_1.SetMetadata)('roles', roles);
exports.Roles = Roles;
const Permissions = (...permissions) => (0, common_1.SetMetadata)('permissions', permissions);
exports.Permissions = Permissions;
const RateLimit = (options) => (0, common_1.SetMetadata)('rateLimit', options);
exports.RateLimit = RateLimit;
const AuditLog = (options) => (0, common_1.SetMetadata)('auditLog', options);
exports.AuditLog = AuditLog;
const SecurityLevel = (level) => (0, common_1.SetMetadata)('securityLevel', level);
exports.SecurityLevel = SecurityLevel;
const Sensitive = (reason) => (0, common_1.SetMetadata)('sensitive', { enabled: true, reason });
exports.Sensitive = Sensitive;
const RiskScore = (options) => (0, common_1.SetMetadata)('riskScore', options);
exports.RiskScore = RiskScore;
const Cache = (options) => (0, common_1.SetMetadata)('cache', options);
exports.Cache = Cache;
const NoCache = () => (0, common_1.SetMetadata)('noCache', true);
exports.NoCache = NoCache;
const ValidateInput = (options) => (0, common_1.SetMetadata)('validateInput', options);
exports.ValidateInput = ValidateInput;
const TransformOutput = (options) => (0, common_1.SetMetadata)('transformOutput', options);
exports.TransformOutput = TransformOutput;
const Monitor = (options = {}) => (0, common_1.SetMetadata)('monitor', { enabled: true, ...options });
exports.Monitor = Monitor;
const BusinessMetric = (metricName, data) => (0, common_1.SetMetadata)('businessMetric', { name: metricName, data });
exports.BusinessMetric = BusinessMetric;
const FeatureFlag = (flagName, defaultValue = false) => (0, common_1.SetMetadata)('featureFlag', { name: flagName, default: defaultValue });
exports.FeatureFlag = FeatureFlag;
const Experimental = (version) => (0, common_1.SetMetadata)('experimental', { enabled: true, version });
exports.Experimental = Experimental;
//# sourceMappingURL=auth.decorators.js.map