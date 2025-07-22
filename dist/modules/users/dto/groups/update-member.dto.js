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
exports.UpdateMemberDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const group_constants_1 = require("../../constants/group.constants");
class UpdatePermissionsDto {
    canInvite;
    canPurchase;
    canViewOrders;
    canManageMembers;
    canEditGroup;
    canDeleteGroup;
    spendingLimit;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut inviter de nouveaux membres',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canInvite doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canInvite", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut effectuer des achats',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canPurchase doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canPurchase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut voir les commandes du groupe',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canViewOrders doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canViewOrders", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut gérer les autres membres',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canManageMembers doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canManageMembers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut modifier les paramètres du groupe',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canEditGroup doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canEditGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peut supprimer le groupe',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canDeleteGroup doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "canDeleteGroup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Limite de dépense en TND (null = illimitée)',
        example: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La limite de dépense doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'La limite de dépense doit être positive' }),
    (0, class_validator_1.Max)(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' }),
    __metadata("design:type", Number)
], UpdatePermissionsDto.prototype, "spendingLimit", void 0);
class UpdateMemberDto {
    action;
    newRole;
    permissions;
    spendingLimit;
    reason;
    sendNotification = true;
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Action à effectuer sur le membre',
        example: 'UPDATE_ROLE',
        enum: ['UPDATE_ROLE', 'UPDATE_PERMISSIONS', 'SET_SPENDING_LIMIT', 'SUSPEND', 'REACTIVATE', 'REMOVE'],
    }),
    (0, class_validator_1.IsString)({ message: 'L\'action doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(['UPDATE_ROLE', 'UPDATE_PERMISSIONS', 'SET_SPENDING_LIMIT', 'SUSPEND', 'REACTIVATE', 'REMOVE'], {
        message: 'Action invalide',
    }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouveau rôle (pour UPDATE_ROLE)',
        example: 'ADMIN',
        enum: Object.values(group_constants_1.GROUP_CONSTANTS.ROLES),
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le rôle doit être une chaîne de caractères' }),
    (0, class_validator_1.IsIn)(Object.values(group_constants_1.GROUP_CONSTANTS.ROLES), {
        message: `Le rôle doit être l'un de: ${Object.values(group_constants_1.GROUP_CONSTANTS.ROLES).join(', ')}`,
    }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "newRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouvelles permissions (pour UPDATE_PERMISSIONS)',
        type: UpdatePermissionsDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UpdatePermissionsDto),
    __metadata("design:type", UpdatePermissionsDto)
], UpdateMemberDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouvelle limite de dépense (pour SET_SPENDING_LIMIT)',
        example: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La limite de dépense doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'La limite de dépense doit être positive' }),
    (0, class_validator_1.Max)(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' }),
    __metadata("design:type", Number)
], UpdateMemberDto.prototype, "spendingLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raison de l\'action (pour les logs)',
        example: 'Promotion pour bonne gestion du groupe',
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La raison doit être une chaîne de caractères' }),
    (0, class_validator_1.MaxLength)(500, {
        message: 'La raison ne peut pas dépasser 500 caractères',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Envoyer une notification au membre',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'sendNotification doit être un booléen' }),
    __metadata("design:type", Boolean)
], UpdateMemberDto.prototype, "sendNotification", void 0);
//# sourceMappingURL=update-member.dto.js.map