// src/modules/users/dto/users/update-user.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Update DTO qui hérite de Create mais avec tous les champs optionnels
// On omets l'email car il ne peut pas être modifié via cette route
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const)
) {}