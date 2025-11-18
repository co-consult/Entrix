// src/modules/qr-codes/types/response.types.ts

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreatedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface UpdatedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface DeletedResponse {
  success: boolean;
  message: string;
} 