// src/modules/subscription-sales/dto/update-subscription-plan.dto.ts

import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateSubscriptionPlanDto } from './create-subscription-plan.dto';

/**
 * DTO for updating a subscription plan
 * All fields are optional except those that cannot be changed
 */
export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {
  // Code should not be updatable after creation (business rule)
  // We'll override it to make it optional but validate it's not changed
  @ApiPropertyOptional({
    description: 'Plan code (cannot be changed after creation)',
    example: 'PLAN-2025-SEASON-A',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Whether the plan is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

