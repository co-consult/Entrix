export declare enum SaleMode {
    IDENTIFIED = "IDENTIFIED",
    ANONYMOUS = "ANONYMOUS"
}
export declare enum SaleChannel {
    PHYSICAL = "PHYSICAL",
    FRONTEND = "FRONTEND"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    CARD = "CARD",
    FLOUCI = "FLOUCI",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare enum QRCodeStatus {
    AVAILABLE = "AVAILABLE",
    ASSIGNED = "ASSIGNED",
    DISABLED = "DISABLED"
}
export interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    fanId?: string;
}
export interface PhysicalQRCode {
    qrCode: string;
    onboardingKey: string;
    serialNumber: string;
    subscriptionPlanId?: string;
    status: QRCodeStatus;
    cardBatch?: string;
    cardType?: string;
    assignedBy?: string;
}
export interface SaleResult {
    success: boolean;
    subscriptions: {
        id: string;
        qrCode: string;
        onboardingKey: string;
    }[];
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    order: {
        id: string;
        total: number;
        currency: string;
    };
    message: string;
}
export interface ConversionResult {
    success: boolean;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    subscriptionsMigrated: number;
    incentivesApplied?: {
        type: string;
        value: number;
        description: string;
    };
    message: string;
}
