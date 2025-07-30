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
exports.ZonesAndSeatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
let ZonesAndSeatsService = class ZonesAndSeatsService {
    prisma;
    redis;
    logger;
    CACHE_PREFIX = 'zones-seats:';
    CACHE_TTL = 900;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('ZonesAndSeatsService');
    }
    async getZonesForPlan(planId) {
        const operationId = this.logger.startOperation('getZonesForPlan', { planId });
        try {
            const cacheKey = `${this.CACHE_PREFIX}plan:${planId}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('getZonesForPlan', operationId, true);
                return cached;
            }
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
            if (planZones.length === 0) {
                throw new common_1.NotFoundException('Aucune zone trouvée pour ce plan d\'abonnement');
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
                    hasSeats: pz.venue_zones._count.seats > 0,
                    availableSeatsCount: pz.venue_zones._count.seats,
                    zoneType: pz.venue_zones.zone_type,
                    isIncluded: pz.is_included,
                    priceOverride: pz.price_override ? Number(pz.price_override) : null,
                    priorityLevel: pz.priority_level,
                    metadata: pz.venue_zones.metadata,
                }))
            };
            await this.redis.setCache(cacheKey, result, this.CACHE_TTL);
            this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL);
            this.logger.endOperation('getZonesForPlan', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ZonesAndSeatsService.getZonesForPlan', undefined, JSON.stringify({ planId }));
            this.logger.endOperation('getZonesForPlan', operationId, false);
            throw error;
        }
    }
    async getAvailableSeatsInZone(zoneId, quantity = 1) {
        const operationId = this.logger.startOperation('getAvailableSeatsInZone', { zoneId, quantity });
        try {
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
                throw new common_1.NotFoundException('Zone non trouvée');
            }
            const hasSeats = zone._count.seats > 0;
            if (!hasSeats) {
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ZonesAndSeatsService.getAvailableSeatsInZone', undefined, JSON.stringify({ zoneId, quantity }));
            this.logger.endOperation('getAvailableSeatsInZone', operationId, false);
            throw error;
        }
    }
    async reserveSeatsTemporarily(zoneId, seatIds, durationMinutes = 10, userId) {
        const operationId = this.logger.startOperation('reserveSeatsTemporarily', {
            zoneId,
            seatIds,
            durationMinutes
        });
        try {
            const reservationId = `TEMP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
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
                const unavailableSeats = seatIds.filter(id => !availableSeats.some(seat => seat.id === id));
                throw new common_1.BadRequestException(`Places non disponibles: ${unavailableSeats.join(', ')}`);
            }
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
                    },
                }
            });
            if (reservedSeats.count !== seatIds.length) {
                throw new common_1.BadRequestException('Impossible de réserver toutes les places demandées');
            }
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
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'ZonesAndSeatsService.reserveSeatsTemporarily', undefined, JSON.stringify({ zoneId, seatIds, durationMinutes }));
            this.logger.endOperation('reserveSeatsTemporarily', operationId, false);
            throw error;
        }
    }
    async confirmSeatsReservation(reservationId, subscriptionId) {
        try {
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
                    },
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
        }
        catch (error) {
            this.logger.error('Error confirming seats reservation', JSON.stringify({
                error: error.message,
                reservationId,
                subscriptionId,
            }));
            throw error;
        }
    }
    async releaseTemporaryReservation(reservationId) {
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
                    metadata: {},
                }
            });
            this.logger.info('Temporary reservation released', JSON.stringify({
                reservationId,
                releasedSeats: releasedSeats.count,
            }));
            return { success: true, releasedSeats: releasedSeats.count };
        }
        catch (error) {
            this.logger.error('Error releasing temporary reservation', JSON.stringify({
                error: error.message,
                reservationId,
            }));
            throw error;
        }
    }
    async getSelectionLogicForPlan(planId) {
        try {
            const zones = await this.getZonesForPlan(planId);
            if (zones.zonesCount === 0) {
                throw new common_1.NotFoundException('Aucune zone configurée pour ce plan');
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
        }
        catch (error) {
            this.logger.error('Error getting selection logic for plan', JSON.stringify({
                error: error.message,
                planId,
            }));
            throw error;
        }
    }
    async scheduleSeatsRelease(seatIds, expiresAt) {
        try {
            this.logger.info('Seats release scheduled', JSON.stringify({
                seatIds,
                expiresAt: expiresAt.toISOString(),
            }));
        }
        catch (error) {
            this.logger.error('Error scheduling seats release', JSON.stringify({
                error: error.message,
                seatIds,
                expiresAt: expiresAt.toISOString(),
            }));
        }
    }
};
exports.ZonesAndSeatsService = ZonesAndSeatsService;
exports.ZonesAndSeatsService = ZonesAndSeatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], ZonesAndSeatsService);
//# sourceMappingURL=zones-and-seats.service.js.map