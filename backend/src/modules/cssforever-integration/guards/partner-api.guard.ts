import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PersistentTokenService } from '../../auth/services/persistent-token.service';

@Injectable()
export class PartnerApiGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly persistentTokenService: PersistentTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (
      request.method === 'GET' &&
      typeof request.url === 'string' &&
      request.url.includes('/partner/subscriptions/receipts/')
    ) {
      return true;
    }

    const configuredKey = this.configService.get<string>('cssforever.apiKey');
    const allowedIps = this.configService.get<string[]>('cssforever.allowedIps') || [];

    const apiKey =
      request.headers['x-api-key'] ||
      (request.headers.authorization?.startsWith('Bearer ')
        ? request.headers.authorization.slice(7)
        : null);

    if (!apiKey) {
      throw new UnauthorizedException('X-API-KEY requis');
    }

    let authenticated = false;

    if (configuredKey && apiKey === configuredKey) {
      authenticated = true;
    } else if (apiKey.startsWith('ent_int_') || apiKey.startsWith('ent_api_')) {
      const validation = await this.persistentTokenService.validateApiKey(apiKey);
      if (validation.isValid) {
        const scopes = validation.scopes || [];
        if (
          scopes.length === 0 ||
          scopes.includes('cssforever:subscriptions') ||
          scopes.includes('*')
        ) {
          authenticated = true;
          request.partnerUserId = validation.userId;
        }
      }
    }

    if (!authenticated) {
      throw new UnauthorizedException('Clé API invalide');
    }

    if (allowedIps.length > 0) {
      const clientIp =
        request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        request.ip ||
        request.connection?.remoteAddress;
      const normalized = (clientIp || '').replace('::ffff:', '');
      const allowed = allowedIps.some(
        (ip) => ip === normalized || ip === '0.0.0.0/0' || ip === '*',
      );
      if (!allowed) {
        throw new ForbiddenException('Adresse IP non autorisée');
      }
    }

    return true;
  }
}
