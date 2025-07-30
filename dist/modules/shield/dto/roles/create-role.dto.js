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
exports.CreateRoleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
const shield_constants_1 = require("../../types/shield-constants");
class CreateRoleDto {
    name;
    display_name;
    description;
    scope;
    level;
    metadata;
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du rôle (snake_case, unique)',
        example: 'event_manager',
        pattern: shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.ROLE_NAME.source
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom du rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(3, { message: 'Le nom du rôle doit contenir au moins 3 caractères' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Le nom du rôle ne peut pas dépasser 50 caractères' }),
    (0, class_validator_1.Matches)(shield_constants_1.SHIELD_CONSTANTS.VALIDATION_PATTERNS.ROLE_NAME, {
        message: 'Le nom du rôle doit être en snake_case (lettres minuscules et underscores uniquement)'
    }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom d\'affichage du rôle',
        example: 'Gestionnaire d\'événements'
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom d\'affichage doit être une chaîne de caractères' }),
    (0, class_validator_1.MinLength)(3, { message: 'Le nom d\'affichage doit contenir au moins 3 caractères' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Le nom d\'affichage ne peut pas dépasser 100 caractères' }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "display_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description du rôle',
        example: 'Responsable de la gestion et coordination des événements'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La description doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'La description ne peut pas dépasser 500 caractères' }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Portée du rôle',
        enum: access_enums_1.RoleScope,
        example: access_enums_1.RoleScope.ORGANIZER
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.RoleScope, {
        message: `La portée doit être l'une de: ${Object.values(access_enums_1.RoleScope).join(', ')}`
    }),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Niveau hiérarchique (1 = le plus élevé)',
        example: 3,
        minimum: 1,
        maximum: 10
    }),
    (0, class_validator_1.IsInt)({ message: 'Le niveau doit être un entier' }),
    (0, class_validator_1.Min)(1, { message: 'Le niveau minimum est 1' }),
    (0, class_validator_1.Max)(10, { message: 'Le niveau maximum est 10' }),
    __metadata("design:type", Number)
], CreateRoleDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Métadonnées additionnelles du rôle',
        example: {
            department: 'events',
            requires_certification: true,
            max_events: 50
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les métadonnées doivent être un objet' }),
    __metadata("design:type", Object)
], CreateRoleDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-role.dto.js.map