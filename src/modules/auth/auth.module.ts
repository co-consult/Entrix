// src/modules/auth/auth.module.ts
/**
 * Module d'authentification Entrix
 * 
 * Responsabilités :
 * - Configuration JWT et Passport
 * - Services d'authentification (Auth, Token, MFA, Session, Security)
 * - Stratégies d'authentification (JWT, Local, Refresh)
 * - Guards d'authentification et d'autorisation
 * - Rate limiting pour les endpoints sensibles
 * 
 * Dépendances :
 * - SharedModule (global) : PrismaService, RedisService, EmailService, etc.
 * - ConfigModule : Configuration JWT et sécurité
 * - PassportModule : Stratégies d'authentification
 * - JwtModule : Gestion des tokens JWT
 * - ThrottlerModule : Rate limiting
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MfaService } from './services/mfa.service';
import { SessionsService } from './services/session.service';
import { MfaController } from './controllers/mfa.controller';
import { SessionsController } from './controllers/sessions.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,],
  providers: [AuthService, MfaService, SessionsService, JwtStrategy],
  controllers: [AuthController, MfaController, SessionsController],
  exports: [AuthService, MfaService, SessionsService, JwtModule, PassportModule],
})
export class AuthModule {}