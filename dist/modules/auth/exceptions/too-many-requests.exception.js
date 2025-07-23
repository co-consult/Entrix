"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequestsException = void 0;
const common_1 = require("@nestjs/common");
class TooManyRequestsException extends common_1.HttpException {
    constructor(message, retryAfter) {
        const response = {
            success: false,
            error: {
                code: 'TOO_MANY_REQUESTS',
                message: message || 'Trop de requêtes',
                retryAfter,
                timestamp: new Date().toISOString(),
            },
        };
        super(response, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.TooManyRequestsException = TooManyRequestsException;
//# sourceMappingURL=too-many-requests.exception.js.map