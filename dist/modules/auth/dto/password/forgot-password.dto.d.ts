export declare class ForgotPasswordDto {
    email: string;
    captchaToken?: string;
}
export declare class ForgotPasswordResponseDto {
    success: boolean;
    data: {
        emailSent: boolean;
        resetTokenSent: boolean;
        expiresIn: number;
    };
    message: string;
}
