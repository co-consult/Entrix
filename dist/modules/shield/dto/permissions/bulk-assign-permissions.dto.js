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
exports.BulkAssignPermissionsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class RolePermissionAssignment {
    role_id;
    permission_ids;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du rôle',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'L\'ID rôle doit être un UUID valide' }),
    __metadata("design:type", String)
], RolePermissionAssignment.prototype, "role_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IDs des permissions à assigner',
        example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002']
    }),
    (0, class_validator_1.IsArray)({ message: 'Les permissions doivent être un tableau' }),
    (0, class_validator_1.IsUUID)(4, { each: true, message: 'Chaque ID permission doit être un UUID valide' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins une permission doit être assignée' }),
    (0, class_validator_1.ArrayMaxSize)(50, { message: 'Maximum 50 permissions par assignation' }),
    __metadata("design:type", Array)
], RolePermissionAssignment.prototype, "permission_ids", void 0);
class BulkAssignPermissionsDto {
    assignments;
}
exports.BulkAssignPermissionsDto = BulkAssignPermissionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignations de permissions aux rôles',
        type: [RolePermissionAssignment]
    }),
    (0, class_validator_1.IsArray)({ message: 'Les assignations doivent être un tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RolePermissionAssignment),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins une assignation doit être fournie' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 assignations par requête' }),
    __metadata("design:type", Array)
], BulkAssignPermissionsDto.prototype, "assignments", void 0);
//# sourceMappingURL=bulk-assign-permissions.dto.js.map