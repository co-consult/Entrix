import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions } from './interfaces';
import { RATE_LIMIT_KEY } from './rate-limiting.guard';

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options); 