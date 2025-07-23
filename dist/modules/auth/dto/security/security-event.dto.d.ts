import { SecurityEventType } from '../../constants/auth.constants';
export declare class SecurityEventsQueryDto {
    limit?: number;
    offset?: number;
    eventType?: SecurityEventType;
    fromDate?: string;
    toDate?: string;
}
export declare class SecurityEventDto {
    id: string;
    type: SecurityEventType;
    description: string;
    ipAddress: string;
    userAgent: string;
    location: string;
    riskScore: number;
    createdAt: string;
    resolved: boolean;
    metadata?: any;
}
export declare class SecurityEventsResponseDto {
    success: boolean;
    data: {
        events: SecurityEventDto[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    };
}
