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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentTokenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const logger_service_1 = require("../../../shared/logger/logger.service");
const persistent_token_service_1 = require("../services/persistent-token.service");
const create_persistent_token_dto_1 = require("../dto/persistent-tokens/create-persistent-token.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const decorators_1 = require("../decorators");
let PersistentTokenController = class PersistentTokenController {
    persistentTokenService;
    logger;
    constructor(persistentTokenService, loggerService) {
        this.persistentTokenService = persistentTokenService;
        this.logger = loggerService.createChildLogger('PersistentTokenController');
    }
    async createToken(userId, createTokenDto) {
        const operationId = this.logger.startOperation('POST /auth/tokens');
        try {
            const tokenData = {
                user_id: userId,
                ...createTokenDto,
            };
            const generatedToken = await this.persistentTokenService.createToken(tokenData);
            this.logger.endOperation('createToken', operationId, true);
            return {
                id: generatedToken.id,
                token: generatedToken.token,
                token_prefix: generatedToken.token_prefix,
                token_type: generatedToken.token_type,
                scopes: generatedToken.scopes,
                expires_at: generatedToken.expires_at?.toISOString() || null,
                created_at: generatedToken.created_at.toISOString(),
                security_warning: 'Sauvegardez ce token immédiatement. Il ne sera plus affiché pour des raisons de sécurité.',
            };
        }
        catch (error) {
            this.logger.endOperation('createToken', operationId, false);
            throw error;
        }
    }
    async generateApiKey(userId, generateApiKeyDto) {
        const operationId = this.logger.startOperation('POST /auth/tokens/api-key');
        try {
            const apiKey = await this.persistentTokenService.generateApiKey(userId, generateApiKeyDto.name, generateApiKeyDto.scopes);
            this.logger.endOperation('generateApiKey', operationId, true);
            return {
                id: apiKey.id,
                token: apiKey.token,
                token_prefix: apiKey.token_prefix,
                token_type: apiKey.token_type,
                scopes: apiKey.scopes,
                expires_at: apiKey.expires_at?.toISOString() || null,
                created_at: apiKey.created_at.toISOString(),
                security_warning: 'Cette clé API ne sera plus affichée. Conservez-la en lieu sûr.',
            };
        }
        catch (error) {
            this.logger.endOperation('generateApiKey', operationId, false);
            throw error;
        }
    }
    async getUserTokens(userId, filters) {
        const operationId = this.logger.startOperation('GET /auth/tokens');
        try {
            const tokens = await this.persistentTokenService.getUserTokens(userId, filters);
            this.logger.endOperation('getUserTokens', operationId, true);
            return tokens.map(token => ({
                id: token.id,
                token_type: token.token_type,
                token_prefix: token.token_prefix,
                name: token.name,
                description: token.description,
                scopes: token.scopes,
                expires_at: token.expires_at,
                last_used_at: token.last_used_at,
                usage_count: token.usage_count,
                is_active: token.is_active,
                created_at: token.created_at,
            }));
        }
        catch (error) {
            this.logger.endOperation('getUserTokens', operationId, false);
            throw error;
        }
    }
    async getToken(userId, tokenId) {
        const operationId = this.logger.startOperation('GET /auth/tokens/:id');
        try {
            const token = await this.persistentTokenService.getToken(tokenId);
            if (!token) {
                this.logger.endOperation('getToken', operationId, false);
                throw new Error('Token not found');
            }
            if (token.user_id !== userId) {
                this.logger.endOperation('getToken', operationId, false);
                throw new Error('Access denied');
            }
            this.logger.endOperation('getToken', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                token_prefix: token.token_prefix,
                name: token.name,
                description: token.description,
                scopes: token.scopes,
                expires_at: token.expires_at?.toISOString() || null,
                last_used_at: token.last_used_at?.toISOString() || null,
                usage_count: token.usage_count,
                is_active: token.is_active,
                created_at: token.created_at.toISOString(),
            };
        }
        catch (error) {
            this.logger.endOperation('getToken', operationId, false);
            throw error;
        }
    }
    async getTokenStats(userId) {
        const operationId = this.logger.startOperation('GET /auth/tokens/stats');
        try {
            const stats = await this.persistentTokenService.getTokenStats(userId);
            this.logger.endOperation('getTokenStats', operationId, true);
            return stats;
        }
        catch (error) {
            this.logger.endOperation('getTokenStats', operationId, false);
            throw error;
        }
    }
    async updateToken(userId, tokenId, updateTokenDto) {
        const operationId = this.logger.startOperation('PUT /auth/tokens/:id');
        try {
            const existingToken = await this.persistentTokenService.getToken(tokenId);
            if (!existingToken || existingToken.user_id !== userId) {
                this.logger.endOperation('updateToken', operationId, false);
                throw new Error('Token not found or access denied');
            }
            const updatedToken = await this.persistentTokenService.updateToken(tokenId, updateTokenDto);
            this.logger.endOperation('updateToken', operationId, true);
            return {
                id: updatedToken.id,
                token_type: updatedToken.token_type,
                token_prefix: updatedToken.token_prefix,
                name: updatedToken.name,
                description: updatedToken.description,
                scopes: updatedToken.scopes,
                expires_at: updatedToken.expires_at?.toISOString() || null,
                last_used_at: updatedToken.last_used_at?.toISOString() || null,
                usage_count: updatedToken.usage_count,
                is_active: updatedToken.is_active,
                created_at: updatedToken.created_at.toISOString(),
            };
        }
        catch (error) {
            this.logger.endOperation('updateToken', operationId, false);
            throw error;
        }
    }
    async refreshToken(userId, tokenId) {
        const operationId = this.logger.startOperation('POST /auth/tokens/:id/refresh');
        try {
            const existingToken = await this.persistentTokenService.getToken(tokenId);
            if (!existingToken || existingToken.user_id !== userId) {
                this.logger.endOperation('refreshToken', operationId, false);
                throw new Error('Token not found or access denied');
            }
            const refreshedToken = await this.persistentTokenService.refreshToken(tokenId);
            this.logger.endOperation('refreshToken', operationId, true);
            return {
                id: refreshedToken.id,
                token: refreshedToken.token,
                token_prefix: refreshedToken.token_prefix,
                token_type: refreshedToken.token_type,
                scopes: refreshedToken.scopes,
                expires_at: refreshedToken.expires_at?.toISOString() || null,
                created_at: refreshedToken.created_at.toISOString(),
                security_warning: 'L\'ancien token est maintenant invalide. Utilisez ce nouveau token.',
            };
        }
        catch (error) {
            this.logger.endOperation('refreshToken', operationId, false);
            throw error;
        }
    }
    async revokeToken(userId, tokenId, revokeDto) {
        const operationId = this.logger.startOperation('DELETE /auth/tokens/:id');
        try {
            const existingToken = await this.persistentTokenService.getToken(tokenId);
            if (!existingToken || existingToken.user_id !== userId) {
                this.logger.endOperation('revokeToken', operationId, false);
                throw new Error('Token not found or access denied');
            }
            const revoked = await this.persistentTokenService.revokeToken(tokenId, revokeDto?.reason || 'User revocation', userId);
            if (!revoked) {
                this.logger.endOperation('revokeToken', operationId, false);
                throw new Error('Failed to revoke token');
            }
            this.logger.endOperation('revokeToken', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('revokeToken', operationId, false);
            throw error;
        }
    }
    async revokeAllTokens(userId, revokeDto) {
        const operationId = this.logger.startOperation('DELETE /auth/tokens');
        try {
            const revokedCount = await this.persistentTokenService.revokeAllUserTokens(userId, revokeDto?.reason || 'User bulk revocation');
            this.logger.endOperation('revokeAllTokens', operationId, true);
            return {
                revoked_count: revokedCount,
                message: `${revokedCount} token(s) révoqué(s) avec succès.`,
            };
        }
        catch (error) {
            this.logger.endOperation('revokeAllTokens', operationId, false);
            throw error;
        }
    }
    async validateToken(userId, validateDto) {
        const operationId = this.logger.startOperation('POST /auth/tokens/validate');
        try {
            const validation = await this.persistentTokenService.validateToken(validateDto.token);
            if (validation.isValid && validation.userId !== userId) {
                this.logger.endOperation('validateToken', operationId, false);
                return {
                    isValid: false,
                    errors: ['Access denied'],
                };
            }
            this.logger.endOperation('validateToken', operationId, true);
            return {
                isValid: validation.isValid,
                userId: validation.userId,
                scopes: validation.scopes,
                errors: validation.errors,
                lastUsed: validation.lastUsed?.toISOString(),
                usageCount: validation.usageCount,
                user: validation.token && validation.token.users ? {
                    id: validation.token.users.id,
                    email: validation.token.users.email,
                    is_active: validation.token.users.is_active,
                } : undefined,
            };
        }
        catch (error) {
            this.logger.endOperation('validateToken', operationId, false);
            throw error;
        }
    }
};
exports.PersistentTokenController = PersistentTokenController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 10, windowMs: 60000 }),
    (0, decorators_1.AuditLog)({ action: 'create_persistent_token', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un token persistant',
        description: 'Crée un nouveau token persistant selon le type spécifié'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token créé avec succès',
        type: create_persistent_token_dto_1.GeneratedPersistentTokenResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Limite de tokens atteinte' }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_persistent_token_dto_1.CreatePersistentTokenDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "createToken", null);
__decorate([
    (0, common_1.Post)('api-key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'generate_api_key', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Générer une clé API',
        description: 'Génère une nouvelle clé API pour les intégrations externes'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Clé API générée',
        type: create_persistent_token_dto_1.GeneratedPersistentTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_persistent_token_dto_1.GenerateApiKeyDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "generateApiKey", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Lister mes tokens',
        description: 'Récupère la liste des tokens persistants de l\'utilisateur connecté'
    }),
    (0, swagger_1.ApiQuery)({ name: 'token_type', enum: client_1.persistent_token_type, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'is_active', type: Boolean, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', type: String, required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des tokens',
        type: [create_persistent_token_dto_1.PersistentTokenResponseDto]
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_persistent_token_dto_1.PersistentTokenFiltersDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "getUserTokens", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Détails d\'un token',
        description: 'Récupère les détails d\'un token spécifique'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Détails du token',
        type: create_persistent_token_dto_1.PersistentTokenResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Token non trouvé' }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "getToken", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques des tokens',
        description: 'Récupère les statistiques d\'utilisation des tokens'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques des tokens',
        type: create_persistent_token_dto_1.PersistentTokenStatsResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "getTokenStats", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.AuditLog)({ action: 'update_persistent_token', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour un token',
        description: 'Met à jour les propriétés d\'un token persistant'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token mis à jour',
        type: create_persistent_token_dto_1.PersistentTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_persistent_token_dto_1.UpdatePersistentTokenDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "updateToken", null);
__decorate([
    (0, common_1.Post)(':id/refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, decorators_1.AuditLog)({ action: 'refresh_persistent_token', level: 'warn' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualiser un token',
        description: 'Génère un nouveau token avec la même configuration'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token actualisé',
        type: create_persistent_token_dto_1.GeneratedPersistentTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, decorators_1.AuditLog)({ action: 'revoke_persistent_token', level: 'warn' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Révoquer un token',
        description: 'Révoque définitivement un token persistant'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID du token' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Token révoqué' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Token non trouvé' }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_persistent_token_dto_1.RevokePersistentTokenDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "revokeToken", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.AuditLog)({ action: 'revoke_all_persistent_tokens', level: 'error' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Révoquer tous mes tokens',
        description: 'Révoque tous les tokens persistants de l\'utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nombre de tokens révoqués',
        schema: {
            type: 'object',
            properties: {
                revoked_count: { type: 'number' },
                message: { type: 'string' }
            }
        }
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_persistent_token_dto_1.RevokePersistentTokenDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "revokeAllTokens", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 100, windowMs: 60000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider un token',
        description: 'Valide un token persistant et retourne ses informations'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultat de validation',
        type: create_persistent_token_dto_1.ValidatePersistentTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_persistent_token_dto_1.ValidatePersistentTokenDto]),
    __metadata("design:returntype", Promise)
], PersistentTokenController.prototype, "validateToken", null);
exports.PersistentTokenController = PersistentTokenController = __decorate([
    (0, swagger_1.ApiTags)('Persistent Tokens'),
    (0, common_1.Controller)('auth/tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [persistent_token_service_1.PersistentTokenService,
        logger_service_1.LoggerService])
], PersistentTokenController);
//# sourceMappingURL=persistent-token.controller.js.map