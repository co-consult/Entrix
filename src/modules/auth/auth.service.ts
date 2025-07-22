// src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetPasswordDto, ConfirmResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { MfaLoginDto } from './dtos/mfa.dto';
import { UsersService } from '../users/services/users.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWT_EXPIRY, JWT_REFRESH_EXPIRY } from './constants';
import { MfaService } from './services/mfa.service';
import { SessionsService } from './services/session.service';
import { EmailService } from '../../shared/email/email.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { ConfigService } from '@nestjs/config';

// Stockage temporaire en mémoire pour tokens (à remplacer par DB/Redis en prod)
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();
const emailTokens = new Map<string, { userId: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mfaService: MfaService,
    private readonly sessionsService: SessionsService,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ip = 'ip', userAgent = 'userAgent') {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    
    // Note: password n'est pas dans UserResponse, on doit récupérer l'utilisateur avec password
    // Pour l'instant, on va simuler la vérification du password
    // TODO: Ajouter une méthode verifyPassword dans UsersService
    const valid = true; // await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    
    // TODO: Gestion des tentatives échouées, verrouillage
    // TODO: MFA - pour l'instant on simule qu'il n'y en a pas
    const mfaEnabled = false; // user.mfaEnabled
    
    if (mfaEnabled) {
      await this.mfaService.createChallenge(user.id, 'email');
      this.logger.log(`MFA challenge created for user ${user.id}`);
      return { mfaRequired: true, method: 'email' };
    }
    
    const payload = { userId: user.id, email: user.email, roles: [] }; // roles: user.roles
    const jwtSecret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: JWT_REFRESH_EXPIRY });
    
    await this.sessionsService.createSession(user.id, ip, userAgent);
    this.logger.log(`User ${user.id} logged in`);
    
    return { accessToken, refreshToken };
  }

  async mfaLogin(dto: MfaLoginDto & { email: string }, ip = 'ip', userAgent = 'userAgent') {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const mfaEnabled = false; // user.mfaEnabled - TODO: implémenter MFA
    if (!mfaEnabled) throw new ForbiddenException('MFA not enabled');
    
    const ok = await this.mfaService.verifyChallenge(user.id, dto.code, dto.method);
    if (!ok) throw new UnauthorizedException('Invalid MFA code');
    
    const payload = { userId: user.id, email: user.email, roles: [] }; // roles: user.roles
    const jwtSecret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: JWT_REFRESH_EXPIRY });
    
    await this.sessionsService.createSession(user.id, ip, userAgent);
    this.logger.log(`User ${user.id} logged in with MFA`);
    
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('Email already in use');
    
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      password: hash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
    });
    
    const token = this.generateToken();
    emailTokens.set(token, { userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    
    // Utiliser la méthode correcte du EmailService
    await this.emailService.sendVerificationEmail(user.email, token);
    
    this.logger.log(`User ${user.id} registered, verification email sent`);
    return { id: user.id, email: user.email };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return; // Ne pas révéler si l'email existe
    
    const token = this.generateToken();
    resetTokens.set(token, { userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }); // 1h
    
    // Utiliser la méthode correcte du EmailService
    await this.emailService.sendPasswordResetEmail(user.email, token);
    
    this.logger.log(`Password reset email sent for user ${user.id}`);
  }

  async confirmResetPassword(dto: ConfirmResetPasswordDto) {
    const tokenData = resetTokens.get(dto.token);
    if (!tokenData) throw new BadRequestException('Invalid or expired token');
    if (tokenData.expiresAt < new Date()) {
      resetTokens.delete(dto.token);
      throw new BadRequestException('Token expired');
    }
    
    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.update(tokenData.userId, { password: hash });
    
    resetTokens.delete(dto.token);
    
    // Révoquer toutes les sessions de l'utilisateur
    await this.sessionsService.revokeAllUserSessions(tokenData.userId);
    
    this.logger.log(`Password reset confirmed for user ${tokenData.userId}`);
    return { message: 'Password updated successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenData = emailTokens.get(dto.token);
    if (!tokenData) throw new BadRequestException('Invalid or expired token');
    if (tokenData.expiresAt < new Date()) {
      emailTokens.delete(dto.token);
      throw new BadRequestException('Token expired');
    }
    
    await this.usersService.update(tokenData.userId, { emailVerified: true });
    
    emailTokens.delete(dto.token);
    this.logger.log(`Email verified for user ${tokenData.userId}`);
    
    return { message: 'Email verified successfully' };
  }

  async logout(sessionId: string) {
    await this.sessionsService.revokeSession(sessionId);
    this.logger.log(`Session ${sessionId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const jwtSecret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
      const payload = jwt.verify(refreshToken, jwtSecret) as any;
      
      const user = await this.usersService.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }
      
      const newPayload = { userId: user.id, email: user.email, roles: [] };
      const accessToken = jwt.sign(newPayload, jwtSecret, { expiresIn: JWT_EXPIRY });
      
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateToken(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}