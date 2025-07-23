"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientInfo = exports.DeviceFingerprint = exports.SessionId = exports.CurrentSession = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentSession = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    const sessionContext = {
        sessionId: user.sessionId || 'unknown',
        deviceFingerprint: user.deviceFingerprint,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers?.['user-agent'] || '',
        issuedAt: user.iat || 0,
        expiresAt: user.exp || 0,
    };
    if (data) {
        return sessionContext[data];
    }
    return sessionContext;
});
exports.SessionId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.sessionId || null;
});
exports.DeviceFingerprint = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const headerFingerprint = request.headers?.['x-device-fingerprint'];
    if (headerFingerprint) {
        return headerFingerprint;
    }
    const user = request.user;
    return user?.deviceFingerprint || null;
});
exports.ClientInfo = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const clientInfo = {
        ip: request.ip || 'unknown',
        userAgent: request.headers?.['user-agent'] || '',
    };
    if (data) {
        return clientInfo[data];
    }
    return clientInfo;
});
//# sourceMappingURL=current-session.decorator.js.map