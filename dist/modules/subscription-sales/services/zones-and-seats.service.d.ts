import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
export declare class ZonesAndSeatsService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService, loggerService: LoggerService);
    getZonesForPlan(planId: string): Promise<any>;
    getAvailableSeatsInZone(zoneId: string, quantity?: number): Promise<{
        zoneId: string;
        zoneName: string;
        hasSeats: boolean;
        capacity: number;
        availableSeatsCount: number;
        availableSeats: {
            id: string;
            seatNumber: string;
            rowNumber: string;
            seatType: import(".prisma/client").$Enums.seat_type;
            displayName: string;
            priceModifier: number;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
        canAccommodateQuantity: boolean;
        requestedQuantity: number;
        message: string;
    } | {
        zoneId: string;
        zoneName: string;
        hasSeats: boolean;
        capacity: number;
        availableSeats: any[];
        canAccommodateQuantity: boolean;
        message: string;
    }>;
    reserveSeatsTemporarily(zoneId: string, seatIds: string[], durationMinutes?: number, userId?: string): Promise<{
        reservationId: string;
        reservedSeats: {
            id: string;
            seatNumber: string;
            rowNumber: string;
            seatType: import(".prisma/client").$Enums.seat_type;
        }[];
        expiresAt: Date;
        expiresInMinutes: number;
    }>;
    confirmSeatsReservation(reservationId: string, subscriptionId: string): Promise<{
        success: boolean;
        confirmedSeats: number;
        subscriptionId: string;
    }>;
    releaseTemporaryReservation(reservationId: string): Promise<{
        success: boolean;
        releasedSeats: number;
    }>;
    getSelectionLogicForPlan(planId: string): Promise<{
        selectionType: string;
        zoneId: any;
        zoneName: any;
        hasSeats: any;
        message: string;
        zones: any;
        zonesCount?: undefined;
    } | {
        selectionType: string;
        zonesCount: any;
        message: string;
        zones: any;
        zoneId?: undefined;
        zoneName?: undefined;
        hasSeats?: undefined;
    }>;
    private scheduleSeatsRelease;
}
