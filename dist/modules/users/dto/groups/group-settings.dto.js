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
exports.GroupSettingsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class DefaultPermissionsDto {
    canInvite;
    canPurchase;
    canViewOrders;
    spendingLimit;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouveaux membres peuvent inviter par défaut',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canInvite doit être un booléen' }),
    __metadata("design:type", Boolean)
], DefaultPermissionsDto.prototype, "canInvite", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouveaux membres peuvent acheter par défaut',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canPurchase doit être un booléen' }),
    __metadata("design:type", Boolean)
], DefaultPermissionsDto.prototype, "canPurchase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nouveaux membres peuvent voir les commandes par défaut',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'canViewOrders doit être un booléen' }),
    __metadata("design:type", Boolean)
], DefaultPermissionsDto.prototype, "canViewOrders", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Limite de dépense par défaut pour nouveaux membres (TND)',
        example: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'La limite de dépense doit être un nombre entier' }),
    (0, class_validator_1.Min)(0, { message: 'La limite de dépense doit être positive' }),
    (0, class_validator_1.Max)(100000, { message: 'La limite de dépense ne peut pas dépasser 100 000 TND' }),
    __metadata("design:type", Number)
], DefaultPermissionsDto.prototype, "spendingLimit", void 0);
class GroupSettingsDto {
    isPrivate;
    requireApproval;
    maxMembers;
    allowInvites;
    autoAcceptRequests;
    allowLeaving;
    showStats;
    showPurchaseHistory;
    defaultPermissions;
    notifyNewEvents;
    notifyPurchases;
    allowInviteLink;
}
exports.GroupSettingsDto = GroupSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Groupe privé (non visible dans les recherches publiques)',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'isPrivate doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "isPrivate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Approbation du propriétaire requise pour rejoindre',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'requireApproval doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "requireApproval", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre maximum de membres autorisé',
        example: 50,
        minimum: 2,
        maximum: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le nombre maximum de membres doit être un entier' }),
    (0, class_validator_1.Min)(2, { message: 'Un groupe doit pouvoir avoir au moins 2 membres' }),
    (0, class_validator_1.Max)(1000, { message: 'Un groupe ne peut pas dépasser 1000 membres' }),
    __metadata("design:type", Number)
], GroupSettingsDto.prototype, "maxMembers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Membres peuvent inviter d\'autres personnes',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'allowInvites doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "allowInvites", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Accepter automatiquement les demandes d\'adhésion',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'autoAcceptRequests doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "autoAcceptRequests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permettre aux membres de quitter le groupe librement',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'allowLeaving doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "allowLeaving", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Afficher les statistiques du groupe aux membres',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'showStats doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "showStats", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Afficher l\'historique des achats aux membres',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'showPurchaseHistory doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "showPurchaseHistory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permissions par défaut pour les nouveaux membres',
        type: DefaultPermissionsDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DefaultPermissionsDto),
    __metadata("design:type", DefaultPermissionsDto)
], GroupSettingsDto.prototype, "defaultPermissions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notification automatique pour nouveaux événements',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'notifyNewEvents doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "notifyNewEvents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notification automatique pour nouveaux achats',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'notifyPurchases doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "notifyPurchases", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permettre le partage du lien d\'invitation',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'allowInviteLink doit être un booléen' }),
    __metadata("design:type", Boolean)
], GroupSettingsDto.prototype, "allowInviteLink", void 0);
//# sourceMappingURL=group-settings.dto.js.map