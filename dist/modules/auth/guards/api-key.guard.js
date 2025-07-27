"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireScopes = exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../../shared/logger/logger.service");
const persistent_token_service_1 = require("../services/persistent-token.service");
let ApiKeyGuard = class ApiKeyGuard {
    persistentTokenService;
    reflector;
    logger;
    constructor(persistentTokenService, reflector, loggerService) {
        this.persistentTokenService = persistentTokenService;
        this.reflector = reflector;
        this.logger = loggerService.createChildLogger('ApiKeyGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const operationId = this.logger.startOperation('apiKeyGuard', {
            path: request.url,
            method: request.method,
        });
        try {
            const isPublic = this.reflector.getAllAndOverride('isPublic', [
                context.getHandler(),
                context.getClass(),
            ]);
            if (isPublic) {
                this.logger.endOperation('apiKeyGuard', operationId, true);
                return true;
            }
            const apiKey = this.extractApiKey(request);
            if (!apiKey) {
                this.logger.endOperation('apiKeyGuard', operationId, false);
                this.logger.warn('API key missing', JSON.stringify({
                    path: request.url,
                    method: request.method,
                    headers: this.sanitizeHeaders(request.headers),
                }));
                throw new common_1.UnauthorizedException('API key required');
            }
            const validation = await this.persistentTokenService.validateApiKey(apiKey);
            if (!validation.isValid) {
                this.logger.endOperation('apiKeyGuard', operationId, false);
                this.logger.warn('Invalid API key used', JSON.stringify({
                    path: request.url,
                    method: request.method,
                    apiKeyPrefix: apiKey.substring(0, 12) + '...',
                    errors: validation.errors,
                }));
                throw new common_1.UnauthorizedException('Invalid API key');
            }
            request.user = {
                id: validation.userId,
                authType: 'api_key',
                scopes: validation.scopes || [],
                tokenId: validation.token?.id,
            };
            const requiredScopes = this.reflector.get('scopes', context.getHandler());
            if (requiredScopes && !this.hasRequiredScopes(validation.scopes || [], requiredScopes)) {
                this.logger.endOperation('apiKeyGuard', operationId, false);
                this.logger.warn('Insufficient API key scopes', JSON.stringify({
                    path: request.url,
                    method: request.method,
                    requiredScopes,
                    availableScopes: validation.scopes,
                }));
                throw new common_1.UnauthorizedException('Insufficient permissions');
            }
            this.logger.endOperation('apiKeyGuard', operationId, true);
            this.logger.info('API key authentication successful', JSON.stringify({
                userId: validation.userId,
                scopes: validation.scopes,
                path: request.url,
            }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('apiKeyGuard', operationId, false);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error('API key guard error', error.stack, 'ApiKeyGuard.canActivate', JSON.stringify({
                errorMessage: error.message,
                path: request.url,
                method: request.method,
            }));
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    extractApiKey(request) {
        const authHeader = request.headers?.authorization;
        if (authHeader?.startsWith('Bearer ent_api_')) {
            return authHeader.substring(7);
        }
        const apiKeyHeader = request.headers?.['x-api-key'];
        if (apiKeyHeader?.startsWith('ent_api_')) {
            return apiKeyHeader;
        }
        const apiKeyQuery = request.query?.api_key;
        if (apiKeyQuery?.startsWith('ent_api_')) {
            return apiKeyQuery;
        }
        return null;
    }
    hasRequiredScopes(userScopes, requiredScopes) {
        return requiredScopes.every(requiredScope => {
            if (requiredScope.endsWith('*')) {
                const prefix = requiredScope.slice(0, -1);
                return userScopes.some(userScope => userScope.startsWith(prefix));
            }
            return userScopes.includes(requiredScope);
        });
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        if (sanitized.authorization) {
            sanitized.authorization = sanitized.authorization.substring(0, 20) + '...';
        }
        if (sanitized['x-api-key']) {
            sanitized['x-api-key'] = sanitized['x-api-key'].substring(0, 12) + '...';
        }
        return sanitized;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [persistent_token_service_1.PersistentTokenService,
        core_1.Reflector,
        logger_service_1.LoggerService])
], ApiKeyGuard);
const common_2 = require("@nestjs/common");
const RequireScopes = (...scopes) => (0, common_2.SetMetadata)('scopes', scopes);
exports.RequireScopes = RequireScopes;
//# sourceMappingURL=api-key.guard.js.map