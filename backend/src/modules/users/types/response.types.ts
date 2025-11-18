// src/shared/types/response.types.ts

// Type générique pour les réponses standardisées de l'API
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

// Type pour les réponses paginées
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

// Type pour les réponses de création
export interface CreatedResponse<T> extends StandardResponse<T> {
  message: string; // Message obligatoire pour les créations
}

// Type pour les réponses de mise à jour
export interface UpdatedResponse<T> extends StandardResponse<T> {
  message: string; // Message obligatoire pour les mises à jour
}

// Type pour les réponses de suppression
export interface DeletedResponse extends StandardResponse<null> {
  message: string; // Message obligatoire pour les suppressions
}

// Type pour les réponses d'erreur
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

// Type pour les réponses de validation
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