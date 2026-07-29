import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PartnerSubscriptionTypeDto {
  GRADIN = 'GRADIN',
  CHAISE = 'CHAISE',
}

export class CheckExistingDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ConfirmExistingDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsEnum(PartnerSubscriptionTypeDto)
  subscriptionType: PartnerSubscriptionTypeDto;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsNumber()
  @Min(0)
  amountPaid: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;

  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;
}

export class CheckNewDto {
  @IsEnum(PartnerSubscriptionTypeDto)
  subscriptionType: PartnerSubscriptionTypeDto;

  @IsString()
  @IsOptional()
  standNumber?: string;

  @IsString()
  @IsOptional()
  rowNumber?: string;

  @IsString()
  @IsOptional()
  seatNumber?: string;
}

export class ConfirmNewDto extends ConfirmExistingDto {
  @IsString()
  @IsOptional()
  standNumber?: string;

  @IsString()
  @IsOptional()
  rowNumber?: string;

  @IsString()
  @IsOptional()
  seatNumber?: string;
}
