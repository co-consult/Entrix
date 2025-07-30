"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesFlowService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const subscription_plans_service_1 = require("./subscription-plans.service");
const zones_and_seats_service_1 = require("./zones-and-seats.service");
const subscription_sales_service_1 = require("./subscription-sales.service");
const sale_types_1 = require("../types/sale-types");
let SalesFlowService = class SalesFlowService {
    redis;
    subscriptionPlansService;
    zonesAndSeatsService;
    subscriptionSalesService;
    logger;
    SESSION_PREFIX = 'sales-session:';
    SESSION_TTL = 1800;
    constructor(redis, subscriptionPlansService, zonesAndSeatsService, subscriptionSalesService, loggerService) {
        this.redis = redis;
        this.subscriptionPlansService = subscriptionPlansService;
        this.zonesAndSeatsService = zonesAndSeatsService;
        this.subscriptionSalesService = subscriptionSalesService;
        this.logger = loggerService.createChildLogger('SalesFlowService');
    }
    async startSalesSession(sellerId, organizerId) {
        const operationId = this.logger.startOperation('startSalesSession', { sellerId, organizerId });
        try {
            const sessionId = this.generateSessionId();
            const expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);
            const session = {
                sessionId,
                currentStep: 'PLAN_SELECTION',
                quantity: 1,
                createdAt: new Date(),
                expiresAt,
                metadata: { sellerId, organizerId },
            };
            await this.saveSession(session);
            const availablePlans = await this.subscriptionPlansService.getAvailablePlans(organizerId);
            this.logger.logBusinessEvent('SESSION_STARTED', {
                sessionId,
                sellerId,
                organizerId,
                availablePlans: availablePlans.length,
            });
            this.logger.endOperation('startSalesSession', operationId, true);
            return {
                success: true,
                sessionId,
                currentStep: 'PLAN_SELECTION',
                nextStep: 'ZONE_SEAT_SELECTION',
                data: {
                    availablePlans,
                    session: { sessionId, expiresAt },
                },
                message: `Session démarrée. Choisissez un plan parmi ${availablePlans.length} disponible(s).`,
                allowedActions: ['SELECT_PLAN', 'CANCEL_SESSION'],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.startSalesSession', undefined, JSON.stringify({ sellerId, organizerId }));
            this.logger.endOperation('startSalesSession', operationId, false);
            throw error;
        }
    }
    async getSessionStatus(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            return {
                success: true,
                sessionId,
                currentStep: session.currentStep,
                data: {
                    session: {
                        sessionId,
                        currentStep: session.currentStep,
                        planId: session.planId,
                        selectedZoneId: session.selectedZoneId,
                        selectedSeatIds: session.selectedSeatIds,
                        quantity: session.quantity,
                        expiresAt: session.expiresAt,
                    },
                },
                message: `Session en cours - Étape: ${session.currentStep}`,
                allowedActions: this.getAllowedActionsForStep(session.currentStep),
            };
        }
        catch (error) {
            throw new common_1.NotFoundException('Session non trouvée ou expirée');
        }
    }
    async selectPlan(sessionId, planId, quantity) {
        const operationId = this.logger.startOperation('selectPlan', { sessionId, planId, quantity });
        try {
            const session = await this.getSession(sessionId);
            this.validateStep(session, 'PLAN_SELECTION');
            const planDetails = await this.subscriptionPlansService.getPlanDetails(planId);
            if (!planDetails) {
                throw new common_1.NotFoundException('Plan d\'abonnement non trouvé');
            }
            if (planDetails.availableSlots && planDetails.availableSlots < quantity) {
                throw new common_1.BadRequestException(`Seulement ${planDetails.availableSlots} place(s) disponible(s) pour ce plan`);
            }
            session.planId = planId;
            session.planDetails = planDetails;
            session.quantity = quantity;
            session.currentStep = 'ZONE_SEAT_SELECTION';
            await this.saveSession(session);
            const selectionLogic = await this.zonesAndSeatsService.getSelectionLogicForPlan(planId);
            this.logger.logBusinessEvent('PLAN_SELECTED', {
                sessionId,
                planId,
                planName: planDetails.name,
                quantity,
                selectionType: selectionLogic.selectionType,
            });
            this.logger.endOperation('selectPlan', operationId, true);
            return {
                success: true,
                sessionId,
                currentStep: 'ZONE_SEAT_SELECTION',
                nextStep: selectionLogic.selectionType === 'SINGLE_ZONE' && !selectionLogic.hasSeats
                    ? 'CARD_VALIDATION'
                    : 'ZONE_SEAT_SELECTION',
                data: {
                    selectedPlan: {
                        id: planId,
                        name: planDetails.name,
                        price: planDetails.price,
                        currency: planDetails.currency,
                    },
                    quantity,
                    selectionLogic,
                    session: { sessionId, expiresAt: session.expiresAt },
                },
                message: selectionLogic.selectionType === 'SINGLE_ZONE'
                    ? `Plan sélectionné. ${selectionLogic.hasSeats ? 'Sélectionnez vos places.' : 'Aucune sélection de place nécessaire.'}`
                    : 'Plan sélectionné. Choisissez votre zone préférée.',
                allowedActions: selectionLogic.selectionType === 'SINGLE_ZONE' && !selectionLogic.hasSeats
                    ? ['SKIP_TO_CARD_VALIDATION', 'CHANGE_PLAN', 'CANCEL_SESSION']
                    : ['SELECT_ZONE', 'SELECT_SEATS', 'CHANGE_PLAN', 'CANCEL_SESSION'],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.selectPlan', undefined, JSON.stringify({ sessionId, planId, quantity }));
            this.logger.endOperation('selectPlan', operationId, false);
            throw error;
        }
    }
    async selectZone(sessionId, zoneId) {
        const operationId = this.logger.startOperation('selectZone', { sessionId, zoneId });
        try {
            const session = await this.getSession(sessionId);
            this.validateStep(session, 'ZONE_SEAT_SELECTION');
            if (!session.planId) {
                throw new common_1.BadRequestException('Aucun plan sélectionné');
            }
            const seatsInfo = await this.zonesAndSeatsService.getAvailableSeatsInZone(zoneId, session.quantity);
            if (!seatsInfo.canAccommodateQuantity) {
                throw new common_1.BadRequestException(`Cette zone ne peut accueillir ${session.quantity} abonnement(s). ${seatsInfo.message}`);
            }
            session.selectedZoneId = zoneId;
            await this.saveSession(session);
            this.logger.logBusinessEvent('ZONE_SELECTED', {
                sessionId,
                zoneId,
                zoneName: seatsInfo.zoneName,
                hasSeats: seatsInfo.hasSeats,
                quantity: session.quantity,
            });
            this.logger.endOperation('selectZone', operationId, true);
            const nextActions = seatsInfo.hasSeats
                ? ['SELECT_SEATS', 'CHANGE_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION']
                : ['PROCEED_TO_CARD_VALIDATION', 'CHANGE_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION'];
            return {
                success: true,
                sessionId,
                currentStep: 'ZONE_SEAT_SELECTION',
                nextStep: seatsInfo.hasSeats ? 'SEAT_SELECTION' : 'CARD_VALIDATION',
                data: {
                    selectedZone: {
                        id: zoneId,
                        name: seatsInfo.zoneName,
                        hasSeats: seatsInfo.hasSeats,
                    },
                    seatsInfo,
                    session: { sessionId, expiresAt: session.expiresAt },
                },
                message: seatsInfo.hasSeats
                    ? `Zone sélectionnée. Choisissez ${session.quantity} place(s) parmi ${seatsInfo.availableSeats?.length || 0} disponible(s).`
                    : 'Zone sélectionnée. Aucune sélection de place nécessaire.',
                allowedActions: nextActions,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.selectZone', undefined, JSON.stringify({ sessionId, zoneId }));
            this.logger.endOperation('selectZone', operationId, false);
            throw error;
        }
    }
    async selectSeats(sessionId, seatIds) {
        const operationId = this.logger.startOperation('selectSeats', { sessionId, seatIds });
        try {
            const session = await this.getSession(sessionId);
            this.validateStep(session, 'ZONE_SEAT_SELECTION');
            if (!session.selectedZoneId) {
                throw new common_1.BadRequestException('Aucune zone sélectionnée');
            }
            if (seatIds.length !== session.quantity) {
                throw new common_1.BadRequestException(`Vous devez sélectionner exactement ${session.quantity} place(s), mais ${seatIds.length} sélectionnée(s)`);
            }
            const reservation = await this.zonesAndSeatsService.reserveSeatsTemporarily(session.selectedZoneId, seatIds, 10, session.metadata?.sellerId);
            session.selectedSeatIds = seatIds;
            session.reservationId = reservation.reservationId;
            session.currentStep = 'CARD_VALIDATION';
            await this.saveSession(session);
            this.logger.logBusinessEvent('SEATS_SELECTED', {
                sessionId,
                zoneId: session.selectedZoneId,
                seatIds,
                reservationId: reservation.reservationId,
                quantity: session.quantity,
            });
            this.logger.endOperation('selectSeats', operationId, true);
            return {
                success: true,
                sessionId,
                currentStep: 'CARD_VALIDATION',
                nextStep: 'PAYMENT',
                data: {
                    selectedSeats: reservation.reservedSeats,
                    reservation: {
                        id: reservation.reservationId,
                        expiresAt: reservation.expiresAt,
                        expiresInMinutes: reservation.expiresInMinutes,
                    },
                    session: { sessionId, expiresAt: session.expiresAt },
                },
                message: `Places réservées temporairement. Scannez ${session.quantity} carte(s) physique(s) pour continuer.`,
                allowedActions: ['VALIDATE_CARDS', 'CHANGE_SEATS', 'CHANGE_ZONE', 'CANCEL_SESSION'],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.selectSeats', undefined, JSON.stringify({ sessionId, seatIds }));
            this.logger.endOperation('selectSeats', operationId, false);
            throw error;
        }
    }
    async validatePhysicalCards(sessionId, cards) {
        const operationId = this.logger.startOperation('validatePhysicalCards', { sessionId, cards });
        try {
            const session = await this.getSession(sessionId);
            this.validateStep(session, 'CARD_VALIDATION');
            if (!session.planId) {
                throw new common_1.BadRequestException('Session incomplète - aucun plan sélectionné');
            }
            if (cards.length !== session.quantity) {
                throw new common_1.BadRequestException(`Vous devez scanner exactement ${session.quantity} carte(s), mais ${cards.length} scannée(s)`);
            }
            const qrCodes = cards.filter(c => c.qrCode).map(c => c.qrCode);
            const serialNumbers = cards.filter(c => c.serialNumber).map(c => c.serialNumber);
            const qrValidations = qrCodes.length > 0
                ? await this.subscriptionSalesService.validateQRCodesAvailability(qrCodes, session.planId)
                : [];
            const serialValidations = serialNumbers.length > 0
                ? await this.subscriptionSalesService.validateQRCodesAvailability(undefined, session.planId)
                : [];
            const allValidations = [...qrValidations, ...serialValidations];
            const unavailableCards = allValidations.filter(v => !v.isAvailable);
            if (unavailableCards.length > 0) {
                throw new common_1.BadRequestException(`Cartes non disponibles: ${unavailableCards.map(v => v.qrCode).join(', ')}`);
            }
            session.qrCodes = qrCodes;
            session.serialNumbers = serialNumbers;
            session.currentStep = 'PAYMENT';
            await this.saveSession(session);
            this.logger.logBusinessEvent('CARDS_VALIDATED', {
                sessionId,
                qrCodes,
                serialNumbers,
                totalCards: cards.length,
            });
            this.logger.endOperation('validatePhysicalCards', operationId, true);
            return {
                success: true,
                sessionId,
                currentStep: 'PAYMENT',
                data: {
                    validatedCards: allValidations.filter(v => v.isAvailable),
                    summary: {
                        planName: session.planDetails?.name,
                        quantity: session.quantity,
                        totalPrice: session.planDetails?.price * session.quantity,
                        currency: session.planDetails?.currency,
                    },
                    selectedZone: session.selectedZoneId ? {
                        id: session.selectedZoneId,
                        seats: session.selectedSeatIds,
                    } : null,
                    session: { sessionId, expiresAt: session.expiresAt },
                },
                message: 'Cartes validées avec succès. Saisissez les informations client pour finaliser.',
                allowedActions: ['ENTER_CUSTOMER_INFO', 'RETRY_CARDS', 'CANCEL_SESSION'],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.validatePhysicalCards', undefined, JSON.stringify({ sessionId, cards }));
            this.logger.endOperation('validatePhysicalCards', operationId, false);
            throw error;
        }
    }
    async completeSale(sessionId, customerInfo, paymentMethod, saleMode = 'IDENTIFIED') {
        const operationId = this.logger.startOperation('completeSale', {
            sessionId,
            saleMode,
            paymentMethod
        });
        try {
            const session = await this.getSession(sessionId);
            this.validateStep(session, 'PAYMENT');
            if (!session.planId || !session.qrCodes) {
                throw new common_1.BadRequestException('Session incomplète - plan ou cartes manquants');
            }
            const saleModeEnum = saleMode === 'IDENTIFIED' ? sale_types_1.SaleMode.IDENTIFIED : sale_types_1.SaleMode.ANONYMOUS;
            const saleData = {
                planId: session.planId,
                quantity: session.quantity,
                qrCodes: session.qrCodes,
                saleMode: saleModeEnum,
                saleChannel: sale_types_1.SaleChannel.PHYSICAL,
                paymentMethod: paymentMethod,
                amount: session.planDetails.price * session.quantity,
                currency: session.planDetails.currency,
                customerInfo: saleMode === 'IDENTIFIED' ? customerInfo : undefined,
                sellerId: session.metadata?.sellerId,
                metadata: {
                    sessionId,
                    selectedZoneId: session.selectedZoneId,
                    selectedSeatIds: session.selectedSeatIds,
                    reservationId: session.reservationId,
                },
            };
            const saleResult = await this.subscriptionSalesService.createSubscriptionSale(saleData);
            if (session.reservationId && session.selectedSeatIds) {
                await this.zonesAndSeatsService.confirmSeatsReservation(session.reservationId, saleResult.subscriptions[0].id);
            }
            await this.clearSession(sessionId);
            this.logger.logBusinessEvent('SALE_COMPLETED', {
                sessionId,
                orderId: saleResult.order.id,
                subscriptionIds: saleResult.subscriptions.map(s => s.id),
                amount: saleResult.order.total,
                saleMode,
                paymentMethod: paymentMethod.toString(),
            });
            this.logger.endOperation('completeSale', operationId, true);
            return {
                success: true,
                sessionId,
                currentStep: 'COMPLETION',
                data: {
                    sale: saleResult,
                    receipt: {
                        orderId: saleResult.order.id,
                        subscriptions: saleResult.subscriptions,
                        customer: saleResult.user,
                        amount: saleResult.order.total,
                        currency: saleResult.order.currency,
                        paymentMethod: paymentMethod.toString(),
                        soldAt: new Date(),
                    },
                },
                message: saleResult.message,
                allowedActions: ['START_NEW_SALE', 'PRINT_RECEIPT'],
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.completeSale', undefined, JSON.stringify({ sessionId, saleMode, paymentMethod: paymentMethod.toString() }));
            this.logger.endOperation('completeSale', operationId, false);
            throw error;
        }
    }
    async getSession(sessionId) {
        const cacheKey = `${this.SESSION_PREFIX}${sessionId}`;
        const session = await this.redis.getCache(cacheKey);
        if (!session) {
            throw new common_1.NotFoundException('Session non trouvée ou expirée');
        }
        if (new Date() > session.expiresAt) {
            await this.clearSession(sessionId);
            throw new common_1.BadRequestException('Session expirée');
        }
        return session;
    }
    async saveSession(session) {
        const cacheKey = `${this.SESSION_PREFIX}${session.sessionId}`;
        await this.redis.setCache(cacheKey, session, this.SESSION_TTL);
    }
    async clearSession(sessionId) {
        const cacheKey = `${this.SESSION_PREFIX}${sessionId}`;
        await this.redis.delCache(cacheKey);
    }
    validateStep(session, expectedStep) {
        if (session.currentStep !== expectedStep) {
            throw new common_1.BadRequestException(`Étape invalide. Étape attendue: ${expectedStep}, étape courante: ${session.currentStep}`);
        }
    }
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7).toUpperCase();
        return `SALES_${timestamp}_${random}`;
    }
    getAllowedActionsForStep(currentStep) {
        switch (currentStep) {
            case 'PLAN_SELECTION':
                return ['SELECT_PLAN', 'CANCEL_SESSION'];
            case 'ZONE_SEAT_SELECTION':
                return ['SELECT_ZONE', 'SELECT_SEATS', 'CHANGE_PLAN', 'CANCEL_SESSION'];
            case 'CARD_VALIDATION':
                return ['VALIDATE_CARDS', 'CHANGE_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION'];
            case 'PAYMENT':
                return ['ENTER_CUSTOMER_INFO', 'COMPLETE_ANONYMOUS_SALE', 'CANCEL_SESSION'];
            default:
                return ['CANCEL_SESSION'];
        }
    }
    async cancelSession(sessionId) {
        const operationId = this.logger.startOperation('cancelSession', { sessionId });
        try {
            const session = await this.getSession(sessionId);
            if (session.reservationId && session.selectedSeatIds) {
                await this.zonesAndSeatsService.releaseTemporaryReservation(session.reservationId);
            }
            await this.clearSession(sessionId);
            this.logger.logBusinessEvent('SESSION_CANCELLED', {
                sessionId,
                currentStep: session.currentStep,
                hadReservation: !!session.reservationId,
            });
            this.logger.endOperation('cancelSession', operationId, true);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.cancelSession', undefined, JSON.stringify({ sessionId }));
            this.logger.endOperation('cancelSession', operationId, false);
            throw error;
        }
    }
    async cleanupExpiredSessions() {
        const operationId = this.logger.startOperation('cleanupExpiredSessions');
        try {
            const cleanedCount = 0;
            this.logger.logBusinessEvent('EXPIRED_SESSIONS_CLEANED', {
                cleanedCount,
            });
            this.logger.endOperation('cleanupExpiredSessions', operationId, true);
            return {
                cleaned: cleanedCount,
                message: `${cleanedCount} session(s) expirée(s) nettoyée(s)`,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'SalesFlowService.cleanupExpiredSessions', undefined, '{}');
            this.logger.endOperation('cleanupExpiredSessions', operationId, false);
            throw error;
        }
    }
};
exports.SalesFlowService = SalesFlowService;
exports.SalesFlowService = SalesFlowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        subscription_plans_service_1.SubscriptionPlansService,
        zones_and_seats_service_1.ZonesAndSeatsService,
        subscription_sales_service_1.SubscriptionSalesService,
        logger_service_1.LoggerService])
], SalesFlowService);
//# sourceMappingURL=sales-flow.service.js.map