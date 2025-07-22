export declare class CreateUserDto {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar?: string;
    is_active?: boolean;
    email_verified?: boolean;
    phone_verified?: boolean;
    metadata?: Record<string, any>;
}
