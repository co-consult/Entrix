import { CustomerInfoDto } from './create-subscription-sale.dto';
import { PaymentMethod } from '../types/sale-types';
export declare class StartSalesSessionDto {
    sellerId?: string;
    organizerId?: string;
}
export declare class SelectPlanDto {
    planId: string;
    quantity: number;
}
export declare class SelectZoneDto {
    zoneId: string;
}
export declare class SelectSeatsDto {
    seatIds: string[];
}
export declare class PhysicalCardDto {
    qrCode?: string;
    serialNumber?: string;
}
export declare class ValidatePhysicalCardsDto {
    cards: PhysicalCardDto[];
}
export declare class CompleteSaleDto {
    customerInfo: CustomerInfoDto;
    paymentMethod: PaymentMethod;
    saleMode?: 'IDENTIFIED' | 'ANONYMOUS';
}
export declare class CompleteAnonymousSaleDto {
    paymentMethod: PaymentMethod;
}
export declare class FlowStepResponseDto {
    success: boolean;
    sessionId: string;
    currentStep: string;
    nextStep?: string;
    data: any;
    message: string;
    allowedActions: string[];
}
export declare class AvailablePlansResponseDto {
    success: boolean;
    data: any[];
    totalPlans: number;
    message: string;
}
export declare class PlanZonesResponseDto {
    success: boolean;
    planId: string;
    selectionType: string;
    zones: any[];
    message: string;
}
export declare class ZoneSeatsResponseDto {
    success: boolean;
    zoneId: string;
    zoneName: string;
    hasSeats: boolean;
    availableSeats: any[];
    canAccommodateQuantity: boolean;
    message: string;
}
