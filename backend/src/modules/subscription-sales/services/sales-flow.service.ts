// src/modules/subscription-sales/services/sales-flow.service.ts

import { 
  Injectable, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';

// Services partagés
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';

// Services du module
import { SubscriptionPlansService } from './subscription-plans.service';
import { ZonesAndSeatsService } from './zones-and-seats.service';
import { SubscriptionSalesService } from './subscription-sales.service';

// Interfaces et types
import { ISubscriptionSaleData } from '../interfaces/subscription-sale.interface';
import { SaleMode, SaleChannel, PaymentMethod } from '../types/sale-types';

// Types de session
interface SalesSession {
  sessionId: string;
  currentStep: 'PLAN_SELECTION' | 'ZONE_SEAT_SELECTION' | 'CARD_VALIDATION' | 'PAYMENT';
  planId?: string;
  planDetails?: any;
  selectedZoneId?: string;
  selectedSeatIds?: string[];
  reservationId?: string;
  quantity: number;
  qrCodes?: string[];
  serialNumbers?: string[];
  customerInfo?: any;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

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

/**
 * Service orchestrateur pour le flow complet de vente d'abonnements
 * Gère l'état de session et la progression à travers les 3 étapes
 */
@Injectable()
export class SalesFlowService {
  private readonly logger: LoggerService;
  private readonly SESSION_PREFIX = 'sales-session:';
  private readonly SESSION_TTL = 1800; // 30 minutes

  constructor(
    private readonly redis: RedisService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly zonesAndSeatsService: ZonesAndSeatsService,
    private readonly subscriptionSalesService: SubscriptionSalesService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SalesFlowService');
  }

  // ============================================================================
  // GESTION DE SESSION
  // ============================================================================

  /**
   * Démarre une nouvelle session de vente
   */
  async startSalesSession(sellerId?: string, organizerId?: string): Promise<FlowStepResult> {
    const operationId = this.logger.startOperation('startSalesSession', { sellerId, organizerId });

    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + this.SESSION_TTL * 1000);

      const session: SalesSession = {
        sessionId,
        currentStep: 'PLAN_SELECTION',
        quantity: 1, // Valeur par défaut
        createdAt: new Date(),
        expiresAt,
        metadata: { sellerId, organizerId },
      };

      await this.saveSession(session);

      // Récupérer les plans disponibles pour démarrer
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

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.startSalesSession',
        undefined,
        JSON.stringify({ sellerId, organizerId })
      );
      this.logger.endOperation('startSalesSession', operationId, false);
      throw error;
    }
  }

  /**
   * Récupère l'état d'une session existante
   */
  async getSessionStatus(sessionId: string): Promise<FlowStepResult> {
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

    } catch (error) {
      throw new NotFoundException('Session non trouvée ou expirée');
    }
  }

  // ============================================================================
  // ÉTAPE 1 : SÉLECTION PLAN D'ABONNEMENT
  // ============================================================================

/**
 * Sélectionne un plan d'abonnement et sa quantité
 * Amélioration : Auto-sélection zone unique + saut d'étape
 */
async selectPlan(sessionId: string, planId: string, quantity: number): Promise<FlowStepResult> {
  const operationId = this.logger.startOperation('selectPlan', { sessionId, planId, quantity });

  try {
    const session = await this.getSession(sessionId);
    this.validateStep(session, 'PLAN_SELECTION');

    // Valider et récupérer les détails du plan
    const planDetails = await this.subscriptionPlansService.getPlanDetails(planId);
    if (!planDetails) {
      throw new NotFoundException('Plan d\'abonnement non trouvé');
    }

    // Vérifier disponibilité pour la quantité demandée
    if (planDetails.availableSlots && planDetails.availableSlots < quantity) {
      throw new BadRequestException(
        `Seulement ${planDetails.availableSlots} place(s) disponible(s) pour ce plan`
      );
    }

    // Déterminer la logique de sélection des zones
    const selectionLogic = await this.zonesAndSeatsService.getSelectionLogicForPlan(planId);

    // ============================================================================
    // 🚀 AMÉLIORATION : AUTO-SÉLECTION ZONE UNIQUE
    // ============================================================================
    
    if (selectionLogic.selectionType === 'SINGLE_ZONE') {
      // Auto-sélectionner la zone unique
      const uniqueZone = selectionLogic.zones[0];
      
      // Mettre à jour la session avec la zone auto-sélectionnée
      session.planId = planId;
      session.planDetails = planDetails;
      session.quantity = quantity;
      session.selectedZoneId = uniqueZone.id; // ✅ AUTO-SÉLECTION !
      
      if (selectionLogic.hasSeats) {
        // Zone unique AVEC places → aller directement à sélection sièges
        session.currentStep = 'ZONE_SEAT_SELECTION';
        await this.saveSession(session);

        // Charger les places disponibles de la zone unique
        const seatsInfo = await this.zonesAndSeatsService.getAvailableSeatsInZone(
          uniqueZone.id, 
          quantity
        );

        this.logger.logBusinessEvent('PLAN_SELECTED_SINGLE_ZONE_AUTO', {
          sessionId,
          planId,
          planName: planDetails.name,
          quantity,
          autoSelectedZone: uniqueZone.id,
          zoneName: uniqueZone.name,
          hasSeats: true,
        });

        this.logger.endOperation('selectPlan', operationId, true);

        return {
          success: true,
          sessionId,
          currentStep: 'ZONE_SEAT_SELECTION',
          nextStep: 'SEAT_SELECTION',
          data: {
            selectedPlan: {
              id: planId,
              name: planDetails.name,
              price: planDetails.price,
              currency: planDetails.currency,
            },
            quantity,
            autoSelectedZone: {
              id: uniqueZone.id,
              name: uniqueZone.name,
              hasSeats: true,
            },
            seatsInfo,
            session: { sessionId, expiresAt: session.expiresAt },
          },
          message: `Plan "${planDetails.name}" sélectionné. Zone "${uniqueZone.name}" auto-sélectionnée. Choisissez vos ${quantity} place(s).`,
          allowedActions: ['SELECT_SEATS', 'CHANGE_PLAN', 'CANCEL_SESSION'],
        };
        
      } else {
        // Zone unique SANS places → aller directement à validation cartes
        session.currentStep = 'CARD_VALIDATION';
        await this.saveSession(session);

        this.logger.logBusinessEvent('PLAN_SELECTED_SINGLE_ZONE_NO_SEATS', {
          sessionId,
          planId,
          planName: planDetails.name,
          quantity,
          autoSelectedZone: uniqueZone.id,
          zoneName: uniqueZone.name,
          hasSeats: false,
        });

        this.logger.endOperation('selectPlan', operationId, true);

        return {
          success: true,
          sessionId,
          currentStep: 'CARD_VALIDATION',
          nextStep: 'CARD_VALIDATION',
          data: {
            selectedPlan: {
              id: planId,
              name: planDetails.name,
              price: planDetails.price,
              currency: planDetails.currency,
            },
            quantity,
            autoSelectedZone: {
              id: uniqueZone.id,
              name: uniqueZone.name,
              hasSeats: false,
            },
            session: { sessionId, expiresAt: session.expiresAt },
          },
          message: `Plan "${planDetails.name}" sélectionné. Zone "${uniqueZone.name}" auto-sélectionnée. Aucune place à choisir. Scannez vos cartes QR.`,
          allowedActions: ['VALIDATE_CARDS', 'CHANGE_PLAN', 'CANCEL_SESSION'],
        };
      }
    }

    // ============================================================================
    // CAS ZONES MULTIPLES - LOGIQUE EXISTANTE CONSERVÉE
    // ============================================================================
    
    // Mettre à jour la session pour zones multiples
    session.planId = planId;
    session.planDetails = planDetails;
    session.quantity = quantity;
    session.currentStep = 'ZONE_SEAT_SELECTION';
    await this.saveSession(session);

    this.logger.logBusinessEvent('PLAN_SELECTED_MULTIPLE_ZONES', {
      sessionId,
      planId,
      planName: planDetails.name,
      quantity,
      zonesCount: selectionLogic.zones.length,
    });

    this.logger.endOperation('selectPlan', operationId, true);

    return {
      success: true,
      sessionId,
      currentStep: 'ZONE_SEAT_SELECTION',
      nextStep: 'ZONE_SELECTION',
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
      message: `Plan "${planDetails.name}" sélectionné. Choisissez votre zone préférée parmi ${selectionLogic.zones.length} disponibles.`,
      allowedActions: ['SELECT_ZONE', 'CHANGE_PLAN', 'CANCEL_SESSION'],
    };

  } catch (error) {
    this.logger.logErrorEvent(
      error as Error,
      'SalesFlowService.selectPlan',
      undefined,
      JSON.stringify({ sessionId, planId, quantity })
    );
    this.logger.endOperation('selectPlan', operationId, false);
    throw error;
  }
}
  // ============================================================================
  // ÉTAPE 2 : SÉLECTION ZONES ET PLACES
  // ============================================================================

  /**
   * Sélectionne une zone (si plusieurs zones disponibles)
   */
  async selectZone(sessionId: string, zoneId: string): Promise<FlowStepResult> {
    const operationId = this.logger.startOperation('selectZone', { sessionId, zoneId });

    try {
      const session = await this.getSession(sessionId);
      this.validateStep(session, 'ZONE_SEAT_SELECTION');

      if (!session.planId) {
        throw new BadRequestException('Aucun plan sélectionné');
      }

      // Vérifier les places disponibles dans cette zone
      const seatsInfo = await this.zonesAndSeatsService.getAvailableSeatsInZone(zoneId, session.quantity);

      if (!seatsInfo.canAccommodateQuantity) {
        throw new BadRequestException(
          `Cette zone ne peut accueillir ${session.quantity} abonnement(s). ${seatsInfo.message}`
        );
      }

      // Mettre à jour la session
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

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.selectZone',
        undefined,
        JSON.stringify({ sessionId, zoneId })
      );
      this.logger.endOperation('selectZone', operationId, false);
      throw error;
    }
  }

  /**
   * Sélectionne les places spécifiques
   */
  async selectSeats(sessionId: string, seatIds: string[]): Promise<FlowStepResult> {
    const operationId = this.logger.startOperation('selectSeats', { sessionId, seatIds });

    try {
      const session = await this.getSession(sessionId);
      this.validateStep(session, 'ZONE_SEAT_SELECTION');

      if (!session.selectedZoneId) {
        throw new BadRequestException('Aucune zone sélectionnée');
      }

      if (seatIds.length !== session.quantity) {
        throw new BadRequestException(
          `Vous devez sélectionner exactement ${session.quantity} place(s), mais ${seatIds.length} sélectionnée(s)`
        );
      }

      // Réserver temporairement les places
      const reservation = await this.zonesAndSeatsService.reserveSeatsTemporarily(
        session.selectedZoneId,
        seatIds,
        10, // 10 minutes de réservation
        session.metadata?.sellerId
      );

      // Mettre à jour la session
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

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.selectSeats',
        undefined,
        JSON.stringify({ sessionId, seatIds })
      );
      this.logger.endOperation('selectSeats', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // ÉTAPE 3 : VALIDATION CARTES ET FINALISATION
  // ============================================================================

  /**
   * Valide les cartes physiques scannées
   */
  async validatePhysicalCards(sessionId: string, cards: PhysicalCard[]): Promise<FlowStepResult> {
    const operationId = this.logger.startOperation('validatePhysicalCards', { sessionId, cards });

    try {
      const session = await this.getSession(sessionId);
      this.validateStep(session, 'CARD_VALIDATION');

      if (!session.planId) {
        throw new BadRequestException('Session incomplète - aucun plan sélectionné');
      }

      if (cards.length !== session.quantity) {
        throw new BadRequestException(
          `Vous devez scanner exactement ${session.quantity} carte(s), mais ${cards.length} scannée(s)`
        );
      }

      // Extraire les QR codes et numéros de série
      const qrCodes = cards.filter(c => c.qrCode).map(c => c.qrCode!);
      const serialNumbers = cards.filter(c => c.serialNumber).map(c => c.serialNumber!);

      // Valider disponibilité des QR codes pour ce plan
      const qrValidations = qrCodes.length > 0 
        ? await this.subscriptionSalesService.validateQRCodesAvailability(qrCodes, session.planId)
        : [];

      // Valider disponibilité par numéros de série si nécessaire
      const serialValidations = serialNumbers.length > 0
        ? await this.subscriptionSalesService.validateQRCodesAvailability(undefined, session.planId)
        : [];

      // Combiner toutes les validations
      const allValidations = [...qrValidations, ...serialValidations];
      const unavailableCards = allValidations.filter(v => !v.isAvailable);

      if (unavailableCards.length > 0) {
        throw new BadRequestException(
          `Cartes non disponibles: ${unavailableCards.map(v => v.qrCode).join(', ')}`
        );
      }

      // Stocker les codes validés dans la session
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

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.validatePhysicalCards',
        undefined,
        JSON.stringify({ sessionId, cards })
      );
      this.logger.endOperation('validatePhysicalCards', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // FINALISATION VENTE
  // ============================================================================

  /**
   * Finalise la vente avec les informations client
   */
  async completeSale(
    sessionId: string,
    customerInfo: any,
    paymentMethod: PaymentMethod, // Enum PaymentMethod (CASH, CARD, FLOUCI, BANK_TRANSFER)
    saleMode: 'IDENTIFIED' | 'ANONYMOUS' = 'IDENTIFIED'
  ): Promise<FlowStepResult> {
    const operationId = this.logger.startOperation('completeSale', { 
      sessionId, 
      saleMode, 
      paymentMethod 
    });

    try {
      const session = await this.getSession(sessionId);
      this.validateStep(session, 'PAYMENT');

      if (!session.planId || !session.qrCodes) {
        throw new BadRequestException('Session incomplète - plan ou cartes manquants');
      }

      // Convertir le mode de vente en enum
      const saleModeEnum = saleMode === 'IDENTIFIED' ? SaleMode.IDENTIFIED : SaleMode.ANONYMOUS;

      // Préparer les données de vente avec interface correcte
      const saleData: ISubscriptionSaleData = {
        planId: session.planId,
        quantity: session.quantity,
        qrCodes: session.qrCodes,
        saleMode: saleModeEnum,
        saleChannel: SaleChannel.PHYSICAL,
        paymentMethod: paymentMethod, // PaymentMethod enum directement
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

      // Exécuter la vente
      const saleResult = await this.subscriptionSalesService.createSubscriptionSale(saleData);

      // Confirmer la réservation des places si applicable
      if (session.reservationId && session.selectedSeatIds) {
        await this.zonesAndSeatsService.confirmSeatsReservation(
          session.reservationId,
          saleResult.subscriptions[0].id
        );
      }

      // Nettoyer la session
      await this.clearSession(sessionId);

      this.logger.logBusinessEvent('SALE_COMPLETED', {
        sessionId,
        orderId: saleResult.order.id,
        subscriptionIds: saleResult.subscriptions.map(s => s.id),
        amount: saleResult.order.total,
        saleMode,
        paymentMethod: paymentMethod.toString(), // Convertir enum en string pour le log
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
            paymentMethod: paymentMethod.toString(), // Convertir enum en string pour le retour
            soldAt: new Date(),
          },
        },
        message: saleResult.message,
        allowedActions: ['START_NEW_SALE', 'PRINT_RECEIPT'],
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.completeSale',
        undefined,
        JSON.stringify({ sessionId, saleMode, paymentMethod: paymentMethod.toString() })
      );
      this.logger.endOperation('completeSale', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Récupère une session
   */
  private async getSession(sessionId: string): Promise<SalesSession> {
    const cacheKey = `${this.SESSION_PREFIX}${sessionId}`;
    const session = await this.redis.getCache<SalesSession>(cacheKey);
    
    if (!session) {
      throw new NotFoundException('Session non trouvée ou expirée');
    }

    // Vérifier expiration
    if (new Date() > session.expiresAt) {
      await this.clearSession(sessionId);
      throw new BadRequestException('Session expirée');
    }

    return session;
  }

  /**
   * Sauvegarde une session
   */
  private async saveSession(session: SalesSession): Promise<void> {
    const cacheKey = `${this.SESSION_PREFIX}${session.sessionId}`;
    await this.redis.setCache(cacheKey, session, this.SESSION_TTL);
  }

  /**
   * Supprime une session
   */
  private async clearSession(sessionId: string): Promise<void> {
    const cacheKey = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redis.delCache(cacheKey);
  }

  /**
   * Valide l'étape courante
   */
  private validateStep(session: SalesSession, expectedStep: SalesSession['currentStep']): void {
    if (session.currentStep !== expectedStep) {
      throw new BadRequestException(
        `Étape invalide. Étape attendue: ${expectedStep}, étape courante: ${session.currentStep}`
      );
    }
  }

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7).toUpperCase();
    return `SALES_${timestamp}_${random}`;
  }

  /**
   * Retourne les actions autorisées pour une étape
   */
  private getAllowedActionsForStep(currentStep: string): string[] {
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

  /**
   * Annule une session de vente
   */
  async cancelSession(sessionId: string): Promise<void> {
    const operationId = this.logger.startOperation('cancelSession', { sessionId });

    try {
      const session = await this.getSession(sessionId);

      // Libérer les places réservées si applicable
      if (session.reservationId && session.selectedSeatIds) {
        await this.zonesAndSeatsService.releaseTemporaryReservation(session.reservationId);
      }

      // Supprimer la session
      await this.clearSession(sessionId);

      this.logger.logBusinessEvent('SESSION_CANCELLED', {
        sessionId,
        currentStep: session.currentStep,
        hadReservation: !!session.reservationId,
      });

      this.logger.endOperation('cancelSession', operationId, true);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.cancelSession',
        undefined,
        JSON.stringify({ sessionId })
      );
      this.logger.endOperation('cancelSession', operationId, false);
      throw error;
    }
  }

  /**
   * Nettoie les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<{ cleaned: number; message: string }> {
    const operationId = this.logger.startOperation('cleanupExpiredSessions');

    try {
      // Cette méthode nécessiterait l'implémentation d'un scan Redis pour trouver les sessions expirées
      // Pour l'instant, on simule le comportement
      const cleanedCount = 0; // Sera implémenté avec Redis SCAN

      this.logger.logBusinessEvent('EXPIRED_SESSIONS_CLEANED', {
        cleanedCount,
      });

      this.logger.endOperation('cleanupExpiredSessions', operationId, true);

      return {
        cleaned: cleanedCount,
        message: `${cleanedCount} session(s) expirée(s) nettoyée(s)`,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SalesFlowService.cleanupExpiredSessions',
        undefined,
        '{}'
      );
      this.logger.endOperation('cleanupExpiredSessions', operationId, false);
      throw error;
    }
  }
}