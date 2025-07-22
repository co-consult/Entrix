import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { LoggerService } from '../../shared/logger/logger.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Filtre global pour capturer toutes les exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const userId = request.user?.id;

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = {};

    // Gestion des différents types d'exceptions
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
        errorCode = (response as any).error || 'HTTP_ERROR';
        details = (response as any).details || {};
      } else {
        message = response.toString();
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Gestion des erreurs Prisma
      const { code, meta } = exception;
      
      switch (code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = 'Un enregistrement avec ces données existe déjà';
          errorCode = 'DUPLICATE_ENTRY';
          details = { field: meta?.target };
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Enregistrement non trouvé';
          errorCode = 'NOT_FOUND';
          break;
        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Référence invalide';
          errorCode = 'INVALID_REFERENCE';
          details = { field: meta?.field_name };
          break;
        default:
          message = 'Erreur de base de données';
          errorCode = 'DATABASE_ERROR';
          details = { prismaCode: code };
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    } else {
      message = 'Une erreur inattendue s\'est produite';
      this.logger.error('Unknown exception', JSON.stringify(exception));
    }

    // Log de l'erreur
    this.logger.error(
      `Exception caught: ${message} - Status: ${httpStatus} - User: ${userId || 'anonymous'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Construction de la réponse d'erreur
    const errorResponse = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      errorCode,
      message,
      details,
      // En développement, inclure la stack trace
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    };

    // Envoi de la réponse
    httpAdapter.reply(ctx.getResponse(), errorResponse, httpStatus);
  }
}