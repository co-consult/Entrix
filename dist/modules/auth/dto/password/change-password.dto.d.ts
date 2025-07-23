export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class ChangePasswordResponseDto {
    success: boolean;
    data: {
        passwordChanged: boolean;
        securityEventLogged: boolean;
    };
    message: string;
}
