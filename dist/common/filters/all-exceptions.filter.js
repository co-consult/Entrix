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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("../../shared/logger/logger.service");
const library_1 = require("@prisma/client/runtime/library");
let AllExceptionsFilter = class AllExceptionsFilter {
    httpAdapterHost;
    logger;
    constructor(httpAdapterHost, logger) {
        this.httpAdapterHost = httpAdapterHost;
        this.logger = logger;
        this.logger.setContext('ExceptionFilter');
    }
    catch(exception, host) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const userId = request.user?.id;
        let httpStatus = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let details = {};
        if (exception instanceof common_1.HttpException) {
            httpStatus = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null) {
                message = response.message || exception.message;
                errorCode = response.error || 'HTTP_ERROR';
                details = response.details || {};
            }
            else {
                message = response.toString();
            }
        }
        else if (exception instanceof library_1.PrismaClientKnownRequestError) {
            const { code, meta } = exception;
            switch (code) {
                case 'P2002':
                    httpStatus = common_1.HttpStatus.CONFLICT;
                    message = 'Un enregistrement avec ces données existe déjà';
                    errorCode = 'DUPLICATE_ENTRY';
                    details = { field: meta?.target };
                    break;
                case 'P2025':
                    httpStatus = common_1.HttpStatus.NOT_FOUND;
                    message = 'Enregistrement non trouvé';
                    errorCode = 'NOT_FOUND';
                    break;
                case 'P2003':
                    httpStatus = common_1.HttpStatus.BAD_REQUEST;
                    message = 'Référence invalide';
                    errorCode = 'INVALID_REFERENCE';
                    details = { field: meta?.field_name };
                    break;
                default:
                    message = 'Erreur de base de données';
                    errorCode = 'DATABASE_ERROR';
                    details = { prismaCode: code };
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(exception.message, exception.stack);
        }
        else {
            message = 'Une erreur inattendue s\'est produite';
            this.logger.error('Unknown exception', JSON.stringify(exception));
        }
        this.logger.error(`Exception caught: ${message} - Status: ${httpStatus} - User: ${userId || 'anonymous'}`, exception instanceof Error ? exception.stack : undefined);
        const errorResponse = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            errorCode,
            message,
            details,
            ...(process.env.NODE_ENV === 'development' && exception instanceof Error
                ? { stack: exception.stack }
                : {}),
        };
        httpAdapter.reply(ctx.getResponse(), errorResponse, httpStatus);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost,
        logger_service_1.LoggerService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map