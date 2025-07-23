"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalApiKey = exports.PartnerApiKey = exports.PublicApiKey = exports.ApiKeyScopes = exports.RequireApiKey = exports.API_KEY_SCOPES_KEY = exports.API_KEY_REQUIRED_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.API_KEY_REQUIRED_KEY = 'apiKeyRequired';
exports.API_KEY_SCOPES_KEY = 'apiKeyScopes';
const RequireApiKey = () => (0, common_1.SetMetadata)(exports.API_KEY_REQUIRED_KEY, true);
exports.RequireApiKey = RequireApiKey;
const ApiKeyScopes = (...scopes) => (0, common_1.SetMetadata)(exports.API_KEY_SCOPES_KEY, scopes);
exports.ApiKeyScopes = ApiKeyScopes;
const PublicApiKey = () => (0, common_1.SetMetadata)(exports.API_KEY_SCOPES_KEY, ['public']);
exports.PublicApiKey = PublicApiKey;
const PartnerApiKey = () => (0, common_1.SetMetadata)(exports.API_KEY_SCOPES_KEY, ['partner']);
exports.PartnerApiKey = PartnerApiKey;
const InternalApiKey = () => (0, common_1.SetMetadata)(exports.API_KEY_SCOPES_KEY, ['internal']);
exports.InternalApiKey = InternalApiKey;
//# sourceMappingURL=api-key.decorator.js.map