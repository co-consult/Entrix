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
exports.ProfilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_profile_dto_1 = require("../dto/profiles/create-profile.dto");
const profiles_service_1 = require("../services/profiles.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let ProfilesController = class ProfilesController {
    profilesService;
    logger;
    constructor(profilesService, loggerService) {
        this.profilesService = profilesService;
        this.logger = loggerService.createChildLogger('ProfilesController');
    }
    async create(createProfileDto, req) {
        const operationId = this.logger.startOperation('createProfile', {
            userId: createProfileDto.userId,
            hasDateOfBirth: !!createProfileDto.dateOfBirth,
            hasAddress: !!createProfileDto.city,
        });
        try {
            this.logger.info('Creating user profile', JSON.stringify({
                userId: createProfileDto.userId,
                country: createProfileDto.country,
                language: createProfileDto.language,
            }));
            const existingProfile = await this.profilesService.findByUserId(createProfileDto.userId);
            if (existingProfile) {
                this.logger.warn('Profile already exists', JSON.stringify({
                    userId: createProfileDto.userId,
                }));
                throw new common_1.ConflictException('Un profil existe déjà pour cet utilisateur');
            }
            const profile = await this.profilesService.create(createProfileDto);
            this.logger.logBusinessEvent('PROFILE_CREATED', {
                profileId: profile.id,
                userId: profile.userId,
                country: profile.country,
                language: profile.language,
                completionPercentage: profile.completionPercentage,
            }, profile.userId);
            this.logger.endOperation('createProfile', operationId, true);
            return {
                success: true,
                data: profile,
                message: 'Profil créé avec succès',
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.create', createProfileDto.userId, JSON.stringify({ userId: createProfileDto.userId }));
            this.logger.endOperation('createProfile', operationId, false);
            if (error instanceof common_1.ConflictException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erreur lors de la création du profil');
        }
    }
    async getByUserId(userId, req) {
        const operationId = this.logger.startOperation('getProfileByUserId', { userId });
        try {
            this.logger.info('Getting profile by user ID', JSON.stringify({ userId }));
            const profile = await this.profilesService.findByUserId(userId);
            if (!profile) {
                throw new common_1.NotFoundException('Profil non trouvé');
            }
            this.logger.endOperation('getProfileByUserId', operationId, true);
            return {
                success: true,
                data: profile,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.getByUserId', userId, JSON.stringify({ userId }));
            this.logger.endOperation('getProfileByUserId', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du profil');
        }
    }
    async getCompletion(userId, req) {
        const operationId = this.logger.startOperation('getProfileCompletion', { userId });
        try {
            this.logger.info('Getting profile completion', JSON.stringify({ userId }));
            const completion = await this.profilesService.getCompletionStatus(userId);
            if (!completion) {
                throw new common_1.NotFoundException('Profil non trouvé');
            }
            this.logger.endOperation('getProfileCompletion', operationId, true);
            return {
                success: true,
                data: completion,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.getCompletion', undefined, JSON.stringify({ userId }));
            this.logger.endOperation('getProfileCompletion', operationId, false);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du statut de complétion');
        }
    }
    async updatePreferences(userId, preferences, req) {
        const operationId = this.logger.startOperation('updatePreferences', {
            userId,
            preferencesKeys: Object.keys(preferences)
        });
        try {
            this.logger.info('Updating preferences', JSON.stringify({
                userId,
                preferencesKeys: Object.keys(preferences),
            }));
            const updatedProfile = await this.profilesService.updatePreferences(userId, preferences);
            this.logger.logBusinessEvent('PREFERENCES_UPDATED', {
                userId,
                preferencesUpdated: Object.keys(preferences),
            }, userId);
            this.logger.endOperation('updatePreferences', operationId, true);
            return {
                success: true,
                data: updatedProfile,
                message: 'Préférences mises à jour avec succès',
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.updatePreferences', undefined, JSON.stringify({ userId, preferencesKeys: Object.keys(preferences) }));
            this.logger.endOperation('updatePreferences', operationId, false);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erreur lors de la mise à jour des préférences');
        }
    }
    async remove(userId, req) {
        const operationId = this.logger.startOperation('deleteProfile', { userId });
        try {
            this.logger.info('Deleting profile', JSON.stringify({ userId }));
            const profile = await this.profilesService.findByUserId(userId);
            if (!profile) {
                throw new common_1.NotFoundException('Profil non trouvé');
            }
            await this.profilesService.delete(userId);
            this.logger.logBusinessEvent('PROFILE_DELETED', {
                userId,
            }, userId);
            this.logger.endOperation('deleteProfile', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.remove', undefined, JSON.stringify({ userId }));
            this.logger.endOperation('deleteProfile', operationId, false);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erreur lors de la suppression du profil');
        }
    }
    async search(query, req) {
        const operationId = this.logger.startOperation('searchProfiles', {
            hasSearch: !!query.search,
            hasFilters: !!(query.country || query.language || query.city),
            page: query.page,
            limit: query.limit,
        });
        try {
            this.logger.warn('Search method not implemented in ProfilesService');
            this.logger.endOperation('searchProfiles', operationId, true);
            return {
                success: true,
                data: [],
                message: 'Fonctionnalité de recherche en cours d\'implémentation',
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ProfilesController.search', undefined, JSON.stringify({ query }));
            this.logger.endOperation('searchProfiles', operationId, false);
            throw new common_1.InternalServerErrorException('Erreur lors de la recherche de profils');
        }
    }
};
exports.ProfilesController = ProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un profil utilisateur',
        description: 'Créer le profil complet d\'un utilisateur avec ses informations personnelles',
    }),
    (0, swagger_1.ApiBody)({ type: create_profile_dto_1.CreateProfileDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Profil créé avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Un profil existe déjà pour cet utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_profile_dto_1.CreateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir un profil par ID utilisateur',
        description: 'Récupérer le profil complet d\'un utilisateur',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profil utilisateur' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profil non trouvé' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getByUserId", null);
__decorate([
    (0, common_1.Get)('user/:userId/completion'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtenir le statut de complétion',
        description: 'Récupérer le pourcentage de complétion et les suggestions',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut de complétion' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profil non trouvé' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getCompletion", null);
__decorate([
    (0, common_1.Put)('user/:userId/preferences'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mettre à jour les préférences',
        description: 'Mettre à jour les préférences d\'un profil utilisateur',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Préférences mises à jour' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profil non trouvé' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Delete)('user/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer un profil',
        description: 'Supprimer définitivement un profil utilisateur',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        description: 'ID de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Profil supprimé' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profil non trouvé' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Non autorisé à supprimer ce profil' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Rechercher des profils',
        description: 'Rechercher et filtrer les profils utilisateurs',
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Terme de recherche' }),
    (0, swagger_1.ApiQuery)({ name: 'country', required: false, description: 'Filtrer par pays' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, description: 'Filtrer par langue' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: 'Filtrer par ville' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, default: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, default: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des profils' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "search", null);
exports.ProfilesController = ProfilesController = __decorate([
    (0, swagger_1.ApiTags)('Profiles'),
    (0, common_1.Controller)('profiles'),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService,
        logger_service_1.LoggerService])
], ProfilesController);
//# sourceMappingURL=profiles.controller.js.map