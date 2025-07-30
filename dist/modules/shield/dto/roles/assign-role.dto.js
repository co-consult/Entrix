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
exports.AssignRoleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AssignRoleDto {
    user_id;
    role_id;
    valid_until;
    notes;
}
exports.AssignRoleDto = AssignRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de l\'utilisateur à qui assigner le rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID utilisateur doit être un UUID valide' }),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du rôle à assigner',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID rôle doit être un UUID valide' }),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "role_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date d\'expiration de l\'assignation (optionnelle)',
        example: '2024-12-31T23:59:59.999Z'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La date d\'expiration doit être au format ISO 8601' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], AssignRoleDto.prototype, "valid_until", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes sur l\'assignation',
        example: 'Promotion temporaire pour la saison événementielle'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Les notes doivent être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Les notes ne peuvent pas dépasser 500 caractères' }),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "notes", void 0);
//# sourceMappingURL=assign-role.dto.js.map