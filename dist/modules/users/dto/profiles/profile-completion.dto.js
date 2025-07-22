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
exports.ProfileCompletionResponseDto = exports.GetProfileCompletionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GetProfileCompletionDto {
    includeSuggestions = true;
    includeIncentives = true;
    includeNextSteps = true;
}
exports.GetProfileCompletionDto = GetProfileCompletionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les suggestions d\'amélioration',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeSuggestions doit être un booléen' }),
    __metadata("design:type", Boolean)
], GetProfileCompletionDto.prototype, "includeSuggestions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les incentives disponibles',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeIncentives doit être un booléen' }),
    __metadata("design:type", Boolean)
], GetProfileCompletionDto.prototype, "includeIncentives", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inclure les prochaines étapes recommandées',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'includeNextSteps doit être un booléen' }),
    __metadata("design:type", Boolean)
], GetProfileCompletionDto.prototype, "includeNextSteps", void 0);
class ProfileCompletionResponseDto {
    percentage;
    completedFields;
    missingFields;
    suggestions;
    nextSteps;
    milestones;
    qualityScore;
}
exports.ProfileCompletionResponseDto = ProfileCompletionResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pourcentage de complétion du profil',
        example: 75,
    }),
    __metadata("design:type", Number)
], ProfileCompletionResponseDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champs complétés',
        example: ['firstName', 'lastName', 'email', 'city', 'country'],
    }),
    __metadata("design:type", Array)
], ProfileCompletionResponseDto.prototype, "completedFields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Champs manquants',
        example: ['dateOfBirth', 'bio', 'favoriteTeam'],
    }),
    __metadata("design:type", Array)
], ProfileCompletionResponseDto.prototype, "missingFields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Suggestions d\'amélioration',
        example: [
            {
                field: 'dateOfBirth',
                title: 'Ajoutez votre date de naissance',
                description: 'Nous pourrons vous proposer des événements adaptés à votre âge',
                priority: 'MEDIUM',
                incentive: {
                    type: 'BONUS_POINTS',
                    value: 50,
                    description: '50 points bonus'
                }
            }
        ],
    }),
    __metadata("design:type", Array)
], ProfileCompletionResponseDto.prototype, "suggestions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prochaines étapes recommandées',
        example: [
            'Ajoutez votre photo de profil',
            'Complétez votre biographie',
            'Choisissez votre équipe favorite'
        ],
    }),
    __metadata("design:type", Array)
], ProfileCompletionResponseDto.prototype, "nextSteps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Paliers de complétion atteints',
        example: [
            {
                level: 'BASIC',
                percentage: 25,
                achieved: true,
                reward: 'Accès aux groupes publics'
            },
            {
                level: 'INTERMEDIATE',
                percentage: 50,
                achieved: true,
                reward: 'Recommandations personnalisées'
            },
            {
                level: 'ADVANCED',
                percentage: 75,
                achieved: true,
                reward: '100 points bonus'
            },
            {
                level: 'COMPLETE',
                percentage: 100,
                achieved: false,
                reward: 'Badge profil complet + 200 points'
            }
        ],
    }),
    __metadata("design:type", Array)
], ProfileCompletionResponseDto.prototype, "milestones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Score de qualité du profil',
        example: {
            overall: 85,
            completeness: 75,
            authenticity: 90,
            engagement: 80
        },
    }),
    __metadata("design:type", Object)
], ProfileCompletionResponseDto.prototype, "qualityScore", void 0);
//# sourceMappingURL=profile-completion.dto.js.map