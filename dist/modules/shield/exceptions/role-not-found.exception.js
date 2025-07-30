"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class RoleNotFoundException extends common_1.NotFoundException {
    identifier;
    identifierType;
    constructor(identifier, identifierType = 'id') {
        super({
            error: 'ROLE_NOT_FOUND',
            message: `Rôle avec ${identifierType === 'id' ? 'l\'ID' : 'le nom'} '${identifier}' introuvable`,
            identifier,
            identifier_type: identifierType,
            timestamp: new Date().toISOString(),
        });
        this.identifier = identifier;
        this.identifierType = identifierType;
    }
    static byId(roleId) {
        return new RoleNotFoundException(roleId, 'id');
    }
    static byName(roleName) {
        return new RoleNotFoundException(roleName, 'name');
    }
}
exports.RoleNotFoundException = RoleNotFoundException;
//# sourceMappingURL=role-not-found.exception.js.map