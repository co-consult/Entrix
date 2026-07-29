import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CssForeverException } from '../exceptions/cssforever.exception';

@Catch()
export class CssForeverExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof CssForeverException) {
      const body = exception.getResponse() as Record<string, unknown>;
      return res.status(exception.getStatus()).json(body);
    }

    if (exception instanceof UnauthorizedException) {
      return res.status(401).json({
        status: 'KO',
        errorCode: 'UNAUTHORIZED',
        message: exception.message || 'Non autorisé',
      });
    }

    if (exception instanceof ForbiddenException) {
      return res.status(403).json({
        status: 'KO',
        errorCode: 'FORBIDDEN',
        message: exception.message || 'Accès refusé',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && (body as Record<string, unknown>).status === 'KO') {
        return res.status(status).json(body);
      }

      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? Array.isArray((body as { message: unknown }).message)
            ? (body as { message: string[] }).message.join(', ')
            : String((body as { message: unknown }).message)
          : exception.message;

      return res.status(status).json({
        status: 'KO',
        errorCode: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message,
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'KO',
      errorCode: 'INTERNAL_ERROR',
      message: 'Erreur interne',
    });
  }
}
