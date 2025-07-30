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
exports.ConvertAnonymousSubscriptionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const create_subscription_sale_dto_1 = require("./create-subscription-sale.dto");
class ConvertAnonymousSubscriptionDto {
    onboardingKey;
    customerInfo;
    password;
}
exports.ConvertAnonymousSubscriptionDto = ConvertAnonymousSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Clé d\'onboarding imprimée au dos de la carte physique',
        example: 'ONB_2025_ABC_XYZ123',
        minLength: 10,
        maxLength: 50,
    }),
    (0, class_validator_1.IsString)({ message: 'La clé d\'onboarding doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(10, 50, { message: 'La clé d\'onboarding doit contenir entre 10 et 50 caractères' }),
    (0, class_validator_1.Matches)(/^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$/, {
        message: 'Format de clé d\'onboarding invalide. Format attendu: ONB_YYYY_XXX_XXXXXXX'
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().toUpperCase()),
    __metadata("design:type", String)
], ConvertAnonymousSubscriptionDto.prototype, "onboardingKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informations client pour création du compte',
        type: create_subscription_sale_dto_1.CustomerInfoDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_subscription_sale_dto_1.CustomerInfoDto),
    __metadata("design:type", create_subscription_sale_dto_1.CustomerInfoDto)
], ConvertAnonymousSubscriptionDto.prototype, "customerInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mot de passe pour le compte (optionnel, généré automatiquement si non fourni)',
        example: 'MonMotDePasse123!',
        minLength: 8,
        maxLength: 128,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Le mot de passe doit être une chaîne de caractères' }),
    (0, class_validator_1.Length)(8, 128, { message: 'Le mot de passe doit contenir entre 8 et 128 caractères' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    }),
    __metadata("design:type", String)
], ConvertAnonymousSubscriptionDto.prototype, "password", void 0);
//# sourceMappingURL=convert-anonymous-subscription.dto.js.map