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
exports.CreatePermissionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
const shield_constants_1 = require("../../types/shield-constants");
class CreatePermissionDto {
    name;
    display_name;
    description;
    resource_type;
    action;
    conditions;
    metadata;
}
exports.CreatePermissionDto = CreatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la permission (snake_case avec : pour namespace)',
        example: 'events:manage:create',
        pattern: shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.PERMISSION_NAME.source
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom de la permission doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(3, { message: 'Le nom de la permission doit contenir au moins 3 caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Le nom de la permission ne peut pas dépasser 100 caractères' }),
    (0, class_validator_1.Matches)(shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.PERMISSION_NAME, {
        message: 'Le nom de la permission doit être en snake_case avec : pour les namespaces'
    }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom d\'affichage de la permission',
        example: 'Créer des événements'
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom d\'affichage doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(3, { message: 'Le nom d\'affichage doit contenir au moins 3 caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Le nom d\'affichage ne peut pas dépasser 100 caractères' }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "display_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description de la permission',
        example: 'Permet de créer de nouveaux événements dans le système'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'La description ne peut pas dépasser 500 caractères' }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de ressource concernée',
        enum: access_enums_1.ResourceType,
        example: access_enums_1.ResourceType.EVENT
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.ResourceType, {
        message: `Le type de ressource doit être l'un de: ${Object.values(access_enums_1.ResourceType).join(', ')}`
    }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "resource_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action autorisée',
        enum: access_enums_1.PermissionAction,
        example: access_enums_1.PermissionAction.CREATE
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.PermissionAction, {
        message: `L'action doit être l'une de: ${Object.values(access_enums_1.PermissionAction).join(', ')}`
    }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Conditions d\'application de la permission',
        example: {
            own_resource_only: true,
            organizer_scope: true,
            time_restrictions: {
                start_time: '09:00',
                end_time: '18:00',
                days_of_week: [1, 2, 3, 4, 5]
            }
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les conditions doivent être un objet' }),
    __metadata("design:type", Object)
], CreatePermissionDto.prototype, "conditions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles',
        example: {
            category: 'event_management',
            priority: 'high',
            requires_approval: false
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreatePermissionDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-permission.dto.js.map