"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class PermissionNotFoundException extends common_1.NotFoundException {
    identifier;
    identifierType;
    constructor(identifier, identifierType = 'id') {
        super({
            error: 'PERMISSION_NOT_FOUND',
            message: `Permission avec ${identifierType === 'id' ? 'l\'ID' : 'le nom'} '${identifier}' introuvable`,
            identifier,
            identifier_type: identifierType,
            timestamp: new Date().toISOString(),
        });
        this.identifier = identifier;
        this.identifierType = identifierType;
    }
    static byId(permissionId) {
        return new PermissionNotFoundException(permissionId, 'id');
    }
    static byName(permissionName) {
        return new PermissionNotFoundException(permissionName, 'name');
    }
}
exports.PermissionNotFoundException = PermissionNotFoundException;
//# sourceMappingURL=permission-not-found.exception.js.map