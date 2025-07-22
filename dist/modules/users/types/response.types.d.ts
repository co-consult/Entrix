export interface StandardResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp?: string;
        version?: string;
        requestId?: string;
    };
}
export interface PaginatedResponse<T> extends StandardResponse<T[]> {
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface CreatedResponse<T> extends StandardResponse<T> {
    message: string;
}
export interface UpdatedResponse<T> extends StandardResponse<T> {
    message: string;
}
export interface DeletedResponse extends StandardResponse<null> {
    message: string;
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        statusCode?: number;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}
export interface ValidationErrorResponse extends ErrorResponse {
    error: {
        code: 'VALIDATION_ERROR';
        message: string;
        details: {
            field: string;
            message: string;
            value?: any;
        }[];
    };
}
