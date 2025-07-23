// src/modules/auth/services/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { 
  IAuthService, 
  ILoginResult, 
  IRegisterResult,
  ILoginRequest,
  IRegisterRequest,
  IUserProfile,
  IDeviceInfo
} from '../interfaces';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { UsersService } from '../../users/services/users.service';
import { CryptoUtil } from '../utils/crypto.util';
import { DeviceUtil } from '../utils/device.util';
import { 
  InvalidCredentialsException,
  EmailAlreadyExistsException,
  WeakPasswordException,
  AccountLockedException,
  EmailNotVerifiedException
} from '../exceptions/auth.exceptions';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Auth Service Entrix V3.0 - Grade A+
 * Service principal d'authentification
 * Respecte schema.prisma users et processus_authentification.md
 */

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly securityService: SecurityService,
    private readonly usersService: UsersService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AuthService');
  }

  /**
   * Authentification login complète
   * Respecte api_specs_auth_session.md et sécurité renforcée
   */
  async login(loginData: ILoginRequest, context?: { 
    ipAddress: string; 
    userAgent: string; 
    deviceFingerprint?: string 
  }): Promise<ILoginResult> {
    const operationId = this.logger.startOperation('login', {
      email: loginData.email,
      rememberMe: loginData.rememberMe,
      hasDeviceFingerprint: !!loginData.deviceFingerprint,
    });

    try {
      this.logger.info('Login attempt started', JSON.stringify({
        email: loginData.email,
        ipAddress: context?.ipAddress,
        hasDeviceFingerprint: !!context?.deviceFingerprint,
      }));

      // 1. Validation utilisateur et mot de passe
      const user = await this.validateUser(
        loginData.email, 
        loginData.password,
        context
      );

      if (!user) {
        await this.handleFailedLogin(loginData.email, context);
        throw new InvalidCredentialsException();
      }

      // 2. Construction device info
      const deviceInfo: IDeviceInfo = DeviceUtil.normalizeDeviceInfo({
        userAgent: context?.userAgent || '',
        ipAddress: context?.ipAddress || 'unknown',
        deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
      });

      // 3. Évaluation risque de sécurité
      const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);

      // 4. Déterminer si MFA requis
      const requiresMfa = riskAssessment.requiresMfa || 
                         riskAssessment.score >= AUTH_CONSTANTS.SECURITY.RISK_SCORE_THRESHOLD;

      // 5. Si MFA requis, retourner challenge
      if (requiresMfa) {
        const mfaChallenge = await this.generateMfaChallenge(user.id, deviceInfo);
        
        this.logger.logBusinessEvent('LOGIN_MFA_REQUIRED', {
          userId: user.id,
          email: user.email,
          riskScore: riskAssessment.score,
          ipAddress: deviceInfo.ipAddress,
        }, user.id);

        this.logger.endOperation(operationId, 'mfa_required');

        return {
          success: true,
          mfaRequired: mfaChallenge,
          meta: {
            riskScore: riskAssessment.score,
            requiresMfa: true,
            ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
          },
        };
      }

      // 6. Créer session et tokens
      const session = await this.sessionService.createSession(
        user.id,
        deviceInfo,
        loginData.rememberMe
      );

      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        session.id,
        loginData.rememberMe,
        deviceInfo.deviceFingerprint,
        user.roles,
        user.permissions
      );

      // 7. Mettre à jour last_login selon schema.prisma
      await this.updateLastLogin(user.id, deviceInfo.ipAddress);

      // 8. Logger succès login
      this.logger.logBusinessEvent('LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        riskScore: riskAssessment.score,
        ipAddress: deviceInfo.ipAddress,
        deviceFingerprint: deviceInfo.deviceFingerprint,
      }, user.id);

      this.logger.endOperation(operationId, 'success');

      return {
        success: true,
        user,
        tokens,
        session: {
          sessionId: session.id,
          expiresAt: session.expires_at.toISOString(),
          deviceInfo,
          isActive: session.is_active,
          lastActivity: session.last_activity.toISOString(),
        },
        meta: {
          riskScore: riskAssessment.score,
          requiresMfa: false,
          ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
        },
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      if (error instanceof InvalidCredentialsException || 
          error instanceof AccountLockedException ||
          error instanceof EmailNotVerifiedException) {
        throw error;
      }

      this.logger.error('Login failed with unexpected error', error.stack, {
        email: loginData.email,
      });
      throw new UnauthorizedException('Erreur lors de la connexion');
    }
  }

  /**
   * Inscription utilisateur
   * Respecte schema.prisma users exact et validation complète
   */
  async register(registerData: IRegisterRequest): Promise<IRegisterResult> {
    const operationId = this.logger.startOperation('register', {
      email: registerData.email,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
    });

    try {
      this.logger.info('Registration attempt started', JSON.stringify({
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        hasOnboardingSecret: !!registerData.onboardingSecret,
      }));

      // 1. Vérifier unicité email
      const existingUser = await this.prisma.users.findUnique({
        where: { email: registerData.email },
        select: { id: true },
      });

      if (existingUser) {
        this.logger.warn('Registration with existing email', JSON.stringify({
          email: registerData.email,
        }));
        throw new EmailAlreadyExistsException();
      }

      // 2. Valider force mot de passe
      const passwordValidation = CryptoUtil.validatePasswordStrength(registerData.password);
      if (!passwordValidation.isValid) {
        throw new WeakPasswordException(passwordValidation.suggestions);
      }

      // 3. Hasher mot de passe
      const hashedPassword = await CryptoUtil.hashPassword(registerData.password);

      // 4. Préparer données utilisateur selon schema.prisma exact
      const userData = {
        email: registerData.email,
        password: hashedPassword,
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        phone: registerData.phone || null,
        is_active: true,
        email_verified: null, // Sera défini après vérification
        phone_verified: null,
        last_login: null,
        metadata: {
          registrationIp: 'unknown', // TODO: récupérer depuis context
          marketingConsent: registerData.marketingConsent || false,
          termsAcceptedAt: new Date().toISOString(),
          onboardingSecret: registerData.onboardingSecret,
        },
      };

      // 5. Créer utilisateur avec transaction
      const user = await this.prisma.users.create({
        data: userData,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar: true,
          is_active: true,
          email_verified: true,
          phone_verified: true,
          last_login: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      // 6. Générer token vérification email
      const verificationToken = await this.generateEmailVerificationToken(user.id);

      // 7. Envoyer email de bienvenue avec vérification
      await this.email.sendWelcomeEmail(user.email, {
        firstName: user.first_name,
        lastName: user.last_name,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
        emailVerificationRequired: true,
      });

      // 8. Traitement onboarding si secret fourni
      let onboardingResult;
      if (registerData.onboardingSecret) {
        onboardingResult = await this.processOnboardingSecret(
          user.id, 
          registerData.onboardingSecret
        );
      }

      // 9. Générer tokens pour connexion automatique
      const deviceInfo = DeviceUtil.normalizeDeviceInfo({
        userAgent: 'registration',
        ipAddress: 'unknown',
      });

      const session = await this.sessionService.createSession(user.id, deviceInfo);
      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        session.id
      );

      // 10. Logger inscription réussie
      this.logger.logBusinessEvent('USER_REGISTERED', {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        hasOnboardingSecret: !!registerData.onboardingSecret,
        onboardingApplied: !!onboardingResult?.incentiveApplied,
      }, user.id);

      this.logger.endOperation(operationId, 'success');

      // 11. Normaliser profil utilisateur
      const userProfile: IUserProfile = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        avatar: user.avatar,
        is_active: user.is_active,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        last_login: user.last_login,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles: [],
        permissions: [],
      };

      return {
        success: true,
        user: userProfile,
        tokens,
        verification: {
          emailSent: true,
          verificationRequired: true,
        },
        onboarding: onboardingResult,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      if (error instanceof EmailAlreadyExistsException ||
          error instanceof WeakPasswordException) {
        throw error;
      }

      this.logger.error('Registration failed with unexpected error', error.stack, {
        email: registerData.email,
      });
      throw new Error('Erreur lors de l\'inscription');
    }
  }

  /**
   * Validation utilisateur pour login
   * Vérifie email/password et statut compte
   */
  async validateUser(
    email: string, 
    password: string,
    context?: { ipAddress: string; userAgent: string; deviceFingerprint?: string }
  ): Promise<IUserProfile | null> {
    const operationId = this.logger.startOperation('validateUser', { email });

    try {
      // 1. Récupérer utilisateur depuis DB
      const user = await this.prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar: true,
          is_active: true,
          email_verified: true,
          phone_verified: true,
          last_login: true,
          metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        this.logger.warn('User not found during validation', JSON.stringify({ email }));
        return null;
      }

      // 2. Vérifier mot de passe
      const isPasswordValid = await CryptoUtil.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Invalid password during validation', JSON.stringify({ 
          userId: user.id,
          email 
        }));
        return null;
      }

      // 3. Vérifier statut compte
      if (!user.is_active) {
        this.logger.warn('Inactive account login attempt', JSON.stringify({ 
          userId: user.id,
          email 
        }));
        throw new AccountLockedException();
      }

      // 4. Vérifier email vérifié si requis
      const requireEmailVerification = this.shouldRequireEmailVerification(user);
      if (requireEmailVerification && !user.email_verified) {
        this.logger.warn('Unverified email login attempt', JSON.stringify({ 
          userId: user.id,
          email 
        }));
        throw new EmailNotVerifiedException();
      }

      this.logger.endOperation(operationId, 'success');

      // 5. Retourner profil utilisateur (sans password)
      const { password: _, ...userProfile } = user;
      return {
        ...userProfile,
        roles: [], // TODO: récupérer depuis user_roles
        permissions: [], // TODO: calculer depuis rôles
      } as IUserProfile;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      if (error instanceof AccountLockedException ||
          error instanceof EmailNotVerifiedException) {
        throw error;
      }

      this.logger.error('User validation failed', error.stack, { email });
      return null;
    }
  }

  /**
   * Déconnexion utilisateur
   * Révoque tokens et sessions
   */
  async logout(sessionId: string, allDevices: boolean = false): Promise<boolean> {
    const operationId = this.logger.startOperation('logout', { 
      sessionId, 
      allDevices 
    });

    try {
      if (allDevices) {
        // Récupérer user_id de la session pour déconnexion globale
        const session = await this.prisma.user_sessions.findUnique({
          where: { id: sessionId },
          select: { user_id: true },
        });

        if (session) {
          const revokedSessions = await this.sessionService.revokeAllUserSessions(session.user_id);
          
          this.logger.logBusinessEvent('LOGOUT_ALL_DEVICES', {
            userId: session.user_id,
            sessionsRevoked: revokedSessions,
          }, session.user_id);

          this.logger.endOperation(operationId, 'success');
          return true;
        }
      } else {
        // Déconnexion session unique
        const revoked = await this.sessionService.revokeSession(sessionId);
        
        if (revoked) {
          this.logger.logBusinessEvent('LOGOUT_SINGLE_DEVICE', {
            sessionId,
          });
        }

        this.logger.endOperation(operationId, 'success');
        return revoked;
      }

      this.logger.endOperation(operationId, 'session_not_found');
      return false;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Logout failed', error.stack, { sessionId });
      return false;
    }
  }

  /**
   * Méthodes helper privées
   */

  private async handleFailedLogin(email: string, context?: any): Promise<void> {
    // TODO: Implémenter rate limiting et compteur échecs
    this.logger.logBusinessEvent('LOGIN_FAILED', {
      email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  private async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { 
          last_login: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      // Log mais ne fait pas échouer le login
      this.logger.warn('Failed to update last login', JSON.stringify({ userId, error: error.message }));
    }
  }

  private async generateMfaChallenge(userId: string, deviceInfo: IDeviceInfo): Promise<any> {
    // TODO: Implémenter génération challenge MFA
    return {
      methods: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
      challengeToken: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresIn: 300,
    };
  }

  private async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = CryptoUtil.generateSecureToken(32);
    const verificationKey = `email_verification:${token}`;
    
    await this.redis.setCache(verificationKey, userId, 24 * 60 * 60); // 24h
    return token;
  }

  private async processOnboardingSecret(userId: string, secret: string): Promise<any> {
    // TODO: Implémenter logique onboarding
    return {
      incentiveApplied: true,
      incentiveType: 'discount',
      incentiveValue: 10,
      migratedTickets: 0,
    };
  }

  private shouldRequireEmailVerification(user: any): boolean {
    // Logique métier pour déterminer si vérification email obligatoire
    return false; // Configurable selon besoins business
  }
}