import { Controller, Post, Delete, Get, Body, Req } from '@nestjs/common';
import { SessionsService } from '../services/session.service';

@Controller('auth/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Req() req) {
    // À compléter : récupérer userId, ip, userAgent
    return {};
  }

  @Delete()
  async revoke(@Body() dto: { sessionId: string }) {
    // À compléter : révoquer la session
    return {};
  }

  @Get()
  async list(@Req() req) {
    // À compléter : lister les sessions de l'utilisateur
    return [];
  }
} 