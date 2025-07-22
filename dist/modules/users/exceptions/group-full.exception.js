"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupFullException = void 0;
const common_1 = require("@nestjs/common");
class GroupFullException extends common_1.HttpException {
    constructor(groupId, groupName, currentMembers, maxMembers, action = 'join') {
        const actionMessages = {
            join: 'Impossible de rejoindre le groupe : groupe complet',
            invite: 'Impossible d\'inviter : groupe complet',
        };
        const actionSuggestions = {
            join: [
                'Essayez de rejoindre un autre groupe similaire',
                'Contactez le propriétaire du groupe pour demander une augmentation de la limite',
                'Attendez qu\'une place se libère',
            ],
            invite: [
                'Augmentez la limite de membres du groupe dans les paramètres',
                'Retirez des membres inactifs pour faire de la place',
                'Créez un nouveau groupe pour les nouveaux membres',
            ],
        };
        const groupInfo = groupName ? ` "${groupName}"` : '';
        const memberInfo = currentMembers && maxMembers
            ? ` (${currentMembers}/${maxMembers} membres)`
            : '';
        const errorResponse = {
            statusCode: common_1.HttpStatus.CONFLICT,
            error: 'Conflict',
            message: `${actionMessages[action]}${groupInfo}${memberInfo}`,
            code: 'GROUP_FULL',
            groupId,
            groupName,
            currentMembers,
            maxMembers,
            action,
            timestamp: new Date().toISOString(),
            suggestions: actionSuggestions[action],
        };
        super(errorResponse, common_1.HttpStatus.CONFLICT);
    }
    static forJoin(groupId, groupName, currentMembers, maxMembers) {
        return new GroupFullException(groupId, groupName, currentMembers, maxMembers, 'join');
    }
    static forInvite(groupId, groupName, currentMembers, maxMembers) {
        return new GroupFullException(groupId, groupName, currentMembers, maxMembers, 'invite');
    }
}
exports.GroupFullException = GroupFullException;
//# sourceMappingURL=group-full.exception.js.map