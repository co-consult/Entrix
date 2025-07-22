export class ResetPasswordDto {
  email: string;
}

export class ConfirmResetPasswordDto {
  token: string;
  newPassword: string;
} 