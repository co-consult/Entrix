// src/modules/subscription-sales/services/zones-and-seats.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';

// Services partagés
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';

/**
 * Service pour la gestion des zones et places d'abonnement
 * Étape 2 du flow de vente
 */
@Injectable()
export class ZonesAndSeatsService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'zones-seats:';
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ZonesAndSeatsService');
  }

  /**
   * Récupère les zones disponibles pour un plan d'abonnement
   */
  async getZonesForPlan(planId: string) {
    const operationId = this.logger.startOperation('getZonesForPlan', { planId });

    try {
      // Vérifier cache
      const cacheKey = `${this.CACHE_PREFIX}plan:${planId}`;
      const cached = await this.redis.getCache<any>(cacheKey);
      
      if (cached) {
        this.logger.logCacheEvent('hit', cacheKey);
        this.logger.endOperation('getZonesForPlan', operationId, true);
        return cached;
      }

      // Récupérer les zones du plan avec comptage des places
      const planZones = await this.prisma.subscription_plan_zones.findMany({
        where: { 
          subscription_plan_id: planId,
          is_included: true,
        },
        include: {
          venue_zones: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              capacity: true,
              zone_type: true,
              metadata: true,
              _count: {
                select: {
                  seats: {
                    where: {
                      status: 'AVAILABLE'
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          priority_level: 'desc'
        }
      });

      // If no zones are configured, return empty result instead of throwing error
      // This allows for subscription plans that don't require zone selection
      if (planZones.length === 0) {
        const result = {
          planId,
          zonesCount: 0,
          zones: [],
          message: 'Ce plan d\'abonnement ne nécessite pas de sélection de zone'
        };

        // Mettre en cache
        await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
        this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);

        this.logger.endOperation('getZonesForPlan', operationId, true);
        return result;
      }

      const result = {
        planId,
        zonesCount: planZones.length,
        zones: planZones.map(pz => ({
          id: pz.venue_zones.id,
          name: pz.venue_zones.name,
          code: pz.venue_zones.code,
          description: pz.venue_zones.description,
          capacity: pz.venue_zones.capacity,
          hasSeats: pz.venue_zones._count.seats > 0, // Déterminé par le comptage des places
          availableSeatsCount: pz.venue_zones._count.seats,
          zoneType: pz.venue_zones.zone_type,
          isIncluded: pz.is_included,
          priceOverride: pz.price_override ? Number(pz.price_override) : null,
          priorityLevel: pz.priority_level,
          metadata: pz.venue_zones.metadata,
        }))
      };

      // Mettre en cache
      await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
      this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);

      this.logger.endOperation('getZonesForPlan', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ZonesAndSeatsService.getZonesForPlan',
        undefined,
        JSON.stringify({ planId })
      );
      this.logger.endOperation('getZonesForPlan', operationId, false);
      throw error;
    }
  }

  /**
   * Récupère les places disponibles d'une zone
   */
  async getAvailableSeatsInZone(zoneId: string, quantity: number = 1) {
    const operationId = this.logger.startOperation('getAvailableSeatsInZone', { zoneId, quantity });

    try {
      // Vérifier si la zone existe et récupérer ses infos
      const zone = await this.prisma.venue_zones.findUnique({
        where: { id: zoneId },
        select: {
          id: true,
          name: true,
          capacity: true,
          _count: {
            select: {
              seats: {
                where: {
                  status: 'AVAILABLE'
                }
              }
            }
          }
        }
      });

      if (!zone) {
        throw new NotFoundException('Zone non trouvée');
      }

      const hasSeats = zone._count.seats > 0;

      if (!hasSeats) {
        // Zone sans places individuelles - retour simple
        return {
          zoneId,
          zoneName: zone.name,
          hasSeats: false,
          capacity: zone.capacity,
          availableSeats: [],
          canAccommodateQuantity: quantity <= (zone.capacity || 999999),
          message: 'Cette zone ne nécessite pas de sélection de places individuelles',
        };
      }

      // Récupérer les places disponibles
      const availableSeats = await this.prisma.seats.findMany({
        where: {
          zone_id: zoneId,
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          seat_number: true,
          row_number: true,
          seat_type: true,
          price_modifier: true,
          metadata: true,
        },
        orderBy: [
          { row_number: 'asc' },
          { seat_number: 'asc' }
        ]
      });

      const canAccommodateQuantity = availableSeats.length >= quantity;

      const result = {
        zoneId,
        zoneName: zone.name,
        hasSeats: true,
        capacity: zone.capacity,
        availableSeatsCount: availableSeats.length,
        availableSeats: availableSeats.map(seat => ({
          id: seat.id,
          seatNumber: seat.seat_number,
          rowNumber: seat.row_number,
          seatType: seat.seat_type,
          displayName: seat.row_number 
            ? `Rangée ${seat.row_number} Place ${seat.seat_number}`
            : `Place ${seat.seat_number}`,
          priceModifier: seat.price_modifier ? Number(seat.price_modifier) : null,
          metadata: seat.metadata,
        })),
        canAccommodateQuantity,
        requestedQuantity: quantity,
        message: canAccommodateQuantity 
          ? `${availableSeats.length} place(s) disponible(s) dans cette zone`
          : `Seulement ${availableSeats.length} place(s) disponible(s) sur ${quantity} demandée(s)`,
      };

      this.logger.endOperation('getAvailableSeatsInZone', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ZonesAndSeatsService.getAvailableSeatsInZone',
        undefined,
        JSON.stringify({ zoneId, quantity })
      );
      this.logger.endOperation('getAvailableSeatsInZone', operationId, false);
      throw error;
    }
  }

  /**
   * Réserve temporairement des places
   */
  async reserveSeatsTemporarily(
    zoneId: string, 
    seatIds: string[], 
    durationMinutes: number = 10,
    userId?: string
  ) {
    const operationId = this.logger.startOperation('reserveSeatsTemporarily', { 
      zoneId, 
      seatIds, 
      durationMinutes 
    });

    try {
      const reservationId = `TEMP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      // Vérifier que toutes les places sont disponibles
      const availableSeats = await this.prisma.seats.findMany({
        where: {
          id: { in: seatIds },
          zone_id: zoneId,
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          seat_number: true,
          row_number: true,
          seat_type: true,
        }
      });

      if (availableSeats.length !== seatIds.length) {
        const unavailableSeats = seatIds.filter(
          id => !availableSeats.some(seat => seat.id === id)
        );
        throw new BadRequestException(
          `Places non disponibles: ${unavailableSeats.join(', ')}`
        );
      }

      // Marquer les places comme réservées temporairement
      const reservedSeats = await this.prisma.seats.updateMany({
        where: {
          id: { in: seatIds },
          status: 'AVAILABLE',
        },
        data: {
          status: 'RESERVED_TEMPORARY',
          metadata: {
            reservationId,
            expiresAt: expiresAt.toISOString(),
            reservedBy: userId,
            reservationType: 'TEMPORARY',
          } as any,
        }
      });

      if (reservedSeats.count !== seatIds.length) {
        throw new BadRequestException('Impossible de réserver toutes les places demandées');
      }

      // Programmer la libération automatique
      await this.scheduleSeatsRelease(seatIds, expiresAt);

      this.logger.logBusinessEvent('SEATS_RESERVED_TEMPORARILY', {
        reservationId,
        zoneId,
        seatIds,
        userId,
        expiresAt: expiresAt.toISOString(),
        durationMinutes,
      });

      this.logger.endOperation('reserveSeatsTemporarily', operationId, true);

      return {
        reservationId,
        reservedSeats: availableSeats.map(seat => ({
          id: seat.id,
          seatNumber: seat.seat_number,
          rowNumber: seat.row_number,
          seatType: seat.seat_type,
        })),
        expiresAt,
        expiresInMinutes: durationMinutes,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'ZonesAndSeatsService.reserveSeatsTemporarily',
        undefined,
        JSON.stringify({ zoneId, seatIds, durationMinutes })
      );
      this.logger.endOperation('reserveSeatsTemporarily', operationId, false);
      throw error;
    }
  }

  /**
   * Confirme la réservation des places (lors de la vente)
   */
  async confirmSeatsReservation(reservationId: string, subscriptionId: string) {
    try {
      // Mettre à jour les places réservées vers vendues
      const reservedSeats = await this.prisma.seats.updateMany({
        where: {
          status: 'RESERVED_TEMPORARY',
          metadata: {
            path: ['reservationId'],
            equals: reservationId,
          }
        },
        data: {
          status: 'SOLD',
          metadata: {
            subscriptionId,
            soldAt: new Date().toISOString(),
            confirmedFrom: reservationId,
          } as any,
        }
      });

      this.logger.logBusinessEvent('SEATS_RESERVATION_CONFIRMED', JSON.stringify({
        reservationId,
        subscriptionId,
        seatIds: reservedSeats.count,
      }));

      return {
        success: true,
        confirmedSeats: reservedSeats.count,
        subscriptionId,
      };

    } catch (error) {
      this.logger.error('Error confirming seats reservation', JSON.stringify({
        error: error.message,
        reservationId,
        subscriptionId,
      }));
      throw error;
    }
  }

  /**
   * Libère les places réservées temporairement
   */
  async releaseTemporaryReservation(reservationId: string) {
    try {
      const releasedSeats = await this.prisma.seats.updateMany({
        where: {
          status: 'RESERVED_TEMPORARY',
          metadata: {
            path: ['reservationId'],
            equals: reservationId,
          }
        },
        data: {
          status: 'AVAILABLE',
          metadata: {} as any,
        }
      });

      this.logger.info('Temporary reservation released', JSON.stringify({
        reservationId,
        releasedSeats: releasedSeats.count,
      }));

      return { success: true, releasedSeats: releasedSeats.count };

    } catch (error) {
      this.logger.error('Error releasing temporary reservation', JSON.stringify({
        error: error.message,
        reservationId,
      }));
      throw error;
    }
  }

  /**
   * Détermine la logique de sélection selon les zones d'un plan
   */
  async getSelectionLogicForPlan(planId: string) {
    try {
      const zones = await this.getZonesForPlan(planId);

      if (zones.zonesCount === 0) {
        // No zones configured - this is a general admission plan
        return {
          selectionType: 'NO_ZONES',
          zonesCount: 0,
          message: 'Ce plan d\'abonnement ne nécessite pas de sélection de zone ou de place',
          zones: [],
        };
      }

      if (zones.zonesCount === 1) {
        const singleZone = zones.zones[0];
        return {
          selectionType: 'SINGLE_ZONE',
          zoneId: singleZone.id,
          zoneName: singleZone.name,
          hasSeats: singleZone.hasSeats,
          message: singleZone.hasSeats 
            ? 'Sélection des places requise dans la zone unique'
            : 'Aucune sélection de place nécessaire',
          zones: zones.zones,
        };
      }

      return {
        selectionType: 'MULTIPLE_ZONES',
        zonesCount: zones.zonesCount,
        message: 'Le client doit d\'abord choisir une zone',
        zones: zones.zones,
      };

    } catch (error) {
      this.logger.error('Error getting selection logic for plan', JSON.stringify({
        error: error.message,
        planId,
      }));
      throw error;
    }
  }

  /**
   * Programme la libération automatique des places
   */
  private async scheduleSeatsRelease(seatIds: string[], expiresAt: Date) {
    // Ici vous pouvez utiliser BullMQ pour programmer une tâche
    // qui libérera automatiquement les places à l'expiration
    try {
      // Exemple avec BullMQ (à adapter selon votre implémentation)
      // await this.bullmq.addJob('seats', 'release-expired-reservations', {
      //   seatIds,
      //   reservationExpiry: expiresAt.toISOString(),
      // }, {
      //   delay: expiresAt.getTime() - Date.now(),
      // });

      this.logger.info('Seats release scheduled', JSON.stringify({
        seatIds,
        expiresAt: expiresAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Error scheduling seats release', JSON.stringify({
        error: error.message,
        seatIds,
        expiresAt: expiresAt.toISOString(),
      }));
    }
  }
}