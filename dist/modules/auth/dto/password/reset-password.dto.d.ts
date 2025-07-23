export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class ResetPasswordResponseDto {
    success: boolean;
    data: {
        passwordReset: boolean;
        autoLogin: boolean;
    };
    message: string;
}
