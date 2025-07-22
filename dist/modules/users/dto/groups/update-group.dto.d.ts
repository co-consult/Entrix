import { CreateGroupDto } from './create-group.dto';
declare const UpdateGroupDto_base: import("@nestjs/common").Type<Partial<Omit<CreateGroupDto, "type" | "initialInvites">>>;
export declare class UpdateGroupDto extends UpdateGroupDto_base {
}
export {};
