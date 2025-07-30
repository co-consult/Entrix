import { CreateAccessRightDto } from './create-access-right.dto';
import { AccessRightStatus } from '../../types/access-enums';
declare const UpdateAccessRightDto_base: import("@nestjs/common").Type<Partial<Omit<CreateAccessRightDto, "source_type">>>;
export declare class UpdateAccessRightDto extends UpdateAccessRightDto_base {
    status?: AccessRightStatus;
}
export {};
