"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireCriticalMfa = exports.RequireHighMfa = exports.MfaLevel = exports.RequireMfa = exports.MFA_LEVEL_KEY = exports.REQUIRE_MFA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_MFA_KEY = 'requireMfa';
exports.MFA_LEVEL_KEY = 'mfaLevel';
const RequireMfa = () => (0, common_1.SetMetadata)(exports.REQUIRE_MFA_KEY, true);
exports.RequireMfa = RequireMfa;
const MfaLevel = (level) => (0, common_1.SetMetadata)(exports.MFA_LEVEL_KEY, level);
exports.MfaLevel = MfaLevel;
const RequireHighMfa = () => (0, common_1.SetMetadata)(exports.MFA_LEVEL_KEY, 'high');
exports.RequireHighMfa = RequireHighMfa;
const RequireCriticalMfa = () => (0, common_1.SetMetadata)(exports.MFA_LEVEL_KEY, 'critical');
exports.RequireCriticalMfa = RequireCriticalMfa;
//# sourceMappingURL=require-mfa.decorator.js.map