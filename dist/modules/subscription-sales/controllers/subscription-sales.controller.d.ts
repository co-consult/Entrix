import { SubscriptionSalesService } from '../services/subscription-sales.service';
import { SubscriptionPlansService } from '../services/subscription-plans.service';
import { ZonesAndSeatsService } from '../services/zones-and-seats.service';
import { SalesFlowService } from '../services/sales-flow.service';
import { CreateSubscriptionSaleDto } from '../dto/create-subscription-sale.dto';
import { ConvertAnonymousSubscriptionDto } from '../dto/convert-anonymous-subscription.dto';
import { SubscriptionSaleResponseDto, ConversionResponseDto, QRCodeValidationDto } from '../dto/subscription-sale-response.dto';
import { StartSalesSessionDto, SelectPlanDto, SelectZoneDto, SelectSeatsDto, ValidatePhysicalCardsDto, CompleteSaleDto, CompleteAnonymousSaleDto, FlowStepResponseDto, AvailablePlansResponseDto, PlanZonesResponseDto, ZoneSeatsResponseDto } from '../dto/sales-flow.dto';
export declare class SubscriptionSalesController {
    private readonly subscriptionSalesService;
    private readonly subscriptionPlansService;
    private readonly zonesAndSeatsService;
    private readonly salesFlowService;
    constructor(subscriptionSalesService: SubscriptionSalesService, subscriptionPlansService: SubscriptionPlansService, zonesAndSeatsService: ZonesAndSeatsService, salesFlowService: SalesFlowService);
    startSalesSession(startDto: StartSalesSessionDto): Promise<FlowStepResponseDto>;
    selectPlan(sessionId: string, selectPlanDto: SelectPlanDto): Promise<FlowStepResponseDto>;
    selectZone(sessionId: string, selectZoneDto: SelectZoneDto): Promise<FlowStepResponseDto>;
    selectSeats(sessionId: string, selectSeatsDto: SelectSeatsDto): Promise<FlowStepResponseDto>;
    validatePhysicalCards(sessionId: string, validateCardsDto: ValidatePhysicalCardsDto): Promise<FlowStepResponseDto>;
    completeSale(sessionId: string, completeSaleDto: CompleteSaleDto): Promise<FlowStepResponseDto>;
    completeAnonymousSale(sessionId: string, completeAnonymousDto: CompleteAnonymousSaleDto): Promise<FlowStepResponseDto>;
    getSessionStatus(sessionId: string): Promise<FlowStepResponseDto>;
    cancelSession(sessionId: string): Promise<void>;
    createDirectSale(createSaleDto: CreateSubscriptionSaleDto): Promise<SubscriptionSaleResponseDto>;
    convertAnonymousSubscription(convertDto: ConvertAnonymousSubscriptionDto): Promise<ConversionResponseDto>;
    getAvailablePlans(organizerId?: string): Promise<AvailablePlansResponseDto>;
    getPlanZones(planId: string): Promise<PlanZonesResponseDto>;
    getZoneSeats(zoneId: string, quantityParam?: string): Promise<ZoneSeatsResponseDto>;
    validateQRCodes(codesParam: string, planId?: string): Promise<QRCodeValidationDto[]>;
    getAvailableQRCodes(planId: string, quantityParam: string): Promise<{
        success: boolean;
        data: {
            qrCode: string;
            onboardingKey: string;
            serialNumber: string;
            subscriptionPlanId: string;
            status: import("../types/sale-types").QRCodeStatus;
            cardBatch: string;
            cardType: string;
            assignedBy: string;
        }[];
        message: string;
    }>;
    getSaleDetails(saleId: string): Promise<{
        success: boolean;
        data: {
            order: {
                id: any;
                status: any;
                total: any;
                currency: any;
                channel: any;
                paymentMethod: any;
                createdAt: any;
                confirmedAt: any;
                metadata: any;
            };
            user: {
                id: any;
                email: any;
                firstName: any;
                lastName: any;
            };
            subscriptions: any;
        };
        message: string;
    }>;
    getSubscriptionsByOnboardingKey(onboardingKey: string): Promise<{
        success: boolean;
        data: {
            id: any;
            qrCode: any;
            status: any;
            startDate: any;
            endDate: any;
            pricePaid: any;
            isAnonymous: boolean;
            plan: {
                id: any;
                name: any;
                type: any;
            };
            onboardingInfo: any;
        }[];
        message: string;
    }>;
    getAllPlansByOrganizer(organizerId: string): Promise<{
        success: boolean;
        data: any;
        totalPlans: any;
        activePlans: any;
        inactivePlans: any;
        plansOnSale: any;
        message: string;
    }>;
}
