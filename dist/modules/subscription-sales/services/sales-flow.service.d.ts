import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { ZonesAndSeatsService } from './zones-and-seats.service';
import { SubscriptionSalesService } from './subscription-sales.service';
import { PaymentMethod } from '../types/sale-types';
interface FlowStepResult {
    success: boolean;
    sessionId: string;
    currentStep: string;
    nextStep?: string;
    data: any;
    message: string;
    allowedActions: string[];
}
interface PhysicalCard {
    qrCode?: string;
    serialNumber?: string;
}
export declare class SalesFlowService {
    private readonly redis;
    private readonly subscriptionPlansService;
    private readonly zonesAndSeatsService;
    private readonly subscriptionSalesService;
    private readonly logger;
    private readonly SESSION_PREFIX;
    private readonly SESSION_TTL;
    constructor(redis: RedisService, subscriptionPlansService: SubscriptionPlansService, zonesAndSeatsService: ZonesAndSeatsService, subscriptionSalesService: SubscriptionSalesService, loggerService: LoggerService);
    startSalesSession(sellerId?: string, organizerId?: string): Promise<FlowStepResult>;
    getSessionStatus(sessionId: string): Promise<FlowStepResult>;
    selectPlan(sessionId: string, planId: string, quantity: number): Promise<FlowStepResult>;
    selectZone(sessionId: string, zoneId: string): Promise<FlowStepResult>;
    selectSeats(sessionId: string, seatIds: string[]): Promise<FlowStepResult>;
    validatePhysicalCards(sessionId: string, cards: PhysicalCard[]): Promise<FlowStepResult>;
    completeSale(sessionId: string, customerInfo: any, paymentMethod: PaymentMethod, saleMode?: 'IDENTIFIED' | 'ANONYMOUS'): Promise<FlowStepResult>;
    private getSession;
    private saveSession;
    private clearSession;
    private validateStep;
    private generateSessionId;
    private getAllowedActionsForStep;
    cancelSession(sessionId: string): Promise<void>;
    cleanupExpiredSessions(): Promise<{
        cleaned: number;
        message: string;
    }>;
}
export {};
