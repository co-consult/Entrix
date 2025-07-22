"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentRoles = exports.CurrentPermissions = exports.CurrentSessionId = exports.CurrentAuthContext = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    if (data) {
        return user[data];
    }
    return user;
});
exports.CurrentAuthContext = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const authContext = request.authContext;
    if (!authContext) {
        return null;
    }
    if (data) {
        return authContext[data];
    }
    return authContext;
});
exports.CurrentSessionId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.sessionId || null;
});
exports.CurrentPermissions = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.permissions || [];
});
exports.CurrentRoles = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.roles || [];
});
//# sourceMappingURL=current-user.decorator.js.map