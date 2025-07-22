"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class GroupNotFoundException extends common_1.HttpException {
    constructor(identifier, identifierType = 'id') {
        const messages = {
            id: identifier ? `Groupe avec l'ID "${identifier}" introuvable` : 'Groupe introuvable',
            code: identifier ? `Groupe avec le code "${identifier}" introuvable` : 'Groupe introuvable par code',
            name: identifier ? `Groupe avec le nom "${identifier}" introuvable` : 'Groupe introuvable par nom',
        };
        const errorResponse = {
            statusCode: common_1.HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: messages[identifierType],
            code: 'GROUP_NOT_FOUND',
            identifier,
            identifierType,
            timestamp: new Date().toISOString(),
            suggestions: [
                'Vérifiez l\'ID ou le code du groupe',
                'Le groupe a peut-être été supprimé',
                'Vous n\'avez peut-être pas accès à ce groupe',
            ],
        };
        super(errorResponse, common_1.HttpStatus.NOT_FOUND);
    }
    static byId(id) {
        return new GroupNotFoundException(id, 'id');
    }
    static byCode(code) {
        return new GroupNotFoundException(code, 'code');
    }
    static byName(name) {
        return new GroupNotFoundException(name, 'name');
    }
}
exports.GroupNotFoundException = GroupNotFoundException;
//# sourceMappingURL=group-not-found.exception.js.map