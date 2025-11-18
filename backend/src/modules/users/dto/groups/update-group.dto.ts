// src/modules/users/dto/groups/update-group.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';

// Update DTO qui hérite de Create mais avec tous les champs optionnels
// On omets le type car il ne peut pas être modifié après création
// On omets aussi initialInvites car ce n'est que pour la création
export class UpdateGroupDto extends PartialType(
  OmitType(CreateGroupDto, ['type', 'initialInvites'] as const)
) {}