"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessRightsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const access_enums_1 = require("../types/access-enums");
const shield_constants_1 = require("../types/shield-constants");
const crypto = __importStar(require("crypto"));
let AccessRightsService = class AccessRightsService {
    prisma;
    redis;
    bullmq;
    logger;
    constructor(prisma, redis, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('AccessRightsService');
    }
    async create(accessRightData) {
        const operationId = this.logger.startOperation('createAccessRight', {
            sourceType: accessRightData.source_type,
            userId: accessRightData.user_id,
        });
        try {
            this.logger.info('Creating access right', JSON.stringify({
                sourceType: accessRightData.source_type,
                userId: accessRightData.user_id,
                eventId: accessRightData.event_id,
            }));
            await this.validateAccessRightCreation(accessRightData);
            const access_code = await this.generateUniqueAccessCode();
            const createData = {
                ...(accessRightData.user_id && {
                    users: { connect: { id: accessRightData.user_id } }
                }),
                ...(accessRightData.event_id && {
                    events: { connect: { id: accessRightData.event_id } }
                }),
                ...(accessRightData.organizer_id && {
                    organizers: { connect: { id: accessRightData.organizer_id } }
                }),
                ...(accessRightData.subscription_id && {
                    subscriptions: { connect: { id: accessRightData.subscription_id } }
                }),
                ...(accessRightData.ticket_id && {
                    tickets: { connect: { id: accessRightData.ticket_id } }
                }),
                ...(accessRightData.zone_id && {
                    venue_zones: { connect: { id: accessRightData.zone_id } }
                }),
                ...(accessRightData.seat_id && {
                    seats: { connect: { id: accessRightData.seat_id } }
                }),
                status: access_enums_1.AccessRightStatus.VALID,
                source_type: accessRightData.source_type,
                access_code,
                valid_from: accessRightData.valid_from,
                valid_until: accessRightData.valid_until,
                max_uses: accessRightData.max_uses || 1,
                current_uses: 0,
                access_metadata: accessRightData.access_metadata || client_1.Prisma.JsonNull,
                special_permissions: accessRightData.special_permissions || client_1.Prisma.JsonNull,
            };
            const accessRight = await this.prisma.access_rights.create({
                data: createData,
                include: {
                    users: {
                        select: { id: true, email: true, first_name: true, last_name: true }
                    },
                    events: {
                        select: { id: true, title: true, start_date: true }
                    },
                    venue_zones: {
                        select: { id: true, name: true }
                    }
                }
            });
            await this.cacheAccessRight(accessRight);
            await this.auditAccessRightEvent(accessRight, access_enums_1.AuditEventType.ACCESS_RIGHT_CREATED, { created_by: 'system' });
            this.logger.logBusinessEvent('ACCESS_RIGHT_CREATED', {
                accessRightId: accessRight.id,
                accessCode: access_code,
                sourceType: accessRight.source_type,
                userId: accessRight.user_id,
                eventId: accessRight.event_id,
            }, accessRight.user_id);
            this.logger.endOperation('createAccessRight', operationId, true);
            return accessRight;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessRightsService.create', accessRightData.user_id || 'unknown', {
                sourceType: accessRightData.source_type,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('createAccessRight', operationId, false);
            throw error;
        }
    }
    async findById(id) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}${id}`;
        const cached = await this.redis.getCache(cacheKey);
        if (cached) {
            this.logger.logCacheEvent('hit', cacheKey);
            return cached;
        }
        this.logger.logCacheEvent('miss', cacheKey);
        const accessRight = await this.prisma.access_rights.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, email: true, first_name: true, last_name: true }
                },
                events: {
                    select: { id: true, title: true, start_date: true, end_date: true }
                },
                organizers: {
                    select: { id: true, name: true }
                },
                venue_zones: {
                    select: { id: true, name: true, capacity: true }
                },
                seats: {
                    select: { id: true, row: true, number: true }
                }
            }
        });
        if (!accessRight) {
            throw new common_1.NotFoundException(`Droit d'accès avec l'ID ${id} introuvable`);
        }
        await this.cacheAccessRight(accessRight);
        return accessRight;
    }
    async findByAccessCode(accessCode) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}code:${accessCode}`;
        const cached = await this.redis.getCache(cacheKey);
        if (cached) {
            this.logger.logCacheEvent('hit', cacheKey);
            return cached;
        }
        const accessRight = await this.prisma.access_rights.findUnique({
            where: { access_code: accessCode },
            include: {
                users: true,
                events: true,
                organizers: true,
                venue_zones: true,
                seats: true
            }
        });
        if (!accessRight) {
            throw new common_1.NotFoundException(`Droit d'accès avec le code ${accessCode} introuvable`);
        }
        await this.redis.setCache(cacheKey, accessRight, shield_constants_1.SHIELD_CONSTANTS.CACHE.ACCESS_RIGHTS_TTL);
        return accessRight;
    }
    async findMany(query) {
        const operationId = this.logger.startOperation('findManyAccessRights', {
            filters: {
                userId: query.user_id,
                eventId: query.event_id,
                status: query.status,
            }
        });
        try {
            const where = {};
            if (query.user_id)
                where.user_id = query.user_id;
            if (query.event_id)
                where.event_id = query.event_id;
            if (query.organizer_id)
                where.organizer_id = query.organizer_id;
            if (query.status)
                where.status = query.status;
            if (query.source_type)
                where.source_type = query.source_type;
            if (query.zone_id)
                where.zone_id = query.zone_id;
            if (query.valid_from || query.valid_until) {
                where.AND = [];
                if (query.valid_from) {
                    where.AND.push({ valid_from: { gte: query.valid_from } });
                }
                if (query.valid_until) {
                    where.AND.push({ valid_until: { lte: query.valid_until } });
                }
            }
            if (!query.include_expired) {
                where.valid_until = { gte: new Date() };
            }
            const result = await this.prisma.paginate(this.prisma.access_rights, {
                where,
                include: {
                    users: {
                        select: { id: true, email: true, first_name: true, last_name: true }
                    },
                    events: {
                        select: { id: true, title: true, start_date: true }
                    },
                    venue_zones: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            }, query.page || 1, query.limit || 20);
            this.logger.endOperation('findManyAccessRights', operationId, true);
            return {
                access_rights: result.data,
                total: result.total,
                page: result.page,
                limit: result.limit,
                has_next: result.hasNext,
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessRightsService.findMany', query.user_id || 'unknown');
            this.logger.endOperation('findManyAccessRights', operationId, false);
            throw error;
        }
    }
    async update(id, updateData) {
        const operationId = this.logger.startOperation('updateAccessRight', { id });
        try {
            const existingAccessRight = await this.findById(id);
            const updateInput = {};
            if (updateData.status !== undefined)
                updateInput.status = updateData.status;
            if (updateData.valid_from)
                updateInput.valid_from = updateData.valid_from;
            if (updateData.valid_until)
                updateInput.valid_until = updateData.valid_until;
            if (updateData.max_uses !== undefined)
                updateInput.max_uses = updateData.max_uses;
            if (updateData.access_metadata !== undefined) {
                updateInput.access_metadata = updateData.access_metadata || client_1.Prisma.JsonNull;
            }
            if (updateData.special_permissions !== undefined) {
                updateInput.special_permissions = updateData.special_permissions || client_1.Prisma.JsonNull;
            }
            const updatedAccessRight = await this.prisma.access_rights.update({
                where: { id },
                data: updateInput,
                include: {
                    users: true,
                    events: true,
                    organizers: true,
                    venue_zones: true,
                    seats: true
                }
            });
            await this.invalidateAccessRightCache(id);
            await this.auditAccessRightEvent(updatedAccessRight, access_enums_1.AuditEventType.ACCESS_GRANTED, {
                updated_fields: Object.keys(updateData),
                previous_status: existingAccessRight.status,
                new_status: updatedAccessRight.status
            });
            this.logger.logBusinessEvent('ACCESS_RIGHT_UPDATED', {
                accessRightId: id,
                updatedFields: Object.keys(updateData),
                previousStatus: existingAccessRight.status,
                newStatus: updatedAccessRight.status,
            }, updatedAccessRight.user_id);
            this.logger.endOperation('updateAccessRight', operationId, true);
            return updatedAccessRight;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessRightsService.update', 'unknown', { accessRightId: id });
            this.logger.endOperation('updateAccessRight', operationId, false);
            throw error;
        }
    }
    async validateAccess(validateData) {
        const operationId = this.logger.startOperation('validateAccess', {
            accessCode: validateData.access_code,
            action: validateData.action,
            accessPoint: validateData.access_point,
        });
        try {
            this.logger.info('Validating access', JSON.stringify({
                accessCode: validateData.access_code,
                action: validateData.action,
                accessPoint: validateData.access_point,
            }));
            let accessRight;
            try {
                accessRight = await this.findByAccessCode(validateData.access_code);
            }
            catch (error) {
                return this.buildValidationResult(false, null, access_enums_1.AccessStatus.DENIED, 'Code d\'accès invalide ou introuvable', validateData);
            }
            const basicChecks = this.performBasicValidations(accessRight, validateData);
            if (!basicChecks.isValid) {
                return this.buildValidationResult(false, accessRight, basicChecks.status, basicChecks.message, validateData);
            }
            const contextChecks = await this.performContextualValidations(accessRight, validateData);
            if (!contextChecks.isValid) {
                return this.buildValidationResult(false, accessRight, contextChecks.status, contextChecks.message, validateData);
            }
            if (this.shouldMarkAsUsed(validateData.action)) {
                await this.markAccessRightAsUsed(accessRight, validateData);
            }
            const result = this.buildValidationResult(true, accessRight, access_enums_1.AccessStatus.SUCCESS, 'Accès autorisé', validateData, {
                remaining_uses: accessRight.max_uses - (accessRight.current_uses + 1),
                zone_access: this.getZoneAccess(accessRight),
                special_permissions: accessRight.special_permissions,
            });
            this.logger.endOperation('validateAccess', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessRightsService.validateAccess', 'unknown', {
                accessCode: validateData.access_code,
                action: validateData.action,
                errorType: error.constructor.name,
            });
            this.logger.endOperation('validateAccess', operationId, false);
            return this.buildValidationResult(false, null, access_enums_1.AccessStatus.ERROR, 'Erreur lors de la validation d\'accès', validateData);
        }
    }
    performBasicValidations(accessRight, validateData) {
        const now = new Date();
        if (accessRight.status !== access_enums_1.AccessRightStatus.VALID) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: `Droit d'accès ${accessRight.status.toLowerCase()}`
            };
        }
        if (now < accessRight.valid_from) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Droit d\'accès pas encore valide'
            };
        }
        if (now > accessRight.valid_until) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Droit d\'accès expiré'
            };
        }
        if (accessRight.current_uses >= accessRight.max_uses) {
            return {
                isValid: false,
                status: access_enums_1.AccessStatus.DENIED,
                message: 'Nombre maximum d\'utilisations atteint'
            };
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Validations de base réussies'
        };
    }
    async performContextualValidations(accessRight, validateData) {
        if (accessRight.special_permissions) {
            const specialPermsCheck = this.validateSpecialPermissions(accessRight.special_permissions, validateData);
            if (!specialPermsCheck.isValid) {
                return specialPermsCheck;
            }
        }
        if (validateData.context?.geolocation && accessRight.access_metadata) {
            const geoCheck = this.validateGeographicRestrictions(accessRight.access_metadata, validateData.context.geolocation);
            if (!geoCheck.isValid) {
                return geoCheck;
            }
        }
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Validations contextuelles réussies'
        };
    }
    async generateUniqueAccessCode() {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const code = crypto.randomBytes(8).toString('hex').toUpperCase();
            const existing = await this.prisma.access_rights.findUnique({
                where: { access_code: code },
                select: { id: true }
            });
            if (!existing) {
                return code;
            }
            attempts++;
        }
        throw new Error('Impossible de générer un code d\'accès unique');
    }
    async validateAccessRightCreation(data) {
        if (data.valid_from >= data.valid_until) {
            throw new common_1.BadRequestException('La date de début doit être antérieure à la date de fin');
        }
        if (data.event_id) {
            const event = await this.prisma.events.findUnique({
                where: { id: data.event_id },
                select: { id: true }
            });
            if (!event) {
                throw new common_1.NotFoundException(`Événement avec l'ID ${data.event_id} introuvable`);
            }
        }
        if (data.user_id) {
            const user = await this.prisma.users.findUnique({
                where: { id: data.user_id },
                select: { id: true, is_active: true }
            });
            if (!user) {
                throw new common_1.NotFoundException(`Utilisateur avec l'ID ${data.user_id} introuvable`);
            }
            if (!user.is_active) {
                throw new common_1.BadRequestException('L\'utilisateur doit être actif');
            }
        }
    }
    async cacheAccessRight(accessRight) {
        const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}${accessRight.id}`;
        const codeKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}code:${accessRight.access_code}`;
        await Promise.all([
            this.redis.setCache(cacheKey, accessRight, shield_constants_1.SHIELD_CONSTANTS.CACHE.ACCESS_RIGHTS_TTL),
            this.redis.setCache(codeKey, accessRight, shield_constants_1.SHIELD_CONSTANTS.CACHE.ACCESS_RIGHTS_TTL)
        ]);
    }
    async invalidateAccessRightCache(id) {
        const accessRight = await this.prisma.access_rights.findUnique({
            where: { id },
            select: { access_code: true }
        });
        if (accessRight) {
            const cacheKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}${id}`;
            const codeKey = `${shield_constants_1.SHIELD_CONSTANTS.REDIS_PREFIXES.ACCESS_RIGHT}code:${accessRight.access_code}`;
            await Promise.all([
                this.redis.deleteCache(cacheKey),
                this.redis.deleteCache(codeKey)
            ]);
        }
    }
    buildValidationResult(isValid, accessRight, status, message, validateData, metadata) {
        const result = {
            isValid,
            access_right: accessRight,
            status,
            message,
            metadata,
            audit_data: {
                user_id: accessRight?.user_id || null,
                event_type: isValid ? access_enums_1.AuditEventType.ACCESS_GRANTED : access_enums_1.AuditEventType.ACCESS_DENIED,
                resource_type: 'ACCESS_RIGHT',
                resource_id: accessRight?.id || null,
                action: validateData.action,
                status,
                ip_address: validateData.context?.ip_address || null,
                user_agent: validateData.context?.user_agent || null,
                details: {
                    access_code: validateData.access_code,
                    access_point: validateData.access_point,
                    message,
                    metadata
                },
                timestamp: new Date(),
            }
        };
        this.auditAccessValidation(result);
        return result;
    }
    async markAccessRightAsUsed(accessRight, validateData) {
        await this.prisma.access_rights.update({
            where: { id: accessRight.id },
            data: {
                current_uses: { increment: 1 },
                used_at: new Date(),
                used_at_access_point: validateData.access_point || null,
                ...(accessRight.current_uses + 1 >= accessRight.max_uses && {
                    status: access_enums_1.AccessRightStatus.USED
                })
            }
        });
        await this.invalidateAccessRightCache(accessRight.id);
    }
    shouldMarkAsUsed(action) {
        return [
            access_enums_1.AccessAction.ENTRY,
            access_enums_1.AccessAction.VALIDATION
        ].includes(action);
    }
    getZoneAccess(accessRight) {
        const zones = [];
        if (accessRight.zone_id) {
            zones.push(accessRight.zone_id);
        }
        if (accessRight.access_metadata && accessRight.access_metadata.additional_zones) {
            zones.push(...accessRight.access_metadata.additional_zones);
        }
        return zones;
    }
    validateSpecialPermissions(specialPermissions, validateData) {
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Permissions spéciales validées'
        };
    }
    validateGeographicRestrictions(metadata, geolocation) {
        return {
            isValid: true,
            status: access_enums_1.AccessStatus.SUCCESS,
            message: 'Restrictions géographiques validées'
        };
    }
    async auditAccessRightEvent(accessRight, eventType, details) {
        await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, {
            user_id: accessRight.user_id,
            event_type: eventType,
            resource_type: 'ACCESS_RIGHT',
            resource_id: accessRight.id,
            action: 'ACCESS_RIGHT_OPERATION',
            status: access_enums_1.AccessStatus.SUCCESS,
            details,
            timestamp: new Date(),
        }, {
            priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
        });
    }
    async auditAccessValidation(result) {
        await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, result.audit_data, {
            priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.CRITICAL,
        });
    }
};
exports.AccessRightsService = AccessRightsService;
exports.AccessRightsService = AccessRightsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], AccessRightsService);
//# sourceMappingURL=access-rights.service.js.map