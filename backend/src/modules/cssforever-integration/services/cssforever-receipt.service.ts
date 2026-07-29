import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { OrdersService } from '../../orders/services/orders.service';

@Injectable()
export class CssForeverReceiptService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  buildReceiptNumber(orderNumber?: string): string {
    if (orderNumber) {
      return orderNumber.replace(/^ORD_/, 'RCP-');
    }
    const year = new Date().getFullYear();
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `RCP-${year}-${suffix}`;
  }

  createReceiptToken(orderId: string, ttlSeconds = 86400): string {
    const secret = this.configService.get<string>('cssforever.receiptSecret');
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = `${orderId}.${exp}`;
    const sig = createHmac('sha256', secret || 'secret').update(payload).digest('hex');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
  }

  verifyReceiptToken(token: string): { orderId: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const [orderId, expStr, sig] = decoded.split('.');
      const secret = this.configService.get<string>('cssforever.receiptSecret');
      const payload = `${orderId}.${expStr}`;
      const expected = createHmac('sha256', secret || 'secret').update(payload).digest('hex');
      if (sig !== expected) return null;
      if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
      return { orderId };
    } catch {
      return null;
    }
  }

  buildReceiptDownloadUrl(orderId: string): string {
    const base = this.configService.get<string>('cssforever.publicApiUrl') || '';
    const token = this.createReceiptToken(orderId);
    return `${base.replace(/\/$/, '')}/partner/subscriptions/receipts/${token}`;
  }

  async generateReceiptPdf(orderId: string): Promise<Buffer> {
    return this.ordersService.generateInvoice(orderId);
  }
}
