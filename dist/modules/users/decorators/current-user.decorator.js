"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserWithRelations = exports.CurrentUserProfile = exports.CurrentUserGroups = exports.IsUserVerified = exports.CurrentUserFullName = exports.CurrentUserEmail = exports.CurrentUserId = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const enrichedUser = extractCurrentUser(ctx);
    if (!enrichedUser) {
        return null;
    }
    if (data) {
        return enrichedUser[data];
    }
    return enrichedUser;
});
function extractCurrentUser(ctx) {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    const enrichedUser = {
        ...user,
        sessionId: request.sessionId,
        sessionToken: request.headers.authorization?.replace('Bearer ', ''),
        deviceFingerprint: request.headers['x-device-fingerprint'],
        ipAddress: request.ip ||
            request.connection?.remoteAddress ||
            request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'],
        userAgent: request.headers['user-agent'],
    };
    return enrichedUser;
}
exports.CurrentUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    return user?.id;
});
exports.CurrentUserEmail = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    return user?.email;
});
exports.CurrentUserFullName = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    if (!user)
        return '';
    return `${user.firstName} ${user.lastName}`.trim();
});
exports.IsUserVerified = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    if (!user)
        return false;
    return user.isActive && user.emailVerified;
});
exports.CurrentUserGroups = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    return user?.userGroups || [];
});
exports.CurrentUserProfile = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = extractCurrentUser(ctx);
    return user?.profile;
});
function isUserWithRelations(user) {
    return user && user.profile && user.userGroups;
}
exports.isUserWithRelations = isUserWithRelations;
//# sourceMappingURL=current-user.decorator.js.map