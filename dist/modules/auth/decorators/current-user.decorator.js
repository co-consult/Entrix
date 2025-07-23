"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireTrustedDevice = exports.Public = exports.UserPermissions = exports.UserRoles = exports.CurrentUserEmail = exports.CurrentUserId = exports.CurrentUser = exports.TRUST_DEVICE_KEY = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
exports.TRUST_DEVICE_KEY = 'trustDevice';
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    if (data) {
        return user[data];
    }
    const { ...safeUser } = user;
    return safeUser;
});
exports.CurrentUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.id || null;
});
exports.CurrentUserEmail = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.email || null;
});
exports.UserRoles = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.roles || [];
});
exports.UserPermissions = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.permissions || [];
});
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const RequireTrustedDevice = () => (0, common_1.SetMetadata)(exports.TRUST_DEVICE_KEY, true);
exports.RequireTrustedDevice = RequireTrustedDevice;
//# sourceMappingURL=current-user.decorator.js.map