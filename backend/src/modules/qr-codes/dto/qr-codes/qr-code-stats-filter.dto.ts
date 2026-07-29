import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { QRCodeStatus } from '../../interfaces/qr-code.interface';

export class QRCodeStatsFilterDto {
  @ApiPropertyOptional({ enum: QRCodeStatus })
  @IsOptional()
  @IsEnum(QRCodeStatus)
  status?: QRCodeStatus;

  @ApiPropertyOptional({ description: 'ID du plan d\'abonnement' })
  @IsOptional()
  @IsUUID(4)
  subscription_plan_id?: string;

  @ApiPropertyOptional({ description: 'Alias camelCase pour subscription_plan_id' })
  @IsOptional()
  @IsUUID(4)
  subscriptionPlanId?: string;

  @ApiPropertyOptional({ example: '2026-2027' })
  @IsOptional()
  @IsString()
  season?: string;
}
