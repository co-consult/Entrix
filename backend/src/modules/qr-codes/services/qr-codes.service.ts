// src/modules/qr-codes/services/qr-codes.service.ts

import { randomBytes } from 'crypto';
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  QRCode,
  CreateQRCodeData,
  UpdateQRCodeData,
  QRCodeFilters,
  QRCodeSearchParams,
  QRCodeStats,
  QRCodeType,
  QRCodeStatus,
  QRCodeAssignment,
  QRCodeUsage,
} from '../interfaces/qr-code.interface';

@Injectable()
export class QRCodesService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('QRCodesService');
  }

  /**
   * Créer un nouveau QR code
   */
  async create(data: CreateQRCodeData): Promise<QRCode> {
    const operationId = this.logger.startOperation('createQRCode', { code: data.code });

    try {
      // Vérifier si le code existe déjà
      const existingQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: data.code },
      });

      if (existingQR) {
        throw new ConflictException('Un QR code avec ce code existe déjà');
      }

      const onboardingKey = await this.generateUniqueOnboardingKey();

      const qrCode = await this.prisma.physical_qr_codes.create({
        data: {
          qr_code: data.code,
          onboarding_key: onboardingKey,
          serial_number: this.generateSerialNumber(),
          card_type: data.type,
          status: 'AVAILABLE',
          metadata: {
            ...data.metadata,
            seat_number: data.seatNumber,
            venue_id: data.venueId,
            event_id: data.eventId,
          },
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(qrCode);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Trouver un QR code par ID
   */
  async findById(id: string): Promise<QRCode | null> {
    const operationId = this.logger.startOperation('findQRCodeById', { id });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { id },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return qrCode ? this.mapToQRCode(qrCode) : null;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Trouver un QR code par code
   */
  async findByCode(code: string): Promise<QRCode | null> {
    const operationId = this.logger.startOperation('findQRCodeByCode', { code });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: code },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return qrCode ? this.mapToQRCode(qrCode) : null;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Rechercher des QR codes avec filtres et pagination
   */
  async search(params: QRCodeSearchParams): Promise<{ data: QRCode[]; pagination: any }> {
    const operationId = this.logger.startOperation('searchQRCodes', params);

    try {
      const { query, filters, pagination, sorting } = params;
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Construire les conditions de recherche
      const where = this.buildWhereConditions(query, filters);

      // Construire le tri
      const orderBy = this.buildOrderBy(sorting);

      // Récupérer les QR codes avec les informations des abonnements
      const [qrCodes, total] = await Promise.all([
        this.prisma.physical_qr_codes.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            subscription_plans: true,
            users: true,
          },
        }),
        this.prisma.physical_qr_codes.count({ where }),
      ]);

      // Enrichir les QR codes avec les informations des abonnements
      const enrichedQRCodes = await Promise.all(
        qrCodes.map(async (qrCode) => {
          // Chercher l'abonnement correspondant via le metadata
          const subscription = await this.prisma.subscriptions.findFirst({
            where: {
              metadata: {
                path: ['qrCode'],
                equals: qrCode.qr_code,
              },
            },
            include: {
              users: true,
              subscription_plans: true,
            },
          });

          return {
            ...qrCode,
            subscription,
          };
        })
      );

      const totalPages = Math.ceil(total / limit);

      this.logger.endOperation(operationId, 'success', true);
      return {
        data: enrichedQRCodes.map(qr => this.mapToQRCode(qr)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Exporter tous les QR codes sans pagination
   */
  async exportAll(filters?: QRCodeFilters): Promise<QRCode[]> {
    const operationId = this.logger.startOperation('exportAllQRCodes', filters);

    try {
      // Construire les conditions de recherche
      const where = this.buildWhereConditions(undefined, filters);

      // Récupérer tous les QR codes sans pagination avec des includes simplifiés
      const qrCodes = await this.prisma.physical_qr_codes.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      // Enrichir les QR codes avec les informations des abonnements
      const enrichedQRCodes = await Promise.all(
        qrCodes.map(async (qrCode) => {
          // Chercher l'abonnement correspondant via le metadata
          const subscription = await this.prisma.subscriptions.findFirst({
            where: {
              metadata: {
                path: ['qrCode'],
                equals: qrCode.qr_code,
              },
            },
            include: {
              users: true,
              subscription_plans: true,
            },
          });

          return {
            ...qrCode,
            subscription,
          };
        })
      );

      this.logger.endOperation(operationId, 'success', true);
      return enrichedQRCodes.map(qr => this.mapToQRCode(qr));
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour un QR code
   */
  async update(id: string, data: UpdateQRCodeData): Promise<QRCode> {
    const operationId = this.logger.startOperation('updateQRCode', { id, data });

    try {
      const existingQR = await this.prisma.physical_qr_codes.findUnique({
        where: { id },
      });

      if (!existingQR) {
        throw new NotFoundException('QR code non trouvé');
      }

      // Vérifier si le nouveau code existe déjà (si modifié)
      if (data.code && data.code !== existingQR.qr_code) {
        const existingCode = await this.prisma.physical_qr_codes.findUnique({
          where: { qr_code: data.code },
        });

        if (existingCode) {
          throw new ConflictException('Un QR code avec ce code existe déjà');
        }

        // Check if last 6 characters are unique
        if (data.code.length >= 6) {
          const last6Chars = data.code.slice(-6);
          const existingWithSuffix = await this.prisma.physical_qr_codes.findFirst({
            where: {
              qr_code: {
                endsWith: last6Chars,
              },
              id: {
                not: id, // Exclude current QR code
              },
            },
            select: { id: true },
          });

          if (existingWithSuffix) {
            throw new ConflictException('Les 6 derniers caractères du QR code doivent être uniques');
          }
        }
      }

      // Get zone_id from zone_name if provided
      let zoneId: string | null = null;
      if (data.metadata?.zone_name || data.metadata?.zone) {
        const zoneName = data.metadata.zone_name || data.metadata.zone;
        const zone = await this.prisma.venue_zones.findFirst({
          where: {
            OR: [
              { name: zoneName },
              { code: zoneName },
            ],
          },
          select: { id: true },
        });
        if (zone) {
          zoneId = zone.id;
        }
      }

      // Handle seat creation/validation if seat_number is provided
      if (data.seatNumber && zoneId) {
        // Parse seat_number (e.g., "A12" -> row: "A", seat: "12")
        const seatMatch = data.seatNumber.match(/^([A-Z])(\d+)$/i);
        if (seatMatch) {
          const rowNumber = seatMatch[1].toUpperCase();
          const seatNumber = seatMatch[2];

          // Check if seat already exists
          const existingSeat = await this.prisma.seats.findFirst({
            where: {
              zone_id: zoneId,
              seat_number: seatNumber,
              row_number: rowNumber,
            },
            select: { id: true },
          });

          // Create seat if it doesn't exist
          if (!existingSeat) {
            await this.prisma.seats.create({
              data: {
                zone_id: zoneId,
                seat_number: seatNumber,
                row_number: rowNumber,
                seat_type: 'STANDARD',
                status: 'AVAILABLE',
                price_modifier: 1.0,
                features: [],
                is_accessible: false,
              },
            });
            this.logger.debug(`Created new seat: ${rowNumber}${seatNumber} in zone ${zoneId}`);
          }
          
          // Check if seat is already assigned to another QR code
          // Check by seat_number in metadata
          const qrWithSeat = await this.prisma.physical_qr_codes.findFirst({
            where: {
              id: { not: id },
              OR: [
                {
                  metadata: {
                    path: ['seat_number'],
                    equals: data.seatNumber,
                  },
                },
                {
                  metadata: {
                    path: ['seat'],
                    equals: data.seatNumber,
                  },
                },
              ],
            },
            select: { id: true, qr_code: true },
          });

          if (qrWithSeat) {
            throw new ConflictException(`Le siège ${data.seatNumber} est déjà assigné à un autre QR code (${qrWithSeat.qr_code})`);
          }
        }
      }

      // Prepare metadata update
      const currentMetadata = existingQR.metadata as Record<string, any> || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...data.metadata,
        ...(data.seatNumber !== undefined && { seat_number: data.seatNumber, seat: data.seatNumber }),
        ...(data.venueId !== undefined && { venue_id: data.venueId }),
        ...(data.eventId !== undefined && { event_id: data.eventId }),
        ...(zoneId && { zone_id: zoneId }),
      };

      const updatedQR = await this.prisma.physical_qr_codes.update({
        where: { id },
        data: {
          qr_code: data.code,
          card_type: data.type,
          status: data.status as any,
          subscription_plan_id: data.subscriptionId,
          assigned_by: data.assignedTo,
          assigned_at: data.assignedAt,
          metadata: updatedMetadata,
        },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(updatedQR);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Supprimer un QR code
   */
  async delete(id: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteQRCode', { id });

    try {
      const existingQR = await this.prisma.physical_qr_codes.findUnique({
        where: { id },
      });

      if (!existingQR) {
        throw new NotFoundException('QR code non trouvé');
      }

      // Check if QR code is actually assigned (status is ASSIGNED or has access_rights)
      // Note: subscription_plan_id alone doesn't mean assigned - it's set when QR code is created for a plan
      const isAssigned = existingQR.status === 'ASSIGNED';
      
      // Also check if QR code has access rights (actually assigned to a subscription)
      const hasAccessRights = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM access_rights WHERE qr_code = ${existingQR.qr_code}
      `;
      
      if (isAssigned || (hasAccessRights.length > 0 && Number(hasAccessRights[0].count) > 0)) {
        throw new BadRequestException('Impossible de supprimer un QR code assigné. Veuillez d\'abord le réinitialiser.');
      }

      await this.prisma.physical_qr_codes.delete({
        where: { id },
      });

      this.logger.endOperation(operationId, 'success', true);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Assigner un QR code à un abonnement
   */
  async assignToSubscription(qrCodeId: string, subscriptionId: string, assignedTo?: string): Promise<QRCode> {
    const operationId = this.logger.startOperation('assignQRCodeToSubscription', { qrCodeId, subscriptionId });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { id: qrCodeId },
      });

      if (!qrCode) {
        throw new NotFoundException('QR code non trouvé');
      }

      if (qrCode.status !== 'AVAILABLE') {
        throw new BadRequestException('Le QR code n\'est pas disponible pour assignation');
      }

      const subscription = await this.prisma.subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new NotFoundException('Abonnement non trouvé');
      }

      // Use transaction to ensure QR code and seat are updated atomically
      const updatedQR = await this.prisma.$transaction(async (tx) => {
        // Update QR code status
        const updated = await tx.physical_qr_codes.update({
        where: { id: qrCodeId },
        data: {
          status: 'ASSIGNED',
          subscription_plan_id: subscriptionId,
          assigned_by: assignedTo || subscription.user_id,
          assigned_at: new Date(),
        },
        include: {
          subscription_plans: true,
          users: true,
        },
        });

        // Sync seat status to SOLD when QR code is assigned
        await this.syncSeatStatusWithQRCode(updated, 'SOLD', tx);

        return updated;
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(updatedQR);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Libérer un QR code (comprehensive reset - clean up all subscription creation side effects)
   * Based on production SQL script with seat-based QR code handling
   */
  async releaseQRCode(qrCodeId: string, reason?: string): Promise<QRCode> {
    const operationId = this.logger.startOperation('releaseQRCode', { qrCodeId });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { id: qrCodeId },
        include: {
          subscription_plans: true,
        }
      });

      if (!qrCode) {
        throw new NotFoundException('QR code non trouvé');
      }

      // Use transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        const resetData: any = {
          resetAt: new Date().toISOString(),
          reason: reason || 'Manual reset by admin',
          previousStatus: qrCode.status,
          previousSubscriptionPlanId: qrCode.subscription_plan_id,
          previousSubscriptionPlanName: qrCode.subscription_plans?.name,
          resetBy: 'admin', // TODO: Get from auth context
          deletedData: {
            accessRights: 0,
            subscriptions: 0,
            orderItems: 0,
            orders: 0,
            seats: 0
          }
        };

        try {
          // 1. Find seat and event information from access rights before deletion (for seat-based QR codes)
          const seatInfo = await tx.$queryRaw<Array<{seat_id: string, event_id: string}>>`
            SELECT seat_id, event_id
            FROM access_rights 
            WHERE qr_code = ${qrCode.qr_code}
            LIMIT 1
          `;

          const affectedSeatId = seatInfo[0]?.seat_id;
          const affectedEventId = seatInfo[0]?.event_id;

          if (affectedSeatId) {
            resetData.wasSeatBased = true;
            resetData.affectedSeatId = affectedSeatId;
            resetData.affectedEventId = affectedEventId;
          }

          // 2. Count and delete access rights for this QR code
          const accessRightsCount = await tx.$queryRaw<Array<{count: bigint}>>`
            SELECT COUNT(*) as count FROM access_rights WHERE qr_code = ${qrCode.qr_code}
          `;
          resetData.deletedData.accessRights = Number(accessRightsCount[0]?.count || 0);

          // Delete access rights (disable audit trigger temporarily to avoid updated_by field error)
          await tx.$executeRaw`ALTER TABLE access_rights DISABLE TRIGGER ALL`;
          await tx.$executeRaw`DELETE FROM access_rights WHERE qr_code = ${qrCode.qr_code}`;
          await tx.$executeRaw`ALTER TABLE access_rights ENABLE TRIGGER ALL`;

          // 3. Reset seat status if this was a seat-based QR code
          if (affectedSeatId) {
            await tx.$executeRaw`
              UPDATE seats 
              SET 
                status = 'AVAILABLE',
                metadata = jsonb_set(
                  COALESCE(metadata, '{}'::jsonb),
                  '{reset_history}',
                  COALESCE(metadata->'reset_history', '[]'::jsonb) || 
                  jsonb_build_object(
                    'reset_at', NOW(),
                    'previous_status', (SELECT status FROM seats WHERE id = ${affectedSeatId}::text),
                    'reset_reason', 'QR code reset - seat freed',
                    'qr_code', ${qrCode.qr_code}
                  )
                ),
                updated_at = NOW()
              WHERE id = ${affectedSeatId}::text
            `;

            // Count seats affected
            const seatsCount = await tx.$queryRaw<Array<{count: bigint}>>`
              SELECT COUNT(*) as count FROM seats WHERE id = ${affectedSeatId}::text
            `;
            resetData.deletedData.seats = Number(seatsCount[0]?.count || 0);
          }

          // 4. Find subscriptions that reference this QR code in metadata
          const subscriptions = await tx.$queryRaw<Array<{
            id: string;
            subscription_number: string;
            status: string;
            start_date: Date;
            end_date: Date;
            price_paid: number;
            currency: string;
            metadata: any;
            plan_name: string;
            plan_id: string;
          }>>`
            SELECT 
              s.id, s.subscription_number, s.status, s.start_date, s.end_date, 
              s.price_paid, s.currency, s.metadata, sp.name as plan_name, sp.id as plan_id
            FROM subscriptions s
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.metadata->>'qrCode' = ${qrCode.qr_code}
          `;

          resetData.deletedData.subscriptions = subscriptions.length;

          // 5. Process each subscription and related data
          for (const subscription of subscriptions) {
            // Store subscription data in metadata before deletion
            const subscriptionData = {
              id: subscription.id,
              subscription_number: subscription.subscription_number,
              status: subscription.status,
              start_date: subscription.start_date,
              end_date: subscription.end_date,
              price_paid: subscription.price_paid,
              currency: subscription.currency,
              plan_name: subscription.plan_name,
              plan_id: subscription.plan_id,
            };

            // 6. Find the order associated with this subscription
            const orderId = subscription.metadata?.orderId;
            if (orderId) {
              // 7. Check if this order has other subscriptions before deleting order items
              const otherSubscriptionsInOrder = await tx.$queryRaw<Array<{id: string}>>`
                SELECT id FROM subscriptions 
                WHERE metadata->>'orderId' = ${orderId} AND id != ${subscription.id}::uuid
              `;

              // 8. Delete order items for this subscription (disable triggers temporarily)
              await tx.$executeRaw`ALTER TABLE order_items DISABLE TRIGGER ALL`;
              
              let deletedOrderItems = 0;
              if (subscription.plan_name) {
                await tx.$executeRaw`
                  DELETE FROM order_items 
                  WHERE order_id = ${orderId}::uuid 
                  AND item_type = 'SUBSCRIPTION'::order_item_type 
                  AND item_name = ${subscription.plan_name}
                `;
                deletedOrderItems = 1;
              } else {
                // Fallback: delete by subscription ID if plan name is not available
                await tx.$executeRaw`
                  DELETE FROM order_items 
                  WHERE order_id = ${orderId}::uuid 
                  AND item_type = 'SUBSCRIPTION'::order_item_type
                  AND item_metadata->>'subscription_id' = ${subscription.id}
                `;
                deletedOrderItems = 1;
              }

              await tx.$executeRaw`ALTER TABLE order_items ENABLE TRIGGER ALL`;
              resetData.deletedData.orderItems += deletedOrderItems;

              // 9. If no other subscriptions in this order, delete the order
              if (otherSubscriptionsInOrder.length === 0) {
                await tx.$executeRaw`DELETE FROM orders WHERE id = ${orderId}::uuid`;
                resetData.deletedData.orders += 1;
              }
            }

            // 10. Delete the subscription (disable triggers temporarily)
            await tx.$executeRaw`ALTER TABLE subscriptions DISABLE TRIGGER ALL`;
            await tx.$executeRaw`DELETE FROM subscriptions WHERE id = ${subscription.id}::uuid`;
            await tx.$executeRaw`ALTER TABLE subscriptions ENABLE TRIGGER ALL`;

            // Store subscription data in reset metadata for audit trail
            if (!resetData.deletedSubscriptions) {
              resetData.deletedSubscriptions = [];
            }
            resetData.deletedSubscriptions.push(subscriptionData);
          }

          // 11. Update the physical QR code with comprehensive reset data
          const updatedQR = await tx.physical_qr_codes.update({
            where: { id: qrCodeId },
            data: {
              status: 'AVAILABLE',
              assigned_by: null,
              assigned_at: null,
              first_used_at: null,
              // Add comprehensive reset information to metadata
              metadata: {
                ...(qrCode.metadata as any || {}),
                reseted: true,
                reset_history: [
                  ...((qrCode.metadata as any)?.reset_history || []),
                  resetData
                ],
                // Keep previous data for reference
                previous_assignment: {
                  subscription_plan_id: qrCode.subscription_plan_id,
                  subscription_plan_name: qrCode.subscription_plans?.name,
                  assigned_by: qrCode.assigned_by,
                  assigned_at: qrCode.assigned_at,
                  first_used_at: qrCode.first_used_at,
                  status: qrCode.status,
                }
              }
            },
            include: {
              subscription_plans: true,
              users: true,
            },
          });

          return updatedQR;
        } catch (error) {
          // Log the specific error for debugging
          this.logger.error(`Transaction error in releaseQRCode: ${error.message}`, error.stack);
          throw error;
        }
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(result);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Réserver un QR code pour une utilisation future
   */
  async reserveQRCode(qrCodeId: string, data: { note: string; reservedFor: string; reservedUntil: string }): Promise<QRCode> {
    const operationId = this.logger.startOperation('reserveQRCode', { qrCodeId, data });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { id: qrCodeId },
      });

      if (!qrCode) {
        throw new NotFoundException('QR code non trouvé');
      }

      if (qrCode.status !== 'AVAILABLE') {
        throw new BadRequestException('Le QR code doit être disponible pour être réservé');
      }

      const reservedUntil = new Date(data.reservedUntil);
      if (reservedUntil <= new Date()) {
        throw new BadRequestException('La date de fin de réservation doit être dans le futur');
      }

      const updatedQR = await this.prisma.physical_qr_codes.update({
        where: { id: qrCodeId },
        data: {
          status: 'RESERVED',
          metadata: {
            ...(qrCode.metadata as any || {}),
            reservation: {
              reservedFor: data.reservedFor,
              reservedUntil: data.reservedUntil,
              note: data.note,
              reservedAt: new Date().toISOString(),
            },
            reservation_history: [
              ...((qrCode.metadata as any)?.reservation_history || []),
              {
                reservedAt: new Date().toISOString(),
                reservedFor: data.reservedFor,
                reservedUntil: data.reservedUntil,
                note: data.note,
              }
            ]
          }
        },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(updatedQR);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Marquer un QR code comme utilisé
   */
  async markAsUsed(qrCodeId: string, usedBy: string, location?: string, deviceInfo?: string): Promise<QRCode> {
    const operationId = this.logger.startOperation('markQRCodeAsUsed', { qrCodeId, usedBy });

    try {
      const qrCode = await this.prisma.physical_qr_codes.findUnique({
        where: { id: qrCodeId },
      });

      if (!qrCode) {
        throw new NotFoundException('QR code non trouvé');
      }

      if (qrCode.status !== 'ASSIGNED') {
        throw new BadRequestException('Le QR code doit être assigné pour être utilisé');
      }

      const updatedQR = await this.prisma.physical_qr_codes.update({
        where: { id: qrCodeId },
        data: {
          status: 'DISABLED',
          first_used_at: new Date(),
        },
        include: {
          subscription_plans: true,
          users: true,
        },
      });

      // Enregistrer l'utilisation dans les métadonnées
      const usageData = {
        used_at: new Date(),
        used_by: usedBy,
        location,
        device_info: deviceInfo,
      };

      const currentMetadata = qrCode.metadata as any || {};
      const usageHistory = currentMetadata.usage_history || [];

      await this.prisma.physical_qr_codes.update({
        where: { id: qrCodeId },
        data: {
          metadata: {
            ...currentMetadata,
            usage_history: [...usageHistory, usageData],
          },
        },
      });

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(updatedQR);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des QR codes
   */
  async getStats(filters?: QRCodeFilters): Promise<QRCodeStats> {
    const operationId = this.logger.startOperation('getQRCodeStats', filters);

    try {
      const where = this.buildWhereConditions(undefined, filters);

      // Statistiques de base
      const [
        totalQRCodes,
        availableQRCodes,
        assignedQRCodes,
        disabledQRCodes,
      ] = await Promise.all([
        this.prisma.physical_qr_codes.count({ where }),
        this.prisma.physical_qr_codes.count({ where: { ...where, status: 'AVAILABLE' } }),
        this.prisma.physical_qr_codes.count({ where: { ...where, status: 'ASSIGNED' } }),
        this.prisma.physical_qr_codes.count({ where: { ...where, status: 'DISABLED' } }),
      ]);

      // Statistiques par type
      const qrCodesByType = await this.prisma.physical_qr_codes.groupBy({
        by: ['card_type'],
        where,
        _count: { card_type: true },
      });

      // Statistiques par statut
      const qrCodesByStatus = await this.prisma.physical_qr_codes.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      });

      // Tendances d'assignation (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const assignmentTrend = await this.prisma.physical_qr_codes.groupBy({
        by: ['assigned_at'],
        where: {
          ...where,
          assigned_at: { gte: sevenDaysAgo },
        },
        _count: { assigned_at: true },
      });

      this.logger.endOperation(operationId, 'success', true);
      return {
        totalQRCodes,
        availableQRCodes,
        assignedQRCodes,
        disabledQRCodes,
        usedQRCodes: 0,
        expiredQRCodes: 0,
        damagedQRCodes: 0,
        lostQRCodes: 0,
        qrCodesByType: qrCodesByType.map(item => ({
          type: item.card_type as QRCodeType,
          count: item._count.card_type,
          percentage: totalQRCodes > 0 ? (item._count.card_type / totalQRCodes) * 100 : 0,
        })),
        qrCodesByStatus: qrCodesByStatus.map(item => ({
          status: item.status as QRCodeStatus,
          count: item._count.status,
          percentage: totalQRCodes > 0 ? (item._count.status / totalQRCodes) * 100 : 0,
        })),
        qrCodesByVenue: [],
        assignmentTrend: assignmentTrend.map(item => ({
          date: item.assigned_at!.toISOString().split('T')[0],
          assigned: item._count.assigned_at,
          used: 0, // TODO: Calculate used count for each date
        })),
      };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }



  /**
   * Générer des QR codes en lot
   */
  async generateBatch(count: number, type: QRCodeType, prefix?: string): Promise<QRCode[]> {
    const operationId = this.logger.startOperation('generateBatchQRCodes', { count, type, prefix });

    try {
      const qrCodes: QRCode[] = [];

      for (let i = 0; i < count; i++) {
        const code = this.generateUniqueCode(prefix);
        const qrCode = await this.create({
          code,
          type,
        });
        qrCodes.push(qrCode);
      }

      this.logger.endOperation(operationId, 'success', true);
      return qrCodes;
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Shared validation and context for manual physical QR creation.
   */
  private async loadPlanForPhysicalQRCreation(subscriptionPlanId: string) {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: subscriptionPlanId },
      select: {
        id: true,
        name: true,
        code: true,
        is_active: true,
        max_subscribers: true,
        metadata: true,
        organizer_id: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  private resolveSerialPrefixFromPlan(metadata: unknown): string | null {
    const meta = metadata as Record<string, unknown> | null;
    const prefix = meta?.serial_prefix;
    return typeof prefix === 'string' && prefix.length > 0 ? prefix : null;
  }

  private formatSerialNumber(sequence: number, seasonPrefix: string | null): string {
    const padded = sequence.toString().padStart(4, '0');
    return seasonPrefix ? `${seasonPrefix}${padded}` : padded;
  }

  private parseSerialSequence(serial: string | null | undefined, seasonPrefix: string | null): number {
    if (!serial) return 0;
    const numericPart =
      seasonPrefix && serial.startsWith(seasonPrefix)
        ? serial.slice(seasonPrefix.length)
        : serial;
    const num = parseInt(numericPart, 10);
    return Number.isNaN(num) ? 0 : num;
  }

  private async getMaxSerialForSuffix(
    suffixType: string,
    seasonPrefix: string | null,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<number> {
    const codes = await client.physical_qr_codes.findMany({
      where: { qr_code: { startsWith: `NTRX:CSS:${suffixType}:` } },
      select: { serial_number: true },
    });

    let maxSerial = 0;
    for (const row of codes) {
      const num = this.parseSerialSequence(row.serial_number, seasonPrefix);
      if (num > maxSerial) {
        maxSerial = num;
      }
    }
    return maxSerial;
  }

  private buildSerialNumberRange(
    startSequence: number,
    count: number,
    seasonPrefix: string | null,
  ): string[] {
    return Array.from({ length: count }, (_, i) =>
      this.formatSerialNumber(startSequence + i, seasonPrefix),
    );
  }

  private async assertPlanAllowsPhysicalQRCreation(
    subscriptionPlanId: string,
    count: number,
    options?: {
      suffixType?: string;
      seatRow?: string;
      seatStartNumber?: number;
      porte?: number;
    },
  ) {
    const plan = await this.loadPlanForPhysicalQRCreation(subscriptionPlanId);

    if (!plan.is_active) {
      throw new BadRequestException('Le plan d\'abonnement n\'est pas actif');
    }

    if (options?.suffixType && !['SUB', 'SUBVB'].includes(options.suffixType)) {
      throw new BadRequestException('Le suffixe doit être SUB ou SUBVB');
    }

    if (options?.porte !== undefined && (options.porte < 1 || options.porte > 4)) {
      throw new BadRequestException('Le numéro de porte doit être entre 1 et 4');
    }

    const statusCounts = await this.prisma.physical_qr_codes.groupBy({
      by: ['status'],
      where: { subscription_plan_id: subscriptionPlanId },
      _count: { id: true },
    });

    const totalQr = statusCounts.reduce((sum, row) => sum + row._count.id, 0);
    const disabledCount =
      statusCounts.find((row) => row.status === 'DISABLED')?._count.id ?? 0;

    if (totalQr > 0 && disabledCount === totalQr) {
      throw new BadRequestException(
        'Impossible d\'ajouter des QR sur un plan dont toutes les cartes sont archivées (saison clôturée).',
      );
    }

    const activeQrCount = await this.prisma.physical_qr_codes.count({
      where: {
        subscription_plan_id: subscriptionPlanId,
        status: { not: 'DISABLED' },
      },
    });

    if (plan.max_subscribers && activeQrCount + count > plan.max_subscribers) {
      throw new BadRequestException(
        `Capacité dépassée: ${activeQrCount} carte(s) active(s), max ${plan.max_subscribers}, demande +${count}.`,
      );
    }

    if (options?.seatRow) {
      const row = options.seatRow.trim().toUpperCase();
      if (!/^[A-Z]$/.test(row)) {
        throw new BadRequestException('La rangée de siège doit être une lettre unique (A-Z)');
      }

      const start = options.seatStartNumber ?? 1;
      if (start < 1) {
        throw new BadRequestException('Le numéro de siège de départ doit être au moins 1');
      }

      const seatLabels = Array.from({ length: count }, (_, i) => `${row}${start + i}`);
      const duplicatesInBatch = new Set<string>();
      for (const seat of seatLabels) {
        if (duplicatesInBatch.has(seat)) {
          throw new BadRequestException(`Siège en double dans la demande: ${seat}`);
        }
        duplicatesInBatch.add(seat);
      }

      const conflicting = await this.prisma.physical_qr_codes.findMany({
        where: {
          subscription_plan_id: subscriptionPlanId,
          status: { not: 'DISABLED' },
          OR: seatLabels.map((seat) => ({
            metadata: { path: ['seat'], equals: seat },
          })),
        },
        select: { metadata: true },
        take: 5,
      });

      if (conflicting.length > 0) {
        const seats = conflicting
          .map((qr) => (qr.metadata as Record<string, unknown> | null)?.seat)
          .filter(Boolean)
          .join(', ');
        throw new ConflictException(
          `Siège(s) déjà attribué(s) sur ce plan: ${seats}`,
        );
      }
    }

    return plan;
  }

  private async reserveUniqueOnboardingKey(
    usedInBatch: Set<string>,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    for (let attempts = 0; attempts < 100; attempts++) {
      const key = this.generateOnboardingKey();
      if (usedInBatch.has(key)) {
        continue;
      }

      const exists = await client.physical_qr_codes.findUnique({
        where: { onboarding_key: key },
        select: { id: true },
      });

      if (!exists) {
        usedInBatch.add(key);
        return key;
      }
    }

    throw new ConflictException('Impossible de générer une clé PIN unique');
  }

  private async reserveUniqueQRCodeSuffix(
    usedInBatch: Set<string>,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    for (let attempts = 0; attempts < 100; attempts++) {
      const suffix = this.generateRandomAlphanumeric(6);
      if (usedInBatch.has(suffix)) {
        continue;
      }

      const exists = await client.physical_qr_codes.findFirst({
        where: { qr_code: { endsWith: suffix } },
        select: { id: true },
      });

      if (!exists) {
        usedInBatch.add(suffix);
        return suffix;
      }
    }

    throw new ConflictException('Impossible de générer un code QR unique');
  }

  /**
   * Create a single physical QR code for a subscription plan
   */
  async createPhysicalQRCode(
    subscriptionPlanId: string,
    options?: {
      zoneId?: string;
      suffixType?: string;
      cardType?: string;
      cardBatch?: string;
      assignedBy?: string;
      seatRow?: string;
      seatStartNumber?: number;
      porte?: number;
    },
  ): Promise<QRCode> {
    const operationId = this.logger.startOperation('createPhysicalQRCode', {
      subscriptionPlanId,
      options,
    });

    try {
      const plan = await this.assertPlanAllowsPhysicalQRCreation(subscriptionPlanId, 1, options);
      const seasonPrefix = this.resolveSerialPrefixFromPlan(plan.metadata);
      
      // Generate unique values
      const zone = options?.zoneId || await this.mapSubscriptionPlanToZone(plan.code, subscriptionPlanId);
      
      // Get zone ID from zone code to determine suffix type
      const zoneIdFromCode = await this.getZoneIdFromCode(zone);
      const suffixType = options?.suffixType || await this.determineSuffixType(subscriptionPlanId, options?.suffixType, zoneIdFromCode || undefined);
      
      const last6Chars = await this.reserveUniqueQRCodeSuffix(new Set());
      const qrCode = `NTRX:CSS:${suffixType}:${zone}:${last6Chars}`;
      const onboardingKey = await this.reserveUniqueOnboardingKey(new Set());
      const maxSerial = await this.getMaxSerialForSuffix(suffixType, seasonPrefix);
      const serialNumber = this.formatSerialNumber(maxSerial + 1, seasonPrefix);

      // Detect porte and card batch from existing QR codes (only if not provided)
      const detectedPorte = options?.porte ? `Porte${options.porte}` : await this.detectPorteFromExistingQRCodes(subscriptionPlanId);
      const detectedCardBatch = await this.detectCardBatchFromExistingQRCodes(subscriptionPlanId);
      
      // Get zone name from zone code
      const zoneInfo = await this.prisma.venue_zones.findFirst({
        where: { code: zone },
        select: { name: true },
      });
      const zoneName = zoneInfo?.name || zone;
      
      // Prepare metadata
      const metadata: any = {};
      if (detectedPorte) {
        metadata.entry_gate = detectedPorte;
      }
      
      // Store zone name in metadata (matching existing QR code structure)
      metadata.zone = zoneName;
      
      // Handle seat if provided (matching existing QR code format: "A1")
      let seatRecordId: string | null = null;
      if (options?.seatRow && options?.seatStartNumber !== undefined) {
        // Store seat in the same format as existing QR codes: "A1" (only seat, not seat_row/seat_number)
        const seatLabel = `${options.seatRow}${options.seatStartNumber}`;
        metadata.seat = seatLabel;

        // Get zone ID from zone code to create seat record
        const zoneIdFromCode = await this.getZoneIdFromCode(zone);
        if (zoneIdFromCode) {
          // Check if seat already exists (seat_number should be full identifier like "A1")
          const existingSeat = await this.prisma.seats.findFirst({
            where: {
              zone_id: zoneIdFromCode,
              seat_number: seatLabel, // Full identifier like "A1"
              row_number: options.seatRow,
            },
            select: { id: true },
          });

          if (existingSeat) {
            seatRecordId = existingSeat.id;
            this.logger.debug(`Using existing seat record: ${seatRecordId} for ${seatLabel}`);
          } else {
            // Create new seat record (seat_number should be full identifier like "A1")
            const newSeat = await this.prisma.seats.create({
              data: {
                zone_id: zoneIdFromCode,
                seat_number: seatLabel, // Full identifier like "A1"
                row_number: options.seatRow,
                seat_type: 'STANDARD',
                status: 'AVAILABLE',
                price_modifier: 1.0,
                features: [],
                is_accessible: false,
              },
            });
            seatRecordId = newSeat.id;
            this.logger.debug(`Created new seat record: ${seatRecordId} for ${seatLabel}`);
          }
        }
      }

      // Create the QR code
      const created = await this.prisma.physical_qr_codes.create({
        data: {
          qr_code: qrCode,
          onboarding_key: onboardingKey,
          serial_number: serialNumber,
          subscription_plan_id: subscriptionPlanId,
          card_type: options?.cardType || 'STANDARD',
          card_batch: options?.cardBatch || detectedCardBatch,
          status: 'AVAILABLE',
          assigned_by: options?.assignedBy,
          printed_at: new Date(), // Set printed_at to creation time
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });

      // Note: max_subscribers is no longer automatically incremented when creating QR codes
      // The max_subscribers should be set manually by the admin when creating/editing the plan

      this.logger.endOperation(operationId, 'success', true);
      return this.mapToQRCode(created);
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Create multiple physical QR codes in bulk for a subscription plan
   */
  async bulkCreatePhysicalQRCodes(
    subscriptionPlanId: string,
    count: number,
    options?: {
      zoneId?: string;
      suffixType?: string;
      cardType?: string;
      cardBatch?: string;
      assignedBy?: string;
      seatRow?: string;
      seatStartNumber?: number;
      porte?: number;
    },
  ): Promise<{ created: QRCode[]; errors: Array<{ index: number; error: string }> }> {
    const operationId = this.logger.startOperation('bulkCreatePhysicalQRCodes', {
      subscriptionPlanId,
      count,
      options,
    });

    try {
      const plan = await this.assertPlanAllowsPhysicalQRCreation(subscriptionPlanId, count, options);
      const seasonPrefix = this.resolveSerialPrefixFromPlan(plan.metadata);

      if (count < 1 || count > 1000) {
        throw new BadRequestException('Count must be between 1 and 1000');
      }

      const created: QRCode[] = [];

      // Use transaction for bulk creation (all-or-nothing)
      await this.prisma.$transaction(async (tx) => {
        const zone = options?.zoneId || await this.mapSubscriptionPlanToZone(plan.code, subscriptionPlanId);
        const zoneIdFromCode = await this.getZoneIdFromCode(zone);
        const suffix =
          options?.suffixType ||
          (await this.determineSuffixType(
            subscriptionPlanId,
            options?.suffixType,
            zoneIdFromCode || undefined,
          ));

        const maxSerial = await this.getMaxSerialForSuffix(suffix, seasonPrefix, tx);
        const serialNumbers = this.buildSerialNumberRange(maxSerial + 1, count, seasonPrefix);

        const detectedPorte = options?.porte
          ? `Porte${options.porte}`
          : await this.detectPorteFromExistingQRCodes(subscriptionPlanId);
        const detectedCardBatch =
          options?.cardBatch || (await this.detectCardBatchFromExistingQRCodes(subscriptionPlanId));

        const zoneInfo = await tx.venue_zones.findFirst({
          where: { code: zone },
          select: { name: true },
        });
        const zoneName = zoneInfo?.name || zone;

        const metadataTemplate: Record<string, unknown> = { zone: zoneName };
        if (detectedPorte) {
          metadataTemplate.entry_gate = detectedPorte;
        }

        let currentSeatNumber = options?.seatStartNumber || 1;
        const zoneIdForSeats = options?.seatRow ? await this.getZoneIdFromCode(zone) : null;
        const usedPins = new Set<string>();
        const usedQrSuffixes = new Set<string>();

        for (let i = 0; i < count; i++) {
          const serialNumber = serialNumbers[i];
          const last6Chars = await this.reserveUniqueQRCodeSuffix(usedQrSuffixes, tx);
          const qrCode = `NTRX:CSS:${suffix}:${zone}:${last6Chars}`;
          const onboardingKey = await this.reserveUniqueOnboardingKey(usedPins, tx);

          const qrMetadata: Record<string, unknown> = { ...metadataTemplate };

          if (options?.seatRow) {
            const seatLabel = `${options.seatRow.toUpperCase()}${currentSeatNumber}`;
            qrMetadata.seat = seatLabel;

            if (zoneIdForSeats) {
              const existingSeat = await tx.seats.findFirst({
                where: {
                  zone_id: zoneIdForSeats,
                  seat_number: seatLabel,
                  row_number: options.seatRow.toUpperCase(),
                },
                select: { id: true },
              });

              if (!existingSeat) {
                await tx.seats.create({
                  data: {
                    zone_id: zoneIdForSeats,
                    seat_number: seatLabel,
                    row_number: options.seatRow.toUpperCase(),
                    seat_type: 'STANDARD',
                    status: 'AVAILABLE',
                    price_modifier: 1.0,
                    features: [],
                    is_accessible: false,
                  },
                });
              }
            }

            currentSeatNumber++;
          }

          const createdQR = await tx.physical_qr_codes.create({
            data: {
              qr_code: qrCode,
              onboarding_key: onboardingKey,
              serial_number: serialNumber,
              subscription_plan_id: subscriptionPlanId,
              card_type: options?.cardType || 'STANDARD',
              card_batch: detectedCardBatch,
              status: 'AVAILABLE',
              assigned_by: options?.assignedBy,
              printed_at: new Date(),
              metadata:
                Object.keys(qrMetadata).length > 0
                  ? (qrMetadata as Prisma.InputJsonValue)
                  : undefined,
            },
          });

          created.push(this.mapToQRCode(createdQR));
        }
      }, {
        timeout: 120000,
      });

      this.logger.endOperation(operationId, 'success', true, undefined, {
        created: created.length,
        errors: 0,
      });

      return { created, errors: [] };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Preview QR code creation without actually creating them
   * Returns what would be created (zone, suffix, porte, serial numbers range)
   */
  async previewQRCodeCreation(
    subscriptionPlanId: string,
    count: number,
    options?: {
      zoneId?: string;
      suffixType?: string;
      cardType?: string;
      cardBatch?: string;
      seatRow?: string;
      seatStartNumber?: number;
      porte?: number;
    },
  ): Promise<{
    subscriptionPlan: { id: string; name: string; code: string };
    zone: string;
    suffix: string;
    cardType: string;
    count: number;
    serialNumberRange: { start: string; end: string };
    estimatedCapacity: { max_before: number; max_after: number };
  }> {
    if (count < 1 || count > 1000) {
      throw new BadRequestException('Count must be between 1 and 1000');
    }

    const plan = await this.assertPlanAllowsPhysicalQRCreation(subscriptionPlanId, count, options);
    const seasonPrefix = this.resolveSerialPrefixFromPlan(plan.metadata);

    // Determine zone and suffix
    const zone = options?.zoneId || await this.mapSubscriptionPlanToZone(plan.code, subscriptionPlanId);
    
    // Get zone ID from zone code to determine suffix type
    const zoneIdFromCode = await this.getZoneIdFromCode(zone);
    const suffix = options?.suffixType || await this.determineSuffixType(subscriptionPlanId, options?.suffixType, zoneIdFromCode || undefined);

    const maxSerial = await this.getMaxSerialForSuffix(suffix, seasonPrefix);
    const serialNumbers = this.buildSerialNumberRange(maxSerial + 1, count, seasonPrefix);
    const startSerialStr = serialNumbers[0];
    const endSerialStr = serialNumbers[serialNumbers.length - 1];

    const activeQrCount = await this.prisma.physical_qr_codes.count({
      where: {
        subscription_plan_id: subscriptionPlanId,
        status: { not: 'DISABLED' },
      },
    });

    return {
      subscriptionPlan: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
      },
      zone,
      suffix,
      cardType: options?.cardType || 'STANDARD',
      count,
      serialNumberRange: {
        start: startSerialStr,
        end: endSerialStr,
      },
      estimatedCapacity: {
        max_before: plan.max_subscribers || activeQrCount,
        max_after: plan.max_subscribers || activeQrCount + count,
      },
    };
  }

  /**
   * Export created QR codes to CSV format
   */
  async exportCreatedQRCodes(qrCodeIds: string[]): Promise<{ csv: string; filename: string }> {
    const qrCodes = await this.prisma.physical_qr_codes.findMany({
      where: { id: { in: qrCodeIds } },
      select: {
        qr_code: true,
        onboarding_key: true,
        serial_number: true,
        subscription_plan_id: true,
      },
      orderBy: { serial_number: 'asc' },
    });
    
    // Get subscription plan name from first QR code (all QR codes should have same plan)
    let subscriptionPlanName = 'plan';
    if (qrCodes.length > 0 && qrCodes[0].subscription_plan_id) {
      const plan = await this.prisma.subscription_plans.findUnique({
        where: { id: qrCodes[0].subscription_plan_id },
        select: { name: true },
      });
      if (plan?.name) {
        subscriptionPlanName = plan.name;
      }
    }
    
    // Clean subscription plan name for filename (remove special chars, keep spaces)
    const cleanPlanName = subscriptionPlanName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    
    // Generate filename: "{count} {subscription_plan_name}"
    const count = qrCodes.length;
    const filename = `${count} ${cleanPlanName}`;
    
    // Generate CSV with only QR Code, Onboarding Key, Serial Number
    const headers = ['QR Code', 'Onboarding Key', 'Serial Number'];
    const rows = qrCodes.map(qr => [
      qr.qr_code,
      qr.onboarding_key,
      qr.serial_number,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return { csv: csvContent, filename };
  }

  /**
   * Check if a single QR code already exists in the database
   */
  async checkQrCodeExists(qrCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking QR code existence: ${qrCode}`);
      
      const existingCode = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: qrCode },
        select: { id: true }
      });

      const exists = !!existingCode;
      this.logger.debug(`QR code ${qrCode} exists: ${exists}`);
      
      return exists;
    } catch (error) {
      this.logger.error(`Error checking QR code existence: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check multiple QR codes for existence in batch
   */
  async checkMultipleQrCodes(qrCodes: string[]): Promise<{ code: string; exists: boolean }[]> {
    try {
      this.logger.debug(`Checking ${qrCodes.length} QR codes for existence`);
      
      const results = await Promise.all(
        qrCodes.map(async (code) => {
          const exists = await this.checkQrCodeExists(code);
          return { code, exists };
        })
      );

      this.logger.debug(`Batch check completed for ${qrCodes.length} codes`);
      return results;
    } catch (error) {
      this.logger.error(`Error in batch QR code check: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Méthodes privées utilitaires
   */
  private buildWhereConditions(query?: string, filters?: QRCodeFilters): any {
    const where: any = {};

    if (query) {
      where.OR = [
        { qr_code: { contains: query, mode: 'insensitive' } },
        { serial_number: { contains: query, mode: 'insensitive' } },
        { metadata: { path: ['seat_number'], string_contains: query, mode: 'insensitive' } },
        { metadata: { path: ['seat'], string_contains: query, mode: 'insensitive' } },
      ];
    }

    if (filters?.type) where.card_type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.subscriptionId) where.subscription_plan_id = filters.subscriptionId;
    if (filters?.assignedTo) where.assigned_by = filters.assignedTo;



    if (filters?.subscriptionPlanId) {
      // QR codes assigned to a specific subscription plan
      where.subscription_plan_id = filters.subscriptionPlanId;
    } else if (filters?.season) {
      where.subscription_plans = {
        metadata: {
          path: ['season'],
          equals: filters.season,
        },
      };
    }

    if (filters?.createdAfter) where.created_at = { gte: new Date(filters.createdAfter) };
    if (filters?.createdBefore) where.created_at = { ...where.created_at, lte: new Date(filters.createdBefore) };
    if (filters?.assignedAfter) where.assigned_at = { gte: new Date(filters.assignedAfter) };
    if (filters?.assignedBefore) where.assigned_at = { ...where.assigned_at, lte: new Date(filters.assignedBefore) };

    return where;
  }

  private buildOrderBy(sorting?: { field: string; order: 'asc' | 'desc' }): any {
    if (!sorting) return { created_at: 'desc' };

    const fieldMapping: Record<string, string> = {
      'created_at': 'created_at',
      'updated_at': 'updated_at',
      'assigned_at': 'assigned_at',
      'qr_code': 'qr_code',
      'card_type': 'card_type',
      'status': 'status',
      'serial_number': 'serial_number',
    };

    const field = fieldMapping[sorting.field] || 'created_at';
    return { [field]: sorting.order };
  }

  private generateUniqueCode(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const baseCode = `${prefix || 'QR'}-${timestamp}-${random}`.toUpperCase();
    return baseCode;
  }

  /**
   * Generate a globally unique onboarding key
   */
  private async generateUniqueOnboardingKey(): Promise<string> {
    return this.reserveUniqueOnboardingKey(new Set());
  }

  /**
   * Generate a globally unique last 6 characters for QR code
   */
  private async generateUniqueQRCodeSuffix(): Promise<string> {
    return this.reserveUniqueQRCodeSuffix(new Set());
  }

  /**
   * Get next serial number globally per suffix type (SUB or SUBVB).
   * Season 2026/2027+ uses 26xxxx (6 digits); legacy season used 4 digits.
   */
  private async getNextSerialNumber(suffixType: string, seasonPrefix?: string): Promise<string> {
    const prefix = seasonPrefix ?? '26';
    const useSeasonPrefix = prefix.length > 0;
    const maxSerial = await this.getMaxSerialForSuffix(
      suffixType,
      useSeasonPrefix ? prefix : null,
    );
    return this.formatSerialNumber(maxSerial + 1, useSeasonPrefix ? prefix : null);
  }

  /**
   * Map zone ID to suffix type (SUB vs SUBVB)
   * Based on zone ID mapping rules
   */
  private mapZoneIdToSuffixType(zoneId: string): string {
    // Zone ID mapping rules:
    // Zone ID 6ab09470-8ee8-42ed-b4fe-f976f54f2ab1 -> SUB
    // Zone ID bc43d5e2-9a2f-46df-9021-4f6b6e74b79a -> SUB
    // Other zones default to SUB (can be extended later)
    
    const zoneIdToSuffixMap: Record<string, string> = {
      '6ab09470-8ee8-42ed-b4fe-f976f54f2ab1': 'SUB',
      'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a': 'SUB',
    };

    // Return mapped suffix or default to SUB
    return zoneIdToSuffixMap[zoneId] || 'SUB';
  }

  /**
   * Get zones for a subscription plan from subscription_plan_zones table
   */
  async getZonesForSubscriptionPlan(subscriptionPlanId: string): Promise<Array<{ id: string; code: string; name: string }>> {
    const planZones = await this.prisma.subscription_plan_zones.findMany({
      where: {
        subscription_plan_id: subscriptionPlanId,
        is_included: true,
      },
      include: {
        venue_zones: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        priority_level: 'desc',
      },
    });

    return planZones.map(spz => ({
      id: spz.venue_zones.id,
      code: spz.venue_zones.code,
      name: spz.venue_zones.name,
    }));
  }

  /**
   * Get zone ID from zone code
   */
  private async getZoneIdFromCode(zoneCode: string): Promise<string | null> {
    const zone = await this.prisma.venue_zones.findFirst({
      where: { code: zoneCode },
      select: { id: true },
    });
    return zone?.id || null;
  }

  /**
   * Helper method to sync seat status based on QR code status
   * When QR code is ASSIGNED -> seat should be SOLD
   * When QR code is AVAILABLE -> seat should be AVAILABLE
   */
  private async syncSeatStatusWithQRCode(
    qrCode: { qr_code: string; metadata: any; status: string },
    newSeatStatus: 'AVAILABLE' | 'SOLD',
    tx?: any
  ): Promise<void> {
    const prismaClient = tx || this.prisma;
    
    // Extract seat from metadata (format: "A1")
    const seatLabel = qrCode.metadata?.seat;
    if (!seatLabel) {
      // No seat associated with this QR code
      return;
    }

    // Parse seat label (e.g., "A1" -> row: "A", seat: "A1")
    const seatMatch = seatLabel.match(/^([A-Z])(\d+)$/i);
    if (!seatMatch) {
      this.logger.warn(`Invalid seat format in QR code ${qrCode.qr_code}: ${seatLabel}`);
      return;
    }

    const rowNumber = seatMatch[1].toUpperCase();
    // seat_number should be the full identifier "A1", not just "1"
    const seatNumber = seatLabel;

    // Get zone from QR code (extract from QR code pattern: NTRX:CSS:SUB:ZONE:SERIAL)
    const qrCodeParts = qrCode.qr_code.split(':');
    const zoneCode = qrCodeParts.length >= 4 ? qrCodeParts[3] : null;
    
    if (!zoneCode) {
      this.logger.warn(`Could not extract zone code from QR code ${qrCode.qr_code}`);
      return;
    }

    // Get zone ID from zone code
    const zone = await prismaClient.venue_zones.findFirst({
      where: { code: zoneCode },
      select: { id: true },
    });

    if (!zone) {
      this.logger.warn(`Zone not found for code ${zoneCode} from QR code ${qrCode.qr_code}`);
      return;
    }

    // Find and update the seat
    const seat = await prismaClient.seats.findFirst({
      where: {
        zone_id: zone.id,
        seat_number: seatNumber,
        row_number: rowNumber,
      },
    });

    if (seat) {
      await prismaClient.seats.update({
        where: { id: seat.id },
        data: {
          status: newSeatStatus,
          updated_at: new Date(),
        },
      });
      this.logger.debug(
        `Synced seat ${seatNumber} (row ${rowNumber}) status to ${newSeatStatus} for QR code ${qrCode.qr_code}`
      );
    } else {
      this.logger.warn(
        `Seat ${seatNumber} (row ${rowNumber}) not found in zone ${zone.id} for QR code ${qrCode.qr_code}`
      );
    }
  }

  /**
   * Map subscription plan to zone code
   * Gets zone from existing QR codes of the same subscription plan, or from subscription_plan_zones if no QR codes exist
   */
  private async mapSubscriptionPlanToZone(planCode: string, subscriptionPlanId?: string): Promise<string> {
    if (!subscriptionPlanId) {
      throw new BadRequestException('Subscription plan ID is required to determine zone');
    }

    this.logger.debug(`[mapSubscriptionPlanToZone] Determining zone for plan: ${planCode} (${subscriptionPlanId})`);

    // Get existing QR codes for this subscription plan
    const existingQRCodes = await this.prisma.physical_qr_codes.findMany({
      where: { subscription_plan_id: subscriptionPlanId },
      select: { qr_code: true },
    });

    this.logger.debug(`[mapSubscriptionPlanToZone] Found ${existingQRCodes.length} existing QR codes for this plan`);

    // If QR codes exist, extract zone from them
    if (existingQRCodes.length > 0) {
    // Extract zones from existing QR codes and count them
    const zoneCounts: Record<string, number> = {};
    for (const qr of existingQRCodes) {
      const match = qr.qr_code.match(/NTRX:CSS:[^:]+:([^:]+):/);
      if (match && match[1]) {
        const zone = match[1];
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      }
    }

    this.logger.debug(`[mapSubscriptionPlanToZone] Zone counts from existing QR codes: ${JSON.stringify(zoneCounts)}`);

      if (Object.keys(zoneCounts).length > 0) {
    // Return the most common zone
    const mostCommonZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0][0];
    this.logger.debug(`[mapSubscriptionPlanToZone] Selected zone from existing QR codes: ${mostCommonZone}`);
    return mostCommonZone;
      }
    }

    // No QR codes exist or couldn't extract zone from QR codes
    // Try to get zone from subscription_plan_zones
    this.logger.debug(`[mapSubscriptionPlanToZone] No QR codes found, checking subscription_plan_zones`);
    
    const planZones = await this.getZonesForSubscriptionPlan(subscriptionPlanId);
    
    if (planZones.length === 0) {
      throw new BadRequestException(
        `Ce plan d'abonnement n'a aucune zone configurée. Veuillez configurer des zones pour ce plan dans les paramètres du plan d'abonnement, ou spécifiez manuellement une zone lors de la création des QR codes.`
      );
    }

    if (planZones.length === 1) {
      // Single zone, use its code
      const zoneCode = planZones[0].code;
      this.logger.debug(`[mapSubscriptionPlanToZone] Selected zone from subscription_plan_zones: ${zoneCode}`);
      return zoneCode;
    }

    // Multiple zones - throw error to force frontend to let user select
    throw new BadRequestException(
      `Multiple zones found for subscription plan ${subscriptionPlanId}. Please specify the zone manually. Available zones: ${planZones.map(z => z.name).join(', ')}`
    );
  }

  /**
   * Detect card batch from existing QR codes of the same subscription plan
   */
  private async detectCardBatchFromExistingQRCodes(subscriptionPlanId: string): Promise<string | null> {
    const existingQRCodes = await this.prisma.physical_qr_codes.findMany({
      where: { 
        subscription_plan_id: subscriptionPlanId,
        card_batch: { not: null },
      },
      select: { card_batch: true },
      take: 100,
      orderBy: { created_at: 'desc' },
    });

    if (existingQRCodes.length === 0) {
      return null;
    }

    // Count card batch occurrences
    const batchCounts: Record<string, number> = {};
    for (const qr of existingQRCodes) {
      if (qr.card_batch && typeof qr.card_batch === 'string') {
        batchCounts[qr.card_batch] = (batchCounts[qr.card_batch] || 0) + 1;
      }
    }

    // Return the most common card batch
    if (Object.keys(batchCounts).length > 0) {
      const mostCommonBatch = Object.entries(batchCounts).sort((a, b) => b[1] - a[1])[0][0];
      return mostCommonBatch;
    }

    return null;
  }

  /**
   * Check if a subscription plan has seats
   * Checks existing QR codes for seat metadata
   */
  async subscriptionPlanHasSeats(subscriptionPlanId: string): Promise<boolean> {
    // Check existing QR codes for seat metadata
    const existingQRCodes = await this.prisma.physical_qr_codes.findFirst({
      where: {
        subscription_plan_id: subscriptionPlanId,
        metadata: { not: null },
      },
      select: { metadata: true },
    });

    if (!existingQRCodes) {
      return false;
    }

    const metadata = existingQRCodes.metadata as any;
    if (metadata) {
      // Check for various seat metadata fields
      if (metadata.seat || metadata.seat_number || metadata.seat_row || metadata.row || metadata.seat_code) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all venue zones from the database
   */
  async getAllZones(): Promise<Array<{ id: string; code: string; name: string }>> {
    const operationId = this.logger.startOperation('getAllZones', {});
    
    try {
      // Get all zones (active and inactive) - let frontend filter if needed
      // But prefer active zones first
      const zones = await this.prisma.venue_zones.findMany({
        where: {
          // Include active zones or zones where is_active is null (default active)
          OR: [
            { is_active: true },
            { is_active: null }
          ]
        },
          select: {
            id: true,
          code: true,
          name: true,
              },
        orderBy: [
          { is_active: 'desc' }, // Active zones first
          { name: 'asc' }
        ],
    });

      this.logger.info(`Retrieved ${zones.length} active zones from database`);
      if (zones.length > 0) {
        this.logger.info(`First zone: ${zones[0].name} (${zones[0].code})`);
      }
      
      this.logger.endOperation('getAllZones', operationId, true);
      return zones;
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'QRCodesService.getAllZones',
        undefined,
        JSON.stringify({})
      );
      this.logger.endOperation('getAllZones', operationId, false);
      throw error;
      }
    }

  /**
   * Get all available seat rows for a subscription plan
   * Returns an array of unique seat row letters (A, B, C, etc.) found in QR code metadata
   */
  async getAvailableSeatRows(subscriptionPlanId: string): Promise<string[]> {
    // Get all QR codes for this subscription plan with seat metadata
    const existingQRCodes = await this.prisma.physical_qr_codes.findMany({
      where: { 
        subscription_plan_id: subscriptionPlanId,
        metadata: { not: null },
      },
      select: { metadata: true },
    });

    const seatRows = new Set<string>();

    for (const qr of existingQRCodes) {
      const metadata = qr.metadata as any;
      if (metadata) {
        // Check seat field (format: "L45" - row + number combined)
        const seat = metadata.seat;
        if (seat && typeof seat === 'string') {
          // Extract row letter (first character)
          const rowLetter = seat.charAt(0).toUpperCase();
          if (rowLetter.match(/[A-Z]/)) {
            seatRows.add(rowLetter);
          }
        }
        // Also check row field if it exists
        if (metadata.row && typeof metadata.row === 'string') {
          const rowLetter = metadata.row.charAt(0).toUpperCase();
          if (rowLetter.match(/[A-Z]/)) {
            seatRows.add(rowLetter);
        }
      }
    }
    }

    // Return sorted array of unique seat rows
    return Array.from(seatRows).sort();
  }

  /**
   * Get the last seat number for a given seat row in a subscription plan
   * Returns the highest seat number for the row, or 0 if no seats exist for that row
   */
  async getLastSeatNumberForRow(subscriptionPlanId: string, seatRow: string): Promise<number> {
    // Get all QR codes for this subscription plan (we'll filter by row in code)
    const existingQRCodes = await this.prisma.physical_qr_codes.findMany({
      where: { 
        subscription_plan_id: subscriptionPlanId,
        metadata: { not: null }, // Only QR codes with metadata
      },
      select: { metadata: true },
    });

    if (existingQRCodes.length === 0) {
      return 0;
    }

    const upperSeatRow = seatRow.toUpperCase();
    let maxSeatNumber = 0;
    
    for (const qr of existingQRCodes) {
      const metadata = qr.metadata as any;
      if (metadata) {
        // Check seat field (format: "L45" - row + number combined)
        const seat = metadata.seat;
        if (seat && typeof seat === 'string') {
          // Check if seat starts with the specified row (e.g., "L45" starts with "L")
          if (seat.toUpperCase().startsWith(upperSeatRow)) {
            // Extract numeric part (e.g., "L45" -> 45)
            const match = seat.match(/\d+$/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (!isNaN(num) && num > maxSeatNumber) {
                maxSeatNumber = num;
              }
            }
          }
        }
      }
    }

    return maxSeatNumber;
  }

  /**
   * Detect porte/gate from existing QR codes of the same subscription plan
   * Returns the most common porte from existing QR codes, or null if none found
   */
  private async detectPorteFromExistingQRCodes(subscriptionPlanId: string): Promise<string | null> {
    const existingQRCodes = await this.prisma.physical_qr_codes.findMany({
      where: { subscription_plan_id: subscriptionPlanId },
      select: { metadata: true },
      take: 100, // Check up to 100 existing QR codes
    });

    if (existingQRCodes.length === 0) {
      this.logger.debug(`[detectPorteFromExistingQRCodes] No existing QR codes found for subscription plan ${subscriptionPlanId}`);
      return null;
    }

    // Count porte occurrences
    const porteCounts: Record<string, number> = {};
    for (const qr of existingQRCodes) {
      const metadata = qr.metadata as any;
      if (metadata) {
        const porte = metadata.entry_gate || metadata.access_point || metadata.gate || metadata.porte;
        if (porte && typeof porte === 'string') {
          porteCounts[porte] = (porteCounts[porte] || 0) + 1;
        }
      }
    }

    // Return the most common porte
    if (Object.keys(porteCounts).length > 0) {
      const mostCommonPorte = Object.entries(porteCounts).sort((a, b) => b[1] - a[1])[0][0];
      this.logger.debug(`[detectPorteFromExistingQRCodes] Selected porte: ${mostCommonPorte}`);
      return mostCommonPorte;
    }

    this.logger.debug(`[detectPorteFromExistingQRCodes] No porte found in existing QR codes metadata`);
    return null;
  }

  /**
   * Determine suffix type (SUB or SUBVB) based on subscription plan
   * SUBVB for volleyball/basketball, SUB for football
   */
  private async determineSuffixType(subscriptionPlanId: string, override?: string, zoneId?: string): Promise<string> {
    if (override) {
      return override.toUpperCase();
    }

    // If zone ID is provided, check zone's venue and mapping first
    if (zoneId) {
      try {
        const zone = await this.prisma.venue_zones.findUnique({
          where: { id: zoneId },
          select: {
            id: true,
            mapping_id: true,
            venue_mappings: {
              select: {
                venue_id: true,
              },
            },
          },
        });

        if (zone && zone.venue_mappings) {
          const venueId = zone.venue_mappings.venue_id;
          const mappingId = zone.mapping_id;
          
          // Check if zone belongs to specific venue and mapping combination for SUBVB
          const SUBVB_VENUE_ID = '6ab09470-8ee8-42ed-b4fe-f976f54f2ab1';
          const SUBVB_MAPPING_ID = '56496292-1fe9-46b0-8fef-befeeba7e4a6';
          
          if (venueId === SUBVB_VENUE_ID && mappingId === SUBVB_MAPPING_ID) {
            this.logger.debug(`[determineSuffixType] Zone ${zoneId} belongs to venue ${venueId} and mapping ${mappingId}, using SUBVB`);
            return 'SUBVB';
          }
        }
      } catch (error) {
        this.logger.warn(`[determineSuffixType] Error checking zone ${zoneId} for venue/mapping: ${error.message}`);
      }
      
      // Fallback to zone ID mapping if venue/mapping check didn't match
      const suffixFromZone = this.mapZoneIdToSuffixType(zoneId);
      this.logger.debug(`[determineSuffixType] Using suffix from zone ID ${zoneId}: ${suffixFromZone}`);
      return suffixFromZone;
    }

    // Check subscription plan metadata or organizer to determine category
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: subscriptionPlanId },
      include: {
        organizers: {
          select: {
            name: true,
            metadata: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Check metadata for category
    const metadata = plan.metadata as any;
    if (metadata?.category) {
      const category = metadata.category.toLowerCase();
      if (category.includes('volleyball') || category.includes('basketball') || category.includes('volley') || category.includes('basket')) {
        return 'SUBVB';
      }
    }

    // Check organizer name for hints
    const organizerName = plan.organizers?.name?.toLowerCase() || '';
    if (organizerName.includes('volleyball') || organizerName.includes('basketball') || organizerName.includes('volley') || organizerName.includes('basket')) {
      return 'SUBVB';
    }

    // Default to SUB (football)
    return 'SUB';
  }

  /**
   * Generate QR code string based on subscription plan
   */
  private async generateQRCodeString(
    subscriptionPlanId: string,
    zoneId?: string,
    suffixType?: string,
  ): Promise<string> {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: subscriptionPlanId },
      select: { code: true },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const zone = zoneId || await this.mapSubscriptionPlanToZone(plan.code, subscriptionPlanId);
    
    // Get zone ID from zone code to determine suffix type if not provided
    let finalSuffix = suffixType;
    if (!finalSuffix) {
      const zoneIdFromCode = await this.getZoneIdFromCode(zone);
      finalSuffix = await this.determineSuffixType(subscriptionPlanId, undefined, zoneIdFromCode || undefined);
    }
    
    const last6Chars = await this.generateUniqueQRCodeSuffix();

    return `NTRX:CSS:${finalSuffix}:${zone}:${last6Chars}`;
  }

  /**
   * Generate random alphanumeric string
   */
  private generateRandomAlphanumeric(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
    return result;
  }

  private generateOnboardingKey(): string {
    // Format: XXXX-XXXX (4 chars - 4 chars)
    const part1 = this.generateRandomAlphanumeric(4);
    const part2 = this.generateRandomAlphanumeric(4);
    return `${part1}-${part2}`;
  }

  private generateSerialNumber(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  private mapToQRCode(prismaQR: any): QRCode {
    return {
      id: prismaQR.id,
      code: prismaQR.qr_code,
      type: prismaQR.card_type as QRCodeType,
      status: prismaQR.status as QRCodeStatus,
      seatNumber: prismaQR.metadata?.seat_number || prismaQR.metadata?.seat,
      venueId: prismaQR.metadata?.venue_id,
      eventId: prismaQR.metadata?.event_id,
      subscriptionId: prismaQR.subscription_plan_id,
      assignedTo: prismaQR.assigned_by,
      assignedAt: prismaQR.assigned_at,
      createdAt: prismaQR.created_at,
      updatedAt: prismaQR.updated_at,
      metadata: {
        ...prismaQR.metadata,
        serial_number: prismaQR.serial_number,
      },
      subscription: prismaQR.subscription_plans ? {
        subscription_plan: prismaQR.subscription_plans,
      } : undefined,
      // Add subscription information if available
      subscriptionInfo: prismaQR.subscription ? {
        id: prismaQR.subscription.id,
        subscription_number: prismaQR.subscription.subscription_number,
        status: prismaQR.subscription.status,
        start_date: prismaQR.subscription.start_date,
        end_date: prismaQR.subscription.end_date,
        price_paid: prismaQR.subscription.price_paid,
        currency: prismaQR.subscription.currency,
        user: prismaQR.subscription.users ? {
          id: prismaQR.subscription.users.id,
          first_name: prismaQR.subscription.users.first_name,
          last_name: prismaQR.subscription.users.last_name,
          email: prismaQR.subscription.users.email,
        } : null,
        subscription_plan: prismaQR.subscription.subscription_plans ? {
          id: prismaQR.subscription.subscription_plans.id,
          name: prismaQR.subscription.subscription_plans.name,
          type: prismaQR.subscription.subscription_plans.type,
        } : null,
      } : null,
      assignedUser: prismaQR.users ? {
        first_name: prismaQR.users.first_name,
        last_name: prismaQR.users.last_name,
        email: prismaQR.users.email,
      } : undefined,
    };
  }

  /**
   * Sync all seat statuses based on their associated QR code status
   * This is a one-time fix method to sync existing data
   * Can also be used periodically to keep seats in sync
   */
  async syncAllSeatStatuses(): Promise<{ synced: number; errors: number }> {
    const operationId = this.logger.startOperation('syncAllSeatStatuses');
    let synced = 0;
    let errors = 0;

    try {
      // Get all QR codes that have seat metadata
      const qrCodesWithSeats = await this.prisma.physical_qr_codes.findMany({
        where: {
          metadata: {
            path: ['seat'],
            not: null,
          },
        },
        select: {
          qr_code: true,
          status: true,
          metadata: true,
        },
      });

      this.logger.debug(`Found ${qrCodesWithSeats.length} QR codes with seat metadata`);

      for (const qrCode of qrCodesWithSeats) {
        try {
          // Determine expected seat status based on QR code status
          const expectedSeatStatus = qrCode.status === 'ASSIGNED' ? 'SOLD' : 'AVAILABLE';
          
          // Sync this seat
          await this.syncSeatStatusWithQRCode(qrCode, expectedSeatStatus);
          synced++;
        } catch (error) {
          this.logger.warn(`Error syncing seat for QR code ${qrCode.qr_code}: ${error.message}`);
          errors++;
        }
      }

      this.logger.endOperation(operationId, 'success', true);
      this.logger.info(`Seat sync completed: ${synced} synced, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }
} 