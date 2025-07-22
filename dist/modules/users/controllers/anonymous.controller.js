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
exports.AnonymousController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_anonymous_dto_1 = require("../dto/anonymous/create-anonymous.dto");
const convert_anonymous_dto_1 = require("../dto/anonymous/convert-anonymous.dto");
const anonymous_service_1 = require("../services/anonymous.service");
const common_2 = require("@nestjs/common");
let AnonymousController = class AnonymousController {
    anonymousService;
    constructor(anonymousService) {
        this.anonymousService = anonymousService;
    }
    async create(createAnonymousDto) {
        try {
            const createData = {
                guestName: createAnonymousDto.guestName,
                guestEmail: createAnonymousDto.guestEmail,
                guestPhone: createAnonymousDto.guestPhone,
                incentiveValue: createAnonymousDto.incentiveValue,
                incentiveDescription: createAnonymousDto.incentiveDescription,
                expiresAt: createAnonymousDto.expiresAt ? new Date(createAnonymousDto.expiresAt) : undefined,
                metadata: createAnonymousDto.metadata,
            };
            const anonymousUser = await this.anonymousService.createAnonymousUser(createData);
            return {
                success: true,
                data: anonymousUser,
                message: 'Utilisateur anonyme créé avec succès',
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_2.ConflictException('Email déjà utilisé');
            }
            throw error;
        }
    }
    async findByEmail(email) {
        const anonymousUser = await this.anonymousService.findByEmail(email);
        return {
            success: true,
            data: anonymousUser,
        };
    }
    async findByOnboardingKey(key) {
        const anonymousUser = await this.anonymousService.findByOnboardingKey(key);
        return {
            success: true,
            data: anonymousUser,
        };
    }
    async convertToRegistered(convertDto) {
        const conversionData = {
            onboardingKey: convertDto.onboardingKey,
            userData: {
                firstName: convertDto.firstName,
                lastName: convertDto.lastName,
                email: convertDto.email,
                phone: convertDto.phone,
                password: convertDto.password,
            },
            profileData: convertDto.profileData ? {
                city: convertDto.profileData.city,
                country: convertDto.profileData.country,
                language: convertDto.profileData.language,
                dateOfBirth: convertDto.profileData.dateOfBirth ? new Date(convertDto.profileData.dateOfBirth) : undefined,
                gender: convertDto.profileData.gender,
            } : undefined,
            acceptedTerms: convertDto.acceptedTerms,
            marketingConsent: convertDto.marketingConsent,
        };
        const result = await this.anonymousService.convertToRegistered(conversionData);
        return {
            success: true,
            data: result,
            message: result.success ? 'Conversion réussie' : 'Échec de la conversion',
        };
    }
    async validateOnboardingKey(key) {
        const validation = await this.anonymousService.validateOnboardingKey(key);
        return {
            success: true,
            data: validation,
        };
    }
    async generateOnboardingKey(keyData) {
        const onboardingKeyData = {
            anonymousUserId: keyData.anonymousUserId,
            incentiveType: keyData.incentiveType,
            incentiveValue: keyData.incentiveValue,
            description: keyData.description,
            expiresInHours: keyData.expiresInHours,
        };
        const onboardingKey = await this.anonymousService.generateOnboardingKey(onboardingKeyData);
        const expiresAt = new Date(Date.now() + (keyData.expiresInHours || 168) * 60 * 60 * 1000);
        return {
            success: true,
            data: {
                onboardingKey,
                expiresAt,
            },
            message: 'Clé d\'onboarding générée avec succès',
        };
    }
    async applyIncentive(incentiveData) {
        await this.anonymousService.applyIncentive(incentiveData.userId, incentiveData.incentiveType, incentiveData.value);
        return {
            success: true,
            data: null,
            message: 'Incentive appliqué avec succès',
        };
    }
    async getConversionStats(from, to) {
        const dateRange = from && to ? {
            from: new Date(from),
            to: new Date(to),
        } : undefined;
        const stats = await this.anonymousService.getConversionStats(dateRange);
        return {
            success: true,
            data: stats,
        };
    }
    async getAnonymousStats() {
        const stats = await this.anonymousService.getAnonymousStats();
        return {
            success: true,
            data: stats,
        };
    }
};
exports.AnonymousController = AnonymousController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer un utilisateur anonyme',
        description: 'Créer un utilisateur anonyme avec clé d\'onboarding optionnelle',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Utilisateur anonyme créé avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email déjà utilisé',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_anonymous_dto_1.CreateAnonymousDto]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('email/:email'),
    (0, swagger_1.ApiOperation)({
        summary: 'Rechercher par email',
        description: 'Trouver un utilisateur anonyme par son email',
    }),
    (0, swagger_1.ApiParam)({
        name: 'email',
        description: 'Email de l\'utilisateur anonyme',
        example: 'temp@example.com',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Utilisateur anonyme trouvé ou null',
    }),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "findByEmail", null);
__decorate([
    (0, common_1.Get)('onboarding/:key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Rechercher par clé d\'onboarding',
        description: 'Trouver un utilisateur anonyme par sa clé d\'onboarding',
    }),
    (0, swagger_1.ApiParam)({
        name: 'key',
        description: 'Clé d\'onboarding',
        example: 'ONB_2025_EVT_XY9Z23',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Utilisateur anonyme trouvé ou null',
    }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "findByOnboardingKey", null);
__decorate([
    (0, common_1.Post)('convert'),
    (0, swagger_1.ApiOperation)({
        summary: 'Convertir en utilisateur enregistré',
        description: 'Convertir un utilisateur anonyme en compte utilisateur complet',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Conversion réussie',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données de conversion invalides',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Clé d\'onboarding introuvable',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [convert_anonymous_dto_1.ConvertAnonymousDto]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "convertToRegistered", null);
__decorate([
    (0, common_1.Get)('validate/:key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider une clé d\'onboarding',
        description: 'Vérifier la validité d\'une clé d\'onboarding avant conversion',
    }),
    (0, swagger_1.ApiParam)({
        name: 'key',
        description: 'Clé d\'onboarding à valider',
        example: 'ONB_2025_EVT_XY9Z23',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultat de la validation',
    }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "validateOnboardingKey", null);
__decorate([
    (0, common_1.Post)('generate-key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Générer une clé d\'onboarding',
        description: 'Créer une nouvelle clé d\'onboarding pour un utilisateur anonyme',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Clé générée avec succès',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "generateOnboardingKey", null);
__decorate([
    (0, common_1.Post)('apply-incentive'),
    (0, swagger_1.ApiOperation)({
        summary: 'Appliquer un incentive',
        description: 'Appliquer un incentive à un utilisateur enregistré',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Incentive appliqué avec succès',
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "applyIncentive", null);
__decorate([
    (0, common_1.Get)('stats/conversion'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques de conversion',
        description: 'Obtenir les statistiques de conversion anonyme → enregistré',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'Date de début (ISO string)',
        example: '2025-01-01T00:00:00Z',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'to',
        required: false,
        description: 'Date de fin (ISO string)',
        example: '2025-12-31T23:59:59Z',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques de conversion',
    }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "getConversionStats", null);
__decorate([
    (0, common_1.Get)('stats/general'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques générales des anonymes',
        description: 'Obtenir les statistiques générales des utilisateurs anonymes',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques générales',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnonymousController.prototype, "getAnonymousStats", null);
exports.AnonymousController = AnonymousController = __decorate([
    (0, swagger_1.ApiTags)('Anonymous Users'),
    (0, common_1.Controller)('anonymous'),
    __metadata("design:paramtypes", [anonymous_service_1.AnonymousService])
], AnonymousController);
//# sourceMappingURL=anonymous.controller.js.map