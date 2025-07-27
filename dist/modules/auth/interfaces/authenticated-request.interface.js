"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticatedRequest = void 0;
function isAuthenticatedRequest(req) {
    return req.user !== undefined;
}
exports.isAuthenticatedRequest = isAuthenticatedRequest;
//# sourceMappingURL=authenticated-request.interface.js.map