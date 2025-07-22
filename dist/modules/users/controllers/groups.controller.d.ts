import { CreateGroupDto } from '../dto/groups/create-group.dto';
import { UpdateGroupDto } from '../dto/groups/update-group.dto';
import { GroupsService } from '../services/groups.service';
import { UserResponse } from '../types/user.types';
import { Group, GroupWithMembers, GroupRole } from '../types/group.types';
import { StandardResponse, CreatedResponse, UpdatedResponse, DeletedResponse } from '../types/response.types';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    create(createGroupDto: CreateGroupDto, user: UserResponse): Promise<CreatedResponse<Group>>;
    getMyGroups(user: UserResponse, status?: string, role?: string, limit?: number, offset?: number): Promise<StandardResponse<Group[]>>;
    getPublicGroups(query?: string, type?: string, hasSpace?: boolean, limit?: number, offset?: number): Promise<StandardResponse<Group[]>>;
    findById(id: string): Promise<StandardResponse<GroupWithMembers>>;
    findByCode(code: string): Promise<StandardResponse<Group>>;
    getGroupStats(id: string): Promise<StandardResponse<any>>;
    update(id: string, updateGroupDto: UpdateGroupDto, user: UserResponse): Promise<UpdatedResponse<Group>>;
    addMember(groupId: string, memberData: {
        userId: string;
        role?: GroupRole;
    }, user: UserResponse): Promise<CreatedResponse<any>>;
    removeMember(groupId: string, userId: string, user: UserResponse): Promise<StandardResponse<null>>;
    updateMemberRole(groupId: string, userId: string, roleData: {
        newRole: GroupRole;
    }, user: UserResponse): Promise<UpdatedResponse<any>>;
    updateMemberPermissions(groupId: string, userId: string, permissionsData: {
        permissions: any;
    }, user: UserResponse): Promise<UpdatedResponse<any>>;
    inviteUser(groupId: string, inviteData: {
        email?: string;
        userId?: string;
        role?: GroupRole;
        message?: string;
    }, user: UserResponse): Promise<StandardResponse<any>>;
    checkPermissions(groupId: string, userId: string, permission?: string): Promise<StandardResponse<any>>;
    canPerformAction(groupId: string, userId: string, action: string): Promise<StandardResponse<any>>;
    remove(id: string, user: UserResponse): Promise<DeletedResponse>;
}
