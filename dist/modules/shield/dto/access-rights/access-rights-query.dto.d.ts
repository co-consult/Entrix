import { AccessRightStatus, AccessSourceType } from '../../types/access-enums';
export declare class AccessRightsQueryDto {
    user_id?: string;
    event_id?: string;
    organizer_id?: string;
    status?: AccessRightStatus;
    source_type?: AccessSourceType;
    zone_id?: string;
    valid_from?: Date;
    valid_until?: Date;
    page?: number;
    limit?: number;
    include_expired?: boolean;
}
