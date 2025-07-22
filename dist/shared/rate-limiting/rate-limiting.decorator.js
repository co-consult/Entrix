"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const rate_limiting_guard_1 = require("./rate-limiting.guard");
const RateLimit = (options) => (0, common_1.SetMetadata)(rate_limiting_guard_1.RATE_LIMIT_KEY, options);
exports.RateLimit = RateLimit;
//# sourceMappingURL=rate-limiting.decorator.js.map