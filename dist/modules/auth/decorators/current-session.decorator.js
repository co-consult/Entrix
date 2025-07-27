"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientInfo = exports.DeviceFingerprint = exports.SessionId = exports.CurrentSession = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentSession = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const sessionContext = {
        sessionId: request.sessionId || request.user?.sessionId,
        deviceFingerprint: request.deviceFingerprint || request.headers['x-device-fingerprint'],
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers['user-agent'],
        geolocation: request.geolocation,
    };
    if (data) {
        return sessionContext[data];
    }
    return sessionContext;
});
exports.SessionId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.sessionId || request.user?.sessionId || null;
});
exports.DeviceFingerprint = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.deviceFingerprint ||
        request.headers['x-device-fingerprint'] ||
        request.user?.deviceFingerprint ||
        null;
});
exports.ClientInfo = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        ip: request.ip || request.connection?.remoteAddress || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
        deviceFingerprint: request.deviceFingerprint || request.headers['x-device-fingerprint'],
    };
});
//# sourceMappingURL=current-session.decorator.js.map