import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CssForeverAuditService {
  constructor(private readonly prisma: PrismaService) {}

  hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
  }

  async log(params: {
    requestId?: string;
    endpoint: string;
    method: string;
    ip?: string;
    apiKeyPrefix?: string;
    payloadHash?: string;
    responseStatus: 'OK' | 'KO';
    errorCode?: string;
  }) {
    try {
      await this.prisma.partner_api_audit_log.create({
        data: {
          request_id: params.requestId || randomUUID(),
          endpoint: params.endpoint,
          method: params.method,
          ip: params.ip,
          api_key_prefix: params.apiKeyPrefix,
          payload_hash: params.payloadHash,
          response_status: params.responseStatus,
          error_code: params.errorCode,
        },
      });
    } catch {
      // audit must not break partner flow
    }
  }
}
