import { Module } from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';
import { RateLimitingGuard } from './rate-limiting.guard';

@Module({
  providers: [RateLimitingService, RateLimitingGuard],
  exports: [RateLimitingService, RateLimitingGuard],
})
export class RateLimitingModule {} 