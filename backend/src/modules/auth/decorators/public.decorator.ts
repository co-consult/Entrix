// src/modules/auth/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator Entrix V3.0
 * Marque un endpoint comme public (pas besoin d'authentification)
 */

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);