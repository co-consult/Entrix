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
exports.CheckPermissionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
class CheckPermissionDto {
    user_id;
    permission;
    resource_type;
    resource_id;
    context;
}
exports.CheckPermissionDto = CheckPermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur pour qui vérifier la permission',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID utilisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], CheckPermissionDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom de la permission à vérifier',
        example: 'events:manage:create'
    }),
    (0, class_validator_1.IsString)({ message: 'Le nom de la permission doit être une chaîne de caractères' }),
    __metadata("design:type", String)
], CheckPermissionDto.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type de ressource',
        enum: access_enums_1.ResourceType,
        example: access_enums_1.ResourceType.EVENT
    }),
    (0, class_validator_1.IsEnum)(access_enums_1.ResourceType, {
        message: `Le type de ressource doit être l'un de: ${Object.values(access_enums_1.ResourceType).join(', ')}`
    }),
    __metadata("design:type", String)
], CheckPermissionDto.prototype, "resource_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la ressource spécifique (optionnel)',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID ressource doit être un UUID valide' }),
    __metadata("design:type", String)
], CheckPermissionDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contexte additionnel pour la vérification',
        example: {
            organizer_id: '123e4567-e89b-12d3-a456-426614174002',
            venue_id: '123e4567-e89b-12d3-a456-426614174003',
            event_type: 'concert'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Le contexte doit être un objet' }),
    __metadata("design:type", Object)
], CheckPermissionDto.prototype, "context", void 0);
//# sourceMappingURL=check-permission.dto.js.map