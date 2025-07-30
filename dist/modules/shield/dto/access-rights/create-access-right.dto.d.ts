import { AccessSourceType } from '../../types/access-enums';
export declare class CreateAccessRightDto {
    user_id?: string;
    event_id?: string;
    organizer_id?: string;
    subscription_id?: string;
    ticket_id?: string;
    zone_id?: string;
    seat_id?: string;
    source_type: AccessSourceType;
    valid_from: Date;
    valid_until: Date;
    max_uses?: number;
    access_metadata?: any;
    special_permissions?: any;
}
