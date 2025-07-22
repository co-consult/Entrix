import { HttpException } from '@nestjs/common';
export declare class GroupFullException extends HttpException {
    constructor(groupId: string, groupName?: string, currentMembers?: number, maxMembers?: number, action?: 'join' | 'invite');
    static forJoin(groupId: string, groupName?: string, currentMembers?: number, maxMembers?: number): GroupFullException;
    static forInvite(groupId: string, groupName?: string, currentMembers?: number, maxMembers?: number): GroupFullException;
}
