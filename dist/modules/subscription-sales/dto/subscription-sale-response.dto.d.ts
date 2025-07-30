export declare class SubscriptionInfoDto {
    id: string;
    qrCode: string;
    onboardingKey: string;
}
export declare class UserInfoDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}
export declare class OrderInfoDto {
    id: string;
    total: number;
    currency: string;
}
export declare class IncentiveInfoDto {
    type: string;
    value: number;
    description: string;
}
export declare class SubscriptionSaleResponseDto {
    success: boolean;
    subscriptions: SubscriptionInfoDto[];
    user?: UserInfoDto;
    order: OrderInfoDto;
    message: string;
}
export declare class ConversionResponseDto {
    success: boolean;
    user: UserInfoDto;
    subscriptionsMigrated: number;
    incentivesApplied?: IncentiveInfoDto;
    message: string;
}
export declare class QRCodeValidationDto {
    qrCode: string;
    isAvailable: boolean;
    status: string;
    assignedAt?: Date;
    errorMessage?: string;
}
