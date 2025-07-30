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
exports.UpdateAccessRightDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_access_right_dto_1 = require("./create-access-right.dto");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const access_enums_1 = require("../../types/access-enums");
class UpdateAccessRightDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_access_right_dto_1.CreateAccessRightDto, ['source_type'])) {
    status;
}
exports.UpdateAccessRightDto = UpdateAccessRightDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({
        description: 'Nouveau statut du droit d\'accès',
        enum: access_enums_1.AccessRightStatus,
        example: access_enums_1.AccessRightStatus.SUSPENDED
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(access_enums_1.AccessRightStatus, {
        message: `Le statut doit être l'un de: ${Object.values(access_enums_1.AccessRightStatus).join(', ')}`
    }),
    __metadata("design:type", String)
], UpdateAccessRightDto.prototype, "status", void 0);
//# sourceMappingURL=update-access-right.dto.js.map