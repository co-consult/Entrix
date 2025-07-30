import { SaleMode, SaleChannel, PaymentMethod } from '../types/sale-types';
export declare class CustomerInfoDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    fanId?: string;
}
export declare class CreateSubscriptionSaleDto {
    planId: string;
    quantity: number;
    qrCodes: string[];
    saleMode: SaleMode;
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    customerInfo?: CustomerInfoDto;
    sellerId?: string;
    metadata?: Record<string, any>;
}
