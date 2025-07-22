// src/modules/users/dto/profiles/update-profile.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

// Update DTO qui hérite de Create mais avec tous les champs optionnels
// On omets userId car il ne peut pas être modifié
export class UpdateProfileDto extends PartialType(
  OmitType(CreateProfileDto, ['userId'] as const)
) {}