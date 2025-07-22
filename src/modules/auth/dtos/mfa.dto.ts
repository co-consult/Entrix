export class MfaLoginDto {
  code: string;
  method: 'email' | 'sms' | 'totp';
} 