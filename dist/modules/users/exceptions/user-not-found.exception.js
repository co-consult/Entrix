"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class UserNotFoundException extends common_1.HttpException {
    constructor(identifier, identifierType = 'id') {
        const messages = {
            id: identifier ? `Utilisateur avec l'ID "${identifier}" introuvable` : 'Utilisateur introuvable',
            email: identifier ? `Utilisateur avec l'email "${identifier}" introuvable` : 'Utilisateur introuvable par email',
            phone: identifier ? `Utilisateur avec le téléphone "${identifier}" introuvable` : 'Utilisateur introuvable par téléphone',
        };
        const errorResponse = {
            statusCode: common_1.HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: messages[identifierType],
            code: 'USER_NOT_FOUND',
            identifier,
            identifierType,
            timestamp: new Date().toISOString(),
        };
        super(errorResponse, common_1.HttpStatus.NOT_FOUND);
    }
    static byId(id) {
        return new UserNotFoundException(id, 'id');
    }
    static byEmail(email) {
        return new UserNotFoundException(email, 'email');
    }
    static byPhone(phone) {
        return new UserNotFoundException(phone, 'phone');
    }
}
exports.UserNotFoundException = UserNotFoundException;
//# sourceMappingURL=user-not-found.exception.js.map