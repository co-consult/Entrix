"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipMfa = exports.RequireMfa = exports.MfaRequired = exports.MFA_REQUIRED_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MFA_REQUIRED_KEY = 'mfaRequired';
const MfaRequired = (required = true) => (0, common_1.SetMetadata)(exports.MFA_REQUIRED_KEY, required);
exports.MfaRequired = MfaRequired;
const RequireMfa = () => (0, exports.MfaRequired)(true);
exports.RequireMfa = RequireMfa;
const SkipMfa = () => (0, exports.MfaRequired)(false);
exports.SkipMfa = SkipMfa;
//# sourceMappingURL=mfa-required.decorator.js.map