import { SaleMode, SaleChannel, PaymentMethod, CustomerInfo, PhysicalQRCode, SaleResult, ConversionResult } from '../types/sale-types';
export interface ISubscriptionSaleData {
    planId: string;
    quantity: number;
    qrCodes: string[];
    saleMode: SaleMode;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    customerInfo?: CustomerInfo;
    sellerId?: string;
    metadata?: Record<string, any>;
}
export interface IAnonymousConversionData {
    onboardingKey: string;
    customerInfo: CustomerInfo;
    password?: string;
}
export interface IQRCodeValidation {
    qrCode: string;
    isAvailable: boolean;
    status: string;
    assignedAt?: Date;
    errorMessage?: string;
}
export interface ISubscriptionSalesService {
    createSubscriptionSale(saleData: ISubscriptionSaleData): Promise<SaleResult>;
    convertAnonymousSubscription(conversionData: IAnonymousConversionData): Promise<ConversionResult>;
    validateQRCodesAvailability(qrCodes: string[], planId?: string): Promise<IQRCodeValidation[]>;
    getAvailableQRCodes(planId: string, quantity: number): Promise<PhysicalQRCode[]>;
    getSaleDetails(saleId: string): Promise<any>;
    getSubscriptionsByOnboardingKey(onboardingKey: string): Promise<any[]>;
}
