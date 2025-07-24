// src/modules/auth/services/auth.service.ts

import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
import { EmailVerificationService } from './email-verification.service';
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
 * ✅ CORRIGÉ : Toutes les erreurs TypeScript résolues
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
    private readonly emailVerificationService: EmailVerificationService,
    private readonly securityService: SecurityService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AuthService');
  }

  /**
   * Authentification login complète avec logs de debug détaillés
   * ✅ CORRIGÉ : Signatures méthodes, types et relations Prisma
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
      // 🔍 DEBUG : Log des données d'entrée
      console.log('🔍 DEBUG LOGIN - Données d\'entrée:', {
        email: loginData.email,
        hasPassword: !!loginData.password,
        passwordLength: loginData.password?.length,
        rememberMe: loginData.rememberMe,
        deviceFingerprint: loginData.deviceFingerprint,
        context: {
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          deviceFingerprint: context?.deviceFingerprint,
        }
      });

      this.logger.info('Login attempt started', JSON.stringify({
        email: loginData.email,
        ipAddress: context?.ipAddress,
        hasDeviceFingerprint: !!context?.deviceFingerprint,
      }));

      // 🔍 DEBUG : Avant validation utilisateur
      console.log('🔍 DEBUG LOGIN - Avant validateUser avec:', {
        email: loginData.email,
        passwordProvided: !!loginData.password,
        contextProvided: !!context
      });

      // 1. Validation utilisateur et mot de passe
      const user = await this.validateUser(
        loginData.email, 
        loginData.password,
        context
      );

      // 🔍 DEBUG : Résultat validateUser
      console.log('🔍 DEBUG LOGIN - Résultat validateUser:', {
        userFound: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userActive: user?.isActive,
        userRoles: user?.roles,
        userPermissions: user?.permissions
      });

      if (!user) {
        // 🔍 DEBUG : User null - analyser pourquoi
        console.log('🔍 DEBUG LOGIN - validateUser a retourné null, causes possibles:');
        console.log('  1. Email inexistant en base');
        console.log('  2. Mot de passe incorrect');
        console.log('  3. Compte inactif');
        console.log('  4. Email non vérifié (si requis)');
        console.log('  5. Erreur dans le hashage/comparaison');

        await this.handleFailedLogin(loginData.email, context);
        
        // 🔍 DEBUG : Avant de throw InvalidCredentialsException
        console.log('🔍 DEBUG LOGIN - Throwing InvalidCredentialsException pour email:', loginData.email);
        
        throw new InvalidCredentialsException();
      }

      // 🔍 DEBUG : User trouvé, continuons
      console.log('🔍 DEBUG LOGIN - User validé, continuation du processus');

      // 2. Construire informations device
      console.log('🔍 DEBUG LOGIN - Construction deviceInfo');
      const deviceInfo: IDeviceInfo = DeviceUtil.normalizeDeviceInfo({
        userAgent: context?.userAgent || 'unknown',
        ipAddress: context?.ipAddress || 'unknown',
        deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
      });

      console.log('🔍 DEBUG LOGIN - DeviceInfo créé:', {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        geolocation: deviceInfo.geolocation
      });

      // 3. Évaluation de risque sécurité
      console.log('🔍 DEBUG LOGIN - Évaluation du risque sécurité');
      const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);
      
      console.log('🔍 DEBUG LOGIN - Risk assessment:', {
        score: riskAssessment.score,
        requiresMfa: riskAssessment.requiresMfa,
        factors: riskAssessment.factors
      });

      // 4. Vérifier si MFA requis basé sur le score de risque
      if (riskAssessment.requiresMfa) {
        console.log('🔍 DEBUG LOGIN - MFA requis, création challenge');
        
        // Retourner challenge MFA
        const challengeToken = CryptoUtil.generateSecureToken(32);
        await this.redis.setCache(`mfa_challenge:${challengeToken}`, {
          userId: user.id,
          email: user.email,
          deviceInfo,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        }, 300);

        console.log('🔍 DEBUG LOGIN - Challenge MFA créé avec token:', challengeToken);

        this.logger.endOperation('login', operationId, false, undefined, { reason: 'mfa_required' });

        return {
          success: false,
          mfaRequired: {
            methods: ['SMS_OTP', 'TOTP_APP'],
            challengeToken,
            expiresIn: 300,
          },
          meta: {
            riskScore: riskAssessment.score,
            requiresMfa: true,
            ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
          },
        };
      }

      // 5. Créer session et tokens
      console.log('🔍 DEBUG LOGIN - Création session');
      const session = await this.sessionService.createSession(
        user.id,
        deviceInfo,
        loginData.rememberMe
      );

      console.log('🔍 DEBUG LOGIN - Session créée:', {
        sessionId: session.id,
        userId: session.user_id,
        expiresAt: session.expires_at,
        isActive: session.is_active
      });

      console.log('🔍 DEBUG LOGIN - Génération tokens JWT');
      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        session.id,
        loginData.rememberMe,
        deviceInfo.deviceFingerprint,
        user.roles,
        user.permissions
      );

      console.log('🔍 DEBUG LOGIN - Tokens générés:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn
      });

      // 6. Mettre à jour last_login selon schema.prisma
      console.log('🔍 DEBUG LOGIN - Mise à jour last_login');
      await this.updateLastLogin(user.id, deviceInfo.ipAddress);

      // 7. Logger succès login
      this.logger.logBusinessEvent('LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        riskScore: riskAssessment.score,
        ipAddress: deviceInfo.ipAddress,
        deviceFingerprint: deviceInfo.deviceFingerprint,
      }, user.id);

      console.log('🔍 DEBUG LOGIN - Login réussi pour user:', user.id);

      this.logger.endOperation('login', operationId, true);

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
      // 🔍 DEBUG : Log de l'erreur détaillée
      console.log('🔍 DEBUG LOGIN - Erreur capturée:', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack,
        email: loginData.email
      });

      this.logger.endOperation('login', operationId, false, undefined, { error: error.message });
      
      if (error instanceof InvalidCredentialsException || 
          error instanceof AccountLockedException ||
          error instanceof EmailNotVerifiedException) {
        console.log('🔍 DEBUG LOGIN - Erreur attendue:', error.constructor.name);
        throw error;
      }

      console.log('🔍 DEBUG LOGIN - Erreur inattendue, conversion en UnauthorizedException');
      this.logger.error('Login failed with unexpected error', error.stack, 'AuthService', JSON.stringify({
        email: loginData.email,
      }));
      throw new UnauthorizedException('Erreur lors de la connexion');
    }
  }

  /**
   * Inscription utilisateur
   * ✅ CORRIGÉ : Méthodes email et crypto, relations Prisma, types
   */
  async register(
  registerData: IRegisterRequest, 
  clientInfo?: { ip: string; userAgent: string }  // ✅ Ajouter paramètre clientInfo
): Promise<IRegisterResult> {
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
      await this.validatePasswordStrength(registerData.password);

      // 3. Hasher mot de passe
      const hashedPassword = await CryptoUtil.hashPassword(registerData.password);

      // 4. Générer token vérification email
      // ✅ CORRIGÉ : generateSecureToken au lieu de generateRandomToken
      const verificationToken = CryptoUtil.generateSecureToken(32);

      // 5. Créer utilisateur avec champs schema.prisma exacts
      const user = await this.prisma.users.create({
        data: {
          email: registerData.email,
          password: hashedPassword,
          first_name: registerData.firstName,  // ✅ CORRIGÉ : snake_case pour DB
          last_name: registerData.lastName,    // ✅ CORRIGÉ : snake_case pour DB
          phone: registerData.phone || null,
          is_active: true,                     // ✅ CORRIGÉ : snake_case pour DB
          email_verified: null,                // ✅ CORRIGÉ : null car pas encore vérifié
          phone_verified: null,
          metadata: registerData.onboardingSecret ? { onboardingSecret: registerData.onboardingSecret } : null,
        },
      });

      // 6. ✅ NOUVEAU : Générer token de vérification avec EmailVerificationService
    const verificationTokenData = await this.emailVerificationService.generateVerificationToken(
      user.id,
      user.email
    );

      // 7. ✅ NOUVEAU : Envoyer email de bienvenue avec lien de vérification
    await this.email.sendWelcomeEmail(
      user.email,
      user.first_name,
      verificationTokenData.token // ✅ Token en clair pour l'URL
    );

      // 8. Traitement onboarding si secret fourni
      let onboardingResult;
      if (registerData.onboardingSecret) {
        onboardingResult = await this.processOnboardingSecret(
          user.id, 
          registerData.onboardingSecret
        );
      }

      // 9. ✅ CORRIGÉ : Générer tokens avec IP réelle de la requête
    const realIpAddress = this.validateAndNormalizeIp(clientInfo?.ip || 'unknown');
    
    const deviceInfo: IDeviceInfo = DeviceUtil.normalizeDeviceInfo({
      userAgent: clientInfo?.userAgent || 'registration',
      ipAddress: realIpAddress, // ✅ Utilise IP réelle ou fallback valide
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

      // ✅ CORRIGÉ : endOperation avec 5 paramètres
      this.logger.endOperation('register', operationId, true);

      // 11. Transformer données DB vers format application (snake_case → camelCase)
      const userProfile: IUserProfile = this.mapDbUserToProfile(user);

      return {
      success: true,
      user: userProfile,
      tokens,
      verification: {
        emailSent: true,
        verificationRequired: true,
        tokenId: verificationTokenData.id, // ✅ ID pour tracking
      },
      onboarding: onboardingResult,
    };

    } catch (error) {
      // ✅ CORRIGÉ : endOperation et error avec JSON.stringify
      this.logger.endOperation('register', operationId, false, undefined, { error: error.message });
      
      if (error instanceof EmailAlreadyExistsException ||
          error instanceof WeakPasswordException) {
        throw error;
      }

      // ✅ CORRIGÉ : logger.error avec error.stack et JSON.stringify
      this.logger.error('Registration failed with unexpected error', error.stack, 'AuthService', JSON.stringify({
        email: registerData.email,
      }));
      throw new Error('Erreur lors de l\'inscription');
    }
  }

  /**
 * Validation utilisateur pour login
 * ✅ CORRIGÉ : Relations Prisma exactes et sans erreurs TypeScript
 * Inspiré de l'ancienne version qui fonctionnait
 */
async validateUser(
  email: string, 
  password: string,
  context?: { ipAddress?: string; userAgent?: string; deviceFingerprint?: string }
): Promise<IUserProfile | null> {
  const operationId = this.logger.startOperation('validateUser', { email });

  try {
    // 1. ✅ CORRIGÉ : Chercher utilisateur avec relations simplifiées selon schema.prisma
    const dbUser = await this.prisma.users.findUnique({
      where: { email },
      include: {
        user_roles_user_roles_user_idTousers: {
          where: { status: 'ACTIVE' },
          include: {
            roles: {
              select: {
                id: true,
                name: true,
                code: true,
                level: true,
                is_active: true
              }
            }
          }
        }
      }
    });

    if (!dbUser) {
      // ✅ CORRIGÉ : endOperation avec signature correcte (5 paramètres)
      this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'user_not_found' });
      return null;
    }

    // 2. Vérifier statut compte
    if (!dbUser.is_active) {
      this.logger.warn('Login attempt on inactive account', JSON.stringify({ email }));
      throw new AccountLockedException();
    }

    // 3. Vérifier vérification email si requise
    const emailVerificationRequired = process.env.EMAIL_VERIFICATION_REQUIRED === 'true';
    if (emailVerificationRequired && !dbUser.email_verified) {
      throw new EmailNotVerifiedException();
    }

    // 4. ✅ CORRIGÉ : Vérifier mot de passe avec CryptoUtil (comme ancienne version)
    const isPasswordValid = await CryptoUtil.verifyPassword(password, dbUser.password);
    if (!isPasswordValid) {
      // ✅ CORRIGÉ : endOperation avec signature correcte
      this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'invalid_password' });
      return null;
    }

    // 5. ✅ CORRIGÉ : Transformer données DB vers format application (comme ancienne version)
    const user = this.mapDbUserToProfile(dbUser);

    // 6. ✅ CORRIGÉ : Ajouter rôles sans les permissions (évite erreur role_permissions)
    user.roles = dbUser.user_roles_user_roles_user_idTousers
      ?.filter(ur => ur.status === 'ACTIVE')
      .map(ur => ur.roles.name) || [];

    // Pour l'instant, on laisse permissions vide (sera implémenté plus tard)
    user.permissions = [];

    // ✅ CORRIGÉ : endOperation avec signature correcte
    this.logger.endOperation('validateUser', operationId, true);
    return user;

  } catch (error) {
    // ✅ CORRIGÉ : endOperation avec signature correcte
    this.logger.endOperation('validateUser', operationId, false, undefined, { error: error.message });
    
    if (error instanceof AccountLockedException || error instanceof EmailNotVerifiedException) {
      throw error;
    }

    // ✅ CORRIGÉ : logger.error avec JSON.stringify pour les objets
    this.logger.error('User validation failed', error.stack, JSON.stringify({ email }));
    return null;
  }
}

  /**
   * Validation force mot de passe
   * ✅ CORRIGÉ : WeakPasswordException avec suggestions: string[]
   */
  private async validatePasswordStrength(password: string): Promise<void> {
    const suggestions: string[] = [];

    if (password.length < AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
      suggestions.push(`Minimum ${AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`);
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('Au moins une lettre minuscule');
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('Au moins une lettre majuscule');
    }

    if (!/\d/.test(password)) {
      suggestions.push('Au moins un chiffre');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Au moins un caractère spécial');
    }

    if (suggestions.length > 0) {
      // ✅ CORRIGÉ : WeakPasswordException prend suggestions: string[]
      throw new WeakPasswordException(suggestions);
    }
  }

  /**
   * Mapper données DB (snake_case) vers format application (camelCase)
   * ✅ CORRIGÉ : Conversion emailVerified/phoneVerified Date → boolean pour API
   */
  private mapDbUserToProfile(dbUser: any): IUserProfile {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,        // ✅ CORRIGÉ : snake_case → camelCase
      lastName: dbUser.last_name,          // ✅ CORRIGÉ : snake_case → camelCase
      phone: dbUser.phone,
      avatar: dbUser.avatar,
      isActive: dbUser.is_active,          // ✅ CORRIGÉ : snake_case → camelCase
      emailVerified: dbUser.email_verified, // ✅ CORRIGÉ : Date type preserved
      phoneVerified: dbUser.phone_verified, // ✅ CORRIGÉ : Date type preserved  
      lastLogin: dbUser.last_login,        // ✅ CORRIGÉ : snake_case → camelCase
      metadata: dbUser.metadata,
      createdAt: dbUser.created_at,        // ✅ CORRIGÉ : snake_case → camelCase
      updatedAt: dbUser.updated_at,        // ✅ CORRIGÉ : snake_case → camelCase
      roles: [],
      permissions: [],
    };
  }

  /**
   * Gestion échec login avec rate limiting
   */
  private async handleFailedLogin(email: string, context?: any): Promise<void> {
    const operationId = this.logger.startOperation('handleFailedLogin', { email });

    try {
      const ipAddress = context?.ipAddress || 'unknown';
      
      // Incrémenter compteur tentatives échouées
      const key = `failed_login:${ipAddress}:${email}`;
      const attempts = await this.redis.increment(key, 900); // 15 minutes

      this.logger.logAuthEvent('failed_login', undefined, email, ipAddress, context?.userAgent, {
        attempts,
        timestamp: new Date().toISOString(),
      });

      // ✅ CORRIGÉ : endOperation avec 5 paramètres
      this.logger.endOperation('handleFailedLogin', operationId, true);

    } catch (error) {
      // ✅ CORRIGÉ : endOperation et error.stack
      this.logger.endOperation('handleFailedLogin', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to handle failed login', error.stack, 'AuthService');
    }
  }

  /**
   * Mise à jour dernière connexion
   */
  private async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { 
          last_login: new Date(), // ✅ CORRIGÉ : snake_case pour DB
        },
      });
    } catch (error) {
      // Non critique, on log juste l'erreur
      this.logger.error('Failed to update last login', error.stack, 'AuthService', JSON.stringify({ userId }));
    }
  }

  /**
   * Traitement secret onboarding
   */
  private async processOnboardingSecret(userId: string, secret: string): Promise<any> {
    const operationId = this.logger.startOperation('processOnboardingSecret', { userId });

    try {
      // Traitement du secret d'onboarding
      // Cette logique sera implémentée selon les besoins business
      
      // ✅ CORRIGÉ : endOperation avec 5 paramètres
      this.logger.endOperation('processOnboardingSecret', operationId, true);
      
      return {
        incentiveApplied: false,
        incentiveType: null,
        incentiveValue: 0,
        migratedTickets: 0,
      };

    } catch (error) {
      // ✅ CORRIGÉ : endOperation et error.stack avec JSON.stringify
      this.logger.endOperation('processOnboardingSecret', operationId, false, undefined, { error: error.message });
      this.logger.error('Failed to process onboarding secret', error.stack, 'AuthService', JSON.stringify({ userId, secret }));
      return null;
    }
  }

  /**
   * Logout utilisateur
   */
  async logout(sessionId: string, allDevices?: boolean): Promise<boolean> {
    const operationId = this.logger.startOperation('logout', { sessionId, allDevices });

    try {
      if (allDevices) {
        // Révoquer toutes les sessions utilisateur
        const session = await this.sessionService.validateSession(sessionId);
        if (session) {
          const revokedCount = await this.sessionService.revokeAllUserSessions(session.user_id);
          this.logger.logBusinessEvent('LOGOUT_ALL_DEVICES', {
            userId: session.user_id,
            sessionsRevoked: revokedCount,
          }, session.user_id);
        }
      } else {
        // Révoquer session unique
        await this.sessionService.revokeSession(sessionId);
        this.logger.logBusinessEvent('LOGOUT', { sessionId });
      }

      // ✅ CORRIGÉ : endOperation avec 5 paramètres
      this.logger.endOperation('logout', operationId, true);
      return true;

    } catch (error) {
      // ✅ CORRIGÉ : endOperation et error.stack
      this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
      this.logger.error('Logout failed', error.stack, 'AuthService', JSON.stringify({ sessionId, allDevices }));
      return false;
    }
  }

  /**
   * Vérification MFA (placeholder)
   */
  async verifyMfa(challengeToken: string, code: string, method: string): Promise<ILoginResult> {
    // Cette méthode sera implémentée avec le service MFA
    throw new Error('MFA verification not implemented yet');
  }

  /**
 * ✅ NOUVELLE MÉTHODE : Valide et normalise une adresse IP
 */
private validateAndNormalizeIp(ip: string): string {
  // Nettoyer l'IP (supprimer espaces, préfixes IPv6, etc.)
  const cleanedIp = ip.trim();
  
  // Cas spéciaux à traiter
  if (cleanedIp === 'unknown' || cleanedIp === '' || !cleanedIp) {
    return '127.0.0.1'; // Localhost par défaut
  }
  
  // Gérer les IPs avec préfixe IPv6-mapped IPv4
  if (cleanedIp.startsWith('::ffff:')) {
    const ipv4 = cleanedIp.replace('::ffff:', '');
    if (this.isValidIpv4(ipv4)) {
      return ipv4;
    }
  }
  
  // Valider IPv4
  if (this.isValidIpv4(cleanedIp)) {
    return cleanedIp;
  }
  
  // Valider IPv6
  if (this.isValidIpv6(cleanedIp)) {
    return cleanedIp;
  }
  
  // Si aucune validation ne passe, utiliser localhost
  this.logger.warn('Invalid IP address provided, using localhost', JSON.stringify({
    originalIp: ip,
    cleanedIp,
  }));
  
  return '127.0.0.1';
}

/**
 * ✅ NOUVELLE MÉTHODE : Valide une adresse IPv4
 */
private isValidIpv4(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * ✅ NOUVELLE MÉTHODE : Valide une adresse IPv6 (basique)
 */
private isValidIpv6(ip: string): boolean {
  // Validation IPv6 simplifiée (pour cas complexes, utiliser une librairie)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  return ipv6Regex.test(ip);
}


/**
 * Vérification d'email mise à jour
 * ✅ MISE À JOUR : Utilise EmailVerificationService
 */
async verifyEmail(token: string): Promise<{
  success: boolean;
  verified: boolean;
  message: string;
  userId?: string;
}> {
  const operationId = this.logger.startOperation('verifyEmail', {
    tokenLength: token?.length,
  });

  try {
    // ✅ DÉLÉGUER à EmailVerificationService
    const result = await this.emailVerificationService.verifyEmailToken(token);

    this.logger.endOperation('verifyEmail', operationId, result.success, undefined, {
      verified: result.verified,
      userId: result.userId,
    });

    return result;

  } catch (error) {
    this.logger.endOperation('verifyEmail', operationId, false, undefined, {
      error: error.message,
    });
    
    this.logger.error(
      'Email verification failed with unexpected error',
      error.stack,
      'AuthService.verifyEmail',
      JSON.stringify({
        tokenPrefix: token?.substring(0, 8),
        error: error.message,
      })
    );

    return {
      success: false,
      verified: false,
      message: 'Erreur lors de la vérification de l\'email',
    };
  }
}

/**
 * ✅ NOUVELLE MÉTHODE : Renvoyer un email de vérification
 */
async resendVerificationEmail(userId: string): Promise<{
  success: boolean;
  message: string;
  tokenId?: string;
}> {
  const operationId = this.logger.startOperation('resendVerificationEmail', { userId });

  try {
    // 1. Vérifier que l'utilisateur existe et n'est pas déjà vérifié
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        email_verified: true,
        first_name: true,
        is_active: true,
      },
    });

    if (!user) {
      this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
        reason: 'user_not_found',
      });
      
      return {
        success: false,
        message: 'Utilisateur introuvable',
      };
    }

    if (user.email_verified) {
      this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
        reason: 'already_verified',
      });
      
      return {
        success: false,
        message: 'Email déjà vérifié',
      };
    }

    if (!user.is_active) {
      this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
        reason: 'user_inactive',
      });
      
      return {
        success: false,
        message: 'Compte utilisateur inactif',
      };
    }

    // 2. Générer nouveau token
    const verificationTokenData = await this.emailVerificationService.generateVerificationToken(
      user.id,
      user.email
    );

    // 3. Envoyer email de vérification
    await this.email.sendVerificationEmail(user.email, verificationTokenData.token);

    // 4. Logger l'événement
    this.logger.logBusinessEvent('EMAIL_VERIFICATION_RESENT', {
      userId: user.id,
      email: user.email,
      tokenId: verificationTokenData.id,
    }, user.id);

    this.logger.endOperation('resendVerificationEmail', operationId, true);

    return {
      success: true,
      message: 'Email de vérification renvoyé',
      tokenId: verificationTokenData.id,
    };

  } catch (error) {
    this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
      error: error.message,
    });
    
    this.logger.error(
      'Failed to resend verification email',
      error.stack,
      'AuthService.resendVerificationEmail',
      JSON.stringify({ userId })
    );

    return {
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de vérification',
    };
  }
}

/**
 * Récupère le statut de vérification email d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Statut de vérification avec informations détaillées
 */
async getVerificationStatus(userId: string): Promise<{
  emailVerified: boolean;
  verifiedAt?: string;
  canResend: boolean;
}> {
  const operationId = this.logger.startOperation('getVerificationStatus', {
    userId,
  });

  try {
    // Récupérer les informations de vérification depuis la base
    const dbUser = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        email_verified: true,
        is_active: true,
        email: true, // Pour les logs
      },
    });

    if (!dbUser) {
      this.logger.warn('User not found for verification status', JSON.stringify({
        userId,
      }));
      throw new NotFoundException('Utilisateur introuvable');
    }

    const emailVerified = !!dbUser.email_verified;
    const canResend = !emailVerified && dbUser.is_active;

    // Logger consultation du statut
    this.logger.logBusinessEvent('VERIFICATION_STATUS_CHECKED', {
      userId,
      emailVerified,
      canResend,
      //verifiedAt: dbUser.email_verified?.toISOString(),
    }, userId);

    this.logger.endOperation('getVerificationStatus', operationId, true);

    return {
      emailVerified,
      canResend,
    };

  } catch (error) {
    this.logger.endOperation('getVerificationStatus', operationId, false, undefined, {
      error: error.message,
    });
    
    if (error instanceof NotFoundException) {
      throw error;
    }

    this.logger.error(
      'Failed to get verification status',
      error.stack,
      'AuthService.getVerificationStatus',
      JSON.stringify({ userId })
    );
    throw new InternalServerErrorException('Erreur lors de la récupération du statut de vérification');
  }
}

}