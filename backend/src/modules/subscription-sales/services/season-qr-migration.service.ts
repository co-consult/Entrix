import { createHash, randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { seasonCodeSuffix } from '../constants/seasons';
import type { GenerateQRPreview } from '../interfaces/season-operations.interface';

const VB_PLAN_CODES = new Set(['GRADINS_VB', 'CHAISE_VB']);

export function migrationArchiveReason(targetSeason: string): string {
  return `season_migration_${targetSeason}`;
}

export function legacyMigrationArchiveReason(targetSeason: string): string {
  const [start, end] = targetSeason.split('-');
  return `season_${start}_${end}_migration`;
}

export function migrationArchiveReasons(targetSeason: string): string[] {
  return [migrationArchiveReason(targetSeason), legacyMigrationArchiveReason(targetSeason)];
}

function seasonQrSuffix(sourceId: string): string {
  return sourceId.replace(/-/g, '').substring(19, 27).toUpperCase();
}

function seasonOnboardingKey(sourceId: string): string {
  const h1 = createHash('sha256').update(`onb1${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  const h2 = createHash('sha256').update(`onb2${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  return `${h1}-${h2}`;
}

function seasonArchivedPin(sourceId: string): string {
  const h1 = createHash('sha256').update(`ret1${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  const h2 = createHash('sha256').update(`ret2${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  return `${h1}-${h2}`;
}

interface MigrationPair {
  oldQrId: string;
  originalPin: string;
  originalStatus: string;
  originalSerial: string;
  originalQrCode: string;
  newPlanId: string;
  newPlanCode: string;
  oldPlanCode: string;
  cardBatch: string | null;
  cardType: string | null;
  oldMetadata: Record<string, unknown>;
}

@Injectable()
export class SeasonQRMigrationService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SeasonQRMigrationService');
  }

  async buildMigrationPairs(
    organizerId: string,
    sourceSeason: string,
    targetSeason: string,
  ): Promise<MigrationPair[]> {
    const targetSuffix = seasonCodeSuffix(targetSeason);

    const sourcePlans = await this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: sourceSeason },
        NOT: { code: { endsWith: `-${targetSuffix}` } },
      },
      select: { id: true, code: true },
    });

    if (sourcePlans.length === 0) {
      throw new NotFoundException(`Aucun plan trouvé pour la saison source ${sourceSeason}`);
    }

    const sourcePlanIds = sourcePlans.map((p) => p.id);
    const sourcePlanById = new Map(sourcePlans.map((p) => [p.id, p.code]));

    const targetPlans = await this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: targetSeason },
      },
      select: { id: true, code: true, metadata: true },
    });

    const targetByPreviousId = new Map<string, { id: string; code: string }>();
    for (const tp of targetPlans) {
      const meta = tp.metadata as Record<string, unknown> | null;
      const prevId = meta?.previous_plan_id as string | undefined;
      if (prevId) {
        targetByPreviousId.set(prevId, { id: tp.id, code: tp.code });
      }
    }

    const oldQrs = await this.prisma.physical_qr_codes.findMany({
      where: { subscription_plan_id: { in: sourcePlanIds } },
    });

    const pairs: MigrationPair[] = [];
    for (const qr of oldQrs) {
      const target = targetByPreviousId.get(qr.subscription_plan_id!);
      if (!target) continue;

      const meta = (qr.metadata as Record<string, unknown>) || {};
      const isArchived = qr.status === 'DISABLED';
      const effectiveStatus =
        isArchived && meta.original_status
          ? (meta.original_status as string)
          : qr.status;
      const effectivePin =
        isArchived && meta.original_onboarding_key
          ? (meta.original_onboarding_key as string)
          : qr.onboarding_key;

      pairs.push({
        oldQrId: qr.id,
        originalPin: effectivePin,
        originalStatus: effectiveStatus,
        originalSerial: qr.serial_number,
        originalQrCode: qr.qr_code,
        newPlanId: target.id,
        newPlanCode: target.code,
        oldPlanCode: sourcePlanById.get(qr.subscription_plan_id!) || '',
        cardBatch: qr.card_batch,
        cardType: qr.card_type,
        oldMetadata: meta,
      });
    }

    return pairs;
  }

  async previewGeneration(
    organizerId: string,
    sourceSeason: string,
    targetSeason: string,
  ): Promise<GenerateQRPreview> {
    const pairs = await this.buildMigrationPairs(organizerId, sourceSeason, targetSeason);
    const perPlanMap = new Map<string, { total: number; renewals: number; newStock: number }>();

    let renewals = 0;
    let newStock = 0;
    for (const p of pairs) {
      const isRenewal = p.originalStatus === 'ASSIGNED';
      if (isRenewal) renewals++;
      else newStock++;

      const entry = perPlanMap.get(p.newPlanCode) || { total: 0, renewals: 0, newStock: 0 };
      entry.total++;
      if (isRenewal) entry.renewals++;
      else entry.newStock++;
      perPlanMap.set(p.newPlanCode, entry);
    }

    return {
      total: pairs.length,
      renewals,
      newStock,
      perPlan: Array.from(perPlanMap.entries())
        .map(([planCode, stats]) => ({ planCode, ...stats }))
        .sort((a, b) => a.planCode.localeCompare(b.planCode)),
    };
  }

  async generateSeasonQRs(
    organizerId: string,
    sourceSeason: string,
    targetSeason: string,
    options: { archiveSource?: boolean; dryRun?: boolean } = {},
  ) {
    const { archiveSource = true, dryRun = false } = options;
    const preview = await this.previewGeneration(organizerId, sourceSeason, targetSeason);

    if (preview.total === 0) {
      throw new BadRequestException('Aucune paire QR source/cible trouvée. Vérifiez que les plans sont clonés avec previous_plan_id.');
    }

    const targetPlanIds = await this.getTargetPlanIds(organizerId, targetSeason);
    const existingTarget = await this.prisma.physical_qr_codes.count({
      where: { subscription_plan_id: { in: targetPlanIds } },
    });

    if (existingTarget > 0) {
      throw new ConflictException(
        `La saison cible contient déjà ${existingTarget} QR code(s). Rollback ou annulez avant de régénérer.`,
      );
    }

    if (dryRun) {
      return { dryRun: true, preview };
    }

    const pairs = await this.buildMigrationPairs(organizerId, sourceSeason, targetSeason);
    const serialPrefix = targetSeason.split('-')[0].slice(2);
    const archiveReason = migrationArchiveReason(targetSeason);
    const targetYearStart = targetSeason.split('-')[0];
    const targetYearEnd = targetSeason.split('-')[1];

    const inserted = await this.prisma.$transaction(async (tx) => {
      if (archiveSource) {
        const batchSize = 200;
        for (let i = 0; i < pairs.length; i += batchSize) {
          const chunk = pairs.slice(i, i + batchSize);
          await Promise.all(
            chunk.map((pair) => {
              const meta = { ...pair.oldMetadata };
              return tx.physical_qr_codes.update({
                where: { id: pair.oldQrId },
                data: {
                  status: 'DISABLED',
                  disabled_at: new Date(),
                  onboarding_key: seasonArchivedPin(pair.oldQrId),
                  metadata: {
                    ...meta,
                    archived_reason: archiveReason,
                    archived_at: new Date().toISOString(),
                    original_onboarding_key: pair.originalPin,
                    original_status: pair.originalStatus,
                    migration_target_season: targetSeason,
                  },
                  updated_at: new Date(),
                },
              });
            }),
          );
        }
      }

      const batchSize = 200;
      let count = 0;
      for (let i = 0; i < pairs.length; i += batchSize) {
        const chunk = pairs.slice(i, i + batchSize);
        await tx.physical_qr_codes.createMany({
          data: chunk.map((pair) => {
            const parts = pair.originalQrCode.split(':');
            const zonePart = parts[2] || 'SUB';
            const typePart = parts[3] || 'GEN';
            const newQrCode = `NTRX:CSS:${zonePart}:${typePart}:${seasonQrSuffix(pair.oldQrId)}`;
            const digits = pair.originalSerial.replace(/[^0-9]/g, '').padStart(4, '0').slice(-4);
            const isAssigned = pair.originalStatus === 'ASSIGNED';
            const batchName =
              pair.cardBatch?.replace(/\d{4}/g, targetYearStart) ||
              `BATCH_${pair.newPlanCode.replace(/-\d{4}$/, '')}_${seasonCodeSuffix(targetSeason)}`;

            return {
              id: randomUUID(),
              qr_code: newQrCode,
              onboarding_key: pair.originalPin,
              serial_number: `${serialPrefix}${digits}`,
              subscription_plan_id: pair.newPlanId,
              card_batch: batchName,
              card_type: pair.cardType || 'STANDARD',
              status: 'AVAILABLE' as const,
              printed_at: new Date(),
              metadata: {
                ...pair.oldMetadata,
                season: targetSeason,
                previous_serial: pair.originalSerial,
                previous_qr_code: pair.originalQrCode,
                previous_qr_id: pair.oldQrId,
                renewal_pin_preserved: isAssigned,
                pin_preserved_from_source: true,
                source_status: pair.originalStatus,
                migration_source_season: sourceSeason,
              },
              created_at: new Date(),
              updated_at: new Date(),
            };
          }),
        });
        count += chunk.length;
      }
      return count;
    }, { timeout: 300000 });

    await this.clearCaches(organizerId);

    this.logger.logBusinessEvent('SEASON_QR_GENERATED', {
      sourceSeason,
      targetSeason,
      inserted,
      archived: archiveSource,
    });

    return { inserted, preview, archivedSource: archiveSource };
  }

  async rollbackMigration(
    organizerId: string,
    sourceSeason: string,
    targetSeason: string,
  ) {
    const targetPlanIds = await this.getTargetPlanIds(organizerId, targetSeason);

    if (targetPlanIds.length === 0) {
      throw new NotFoundException(`Aucun plan pour la saison cible ${targetSeason}`);
    }

    const assignedOnTarget = await this.prisma.physical_qr_codes.count({
      where: { subscription_plan_id: { in: targetPlanIds }, status: 'ASSIGNED' },
    });
    if (assignedOnTarget > 0) {
      throw new ConflictException(
        `${assignedOnTarget} QR code(s) assigné(s) sur la saison cible — rollback impossible.`,
      );
    }

    const subsOnTarget = await this.prisma.subscriptions.count({
      where: { plan_id: { in: targetPlanIds } },
    });
    if (subsOnTarget > 0) {
      throw new ConflictException(
        `${subsOnTarget} abonnement(s) lié(s) aux plans cible — rollback impossible.`,
      );
    }

    const accessRightsOnTarget = await this.prisma.access_rights.count({
      where: {
        subscriptions: { plan_id: { in: targetPlanIds } },
      },
    });
    if (accessRightsOnTarget > 0) {
      throw new ConflictException(
        `${accessRightsOnTarget} droit(s) d'accès lié(s) — rollback impossible.`,
      );
    }

    const targetQrs = await this.prisma.physical_qr_codes.findMany({
      where: { subscription_plan_id: { in: targetPlanIds } },
      select: {
        id: true,
        onboarding_key: true,
        qr_code: true,
        serial_number: true,
        metadata: true,
      },
    });

    const sourcePlanIds = await this.getTargetPlanIds(organizerId, sourceSeason);
    const archivedSource = await this.prisma.physical_qr_codes.findMany({
      where: {
        subscription_plan_id: { in: sourcePlanIds },
        status: 'DISABLED',
      },
    });

    const archiveReasons = new Set(migrationArchiveReasons(targetSeason));
    const toRestore = archivedSource.filter((qr) => {
      const meta = qr.metadata as Record<string, unknown> | null;
      return archiveReasons.has(meta?.archived_reason as string);
    });

    if (toRestore.length === 0) {
      throw new BadRequestException(
        'Aucune carte source archivée pour cette migration — rollback impossible.',
      );
    }

    const sourceIdsToRestore = new Set(toRestore.map((q) => q.id));
    const targetIdsToDelete = new Set(targetQrs.map((q) => q.id));
    const pinsBeingRestored = new Set(
      toRestore
        .map((q) => (q.metadata as Record<string, unknown> | null)?.original_onboarding_key as string)
        .filter(Boolean),
    );

    for (const t of targetQrs) {
      if (!pinsBeingRestored.has(t.onboarding_key)) continue;
      const meta = t.metadata as Record<string, unknown> | null;
      const linkedSourceId = meta?.previous_qr_id as string | undefined;
      if (!linkedSourceId || !sourceIdsToRestore.has(linkedSourceId)) {
        throw new ConflictException(`Conflit PIN lors de la restauration: ${t.onboarding_key}`);
      }
    }

    const excludeIds = [...targetIdsToDelete, ...toRestore.map((q) => q.id)];
    const externalConflict = await this.prisma.physical_qr_codes.findFirst({
      where: {
        onboarding_key: { in: [...pinsBeingRestored] },
        id: { notIn: excludeIds },
      },
      select: { onboarding_key: true },
    });
    if (externalConflict) {
      throw new ConflictException(
        `Conflit PIN externe lors de la restauration: ${externalConflict.onboarding_key}`,
      );
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const del = await tx.physical_qr_codes.deleteMany({
        where: { id: { in: targetQrs.map((q) => q.id) } },
      });

      const batchSize = 200;
      for (let i = 0; i < toRestore.length; i += batchSize) {
        const chunk = toRestore.slice(i, i + batchSize);
        await Promise.all(
          chunk.map((qr) => {
            const meta = { ...((qr.metadata as Record<string, unknown>) || {}) };
            const originalPin = meta.original_onboarding_key as string;
            const originalStatus = (meta.original_status as string) || 'AVAILABLE';
            delete meta.archived_reason;
            delete meta.archived_at;
            delete meta.original_onboarding_key;
            delete meta.original_status;
            delete meta.migration_target_season;

            return tx.physical_qr_codes.update({
              where: { id: qr.id },
              data: {
                status: originalStatus as any,
                disabled_at: null,
                onboarding_key: originalPin,
                metadata: meta as Prisma.InputJsonValue,
                updated_at: new Date(),
              },
            });
          }),
        );
      }

      return del.count;
    }, { timeout: 600000 });

    await this.clearCaches(organizerId);

    this.logger.logBusinessEvent('SEASON_QR_ROLLBACK', {
      sourceSeason,
      targetSeason,
      deletedTarget: deleted,
      restoredSource: toRestore.length,
    });

    return { deletedTarget: deleted, restoredSource: toRestore.length };
  }

  async activateSeasonSales(
    organizerId: string,
    sourceSeason: string,
    targetSeason: string,
  ) {
    const sourcePlans = await this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: sourceSeason },
      },
    });

    const targetPlans = await this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: targetSeason },
      },
    });

    if (targetPlans.length === 0) {
      throw new NotFoundException(`Aucun plan pour la saison cible ${targetSeason}`);
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await this.prisma.$transaction(async (tx) => {
      for (const plan of sourcePlans) {
        const meta = (plan.metadata as Record<string, unknown>) || {};
        await tx.subscription_plans.update({
          where: { id: plan.id },
          data: {
            metadata: { ...meta, sales_closed: true },
            sale_end_date: plan.sale_end_date && plan.sale_end_date < now ? plan.sale_end_date : yesterday,
            updated_at: now,
          },
        });
      }

      const [tgtStart, tgtEnd] = targetSeason.split('-').map(Number);

      for (const plan of targetPlans) {
        const baseCode = ((plan.metadata as any)?.base_plan_code as string) || plan.code.replace(/-\d{4}$/, '');
        const isVb = VB_PLAN_CODES.has(baseCode);

        let saleStart: Date;
        let saleEnd: Date;
        if (isVb) {
          saleStart = new Date(`${tgtStart}-11-13`);
          saleEnd = new Date(`${tgtEnd}-10-31`);
        } else {
          saleStart = now;
          saleEnd = new Date(`${tgtEnd}-06-30`);
        }

        const meta = (plan.metadata as Record<string, unknown>) || {};
        await tx.subscription_plans.update({
          where: { id: plan.id },
          data: {
            sale_start_date: saleStart,
            sale_end_date: saleEnd,
            is_active: true,
            metadata: { ...meta, sales_closed: false },
            updated_at: now,
          },
        });
      }
    });

    await this.clearCaches(organizerId);

    return {
      closedSourcePlans: sourcePlans.length,
      openedTargetPlans: targetPlans.length,
    };
  }

  private async getTargetPlanIds(organizerId: string, seasonId: string): Promise<string[]> {
    const plans = await this.prisma.subscription_plans.findMany({
      where: {
        organizer_id: organizerId,
        metadata: { path: ['season'], equals: seasonId },
      },
      select: { id: true },
    });
    return plans.map((p) => p.id);
  }

  private async clearCaches(organizerId: string) {
    await this.redis.delCache(`subscription-plans:available:${organizerId}`);
    await this.redis.delCache(`subscription-plans:all-organizer:${organizerId}`);
    const keys = await this.redis.keys('subscription-plans:*');
    for (const key of keys) {
      await this.redis.delCache(key);
    }
  }
}
