export declare class UserSearchDto {
    query?: string;
    is_active?: boolean;
    email_verified?: boolean;
    phone_verified?: boolean;
    city?: string;
    country?: string;
    language?: string;
    createdAfter?: string;
    createdBefore?: string;
    includeProfile?: boolean;
    includeGroups?: boolean;
    includeRoles?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
