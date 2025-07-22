import { Controller, Post, Body, Req } from '@nestjs/common';
import { MfaService } from '../services/mfa.service';

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('challenge')
  async createChallenge(@Req() req) {
    // À compléter : récupérer userId et méthode
    return {};
  }

  @Post('verify')
  async verify(@Req() req, @Body() dto: { code: string; method: 'email' | 'sms' | 'totp' }) {
    // À compléter : vérifier le code
    return {};
  }
} 