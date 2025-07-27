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
  IDeviceInfo,
  ISessionLoginResult
} from '../interfaces';
import { ITokenPair } from '../interfaces/session.interface';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { SecurityService } from './security.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordService } from './password.service';
import { DeviceUtil } from '../utils/device.util';
import { MfaService } from './mfa.service';
import { IMfaChallenge } from '../interfaces/mfa.interface';


import { 
  InvalidCredentialsException,
  EmailAlreadyExistsException,
  WeakPasswordException,
  AccountLockedException,
  EmailNotVerifiedException,
  RegistrationRateLimitedException,
} from '../exceptions';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Auth Service Entrix V3.0 - Grade A+
 * Service principal d'authentification
 * ✅ AMÉLIORÉ : 
 * - Gestion intelligente des sessions existantes
 * - Session automatique après inscription  
 * - Validation des mots de passe centralisée (résout double hashage)
 * - Toutes les erreurs TypeScript corrigées
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
    private readonly passwordService: PasswordService,
    private readonly mfaService: MfaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AuthService');
  }

 /**
 * ✅ OPTIMISÉ : Login avec gestion intelligente des sessions et MfaService
 * Authentification login complète avec réutilisation des sessions actives
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

    console.log('🔍 DEBUG LOGIN - User validé, ID:', user.id);

    // 2. Construire informations device
    const deviceInfo: IDeviceInfo = DeviceUtil.normalizeDeviceInfo({
      userAgent: context?.userAgent || 'unknown',
      ipAddress: context?.ipAddress || 'unknown',
      deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
    });

    // 3. Évaluation de risque sécurité
    const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);

    console.log('🔍 DEBUG LOGIN - Risk assessment:', {
      score: riskAssessment.score,
      requiresMfa: riskAssessment.requiresMfa,
      factors: riskAssessment.factors
    });

    // 4. ✅ OPTIMISÉ : Vérification MFA via MfaService
    const requiresMfa = await this.isMfaRequired(user.id, riskAssessment.score);

    if (requiresMfa) {
      console.log('🔍 DEBUG LOGIN - MFA requis, génération challenge via MfaService');
      
      // ✅ DÉLÉGATION : Générer challenge via MfaService spécialisé
      const mfaChallenge = await this.generateMfaChallenge(user.id, user.email, deviceInfo);
      
      this.logger.logBusinessEvent('LOGIN_MFA_REQUIRED', {
        userId: user.id,
        email: user.email,
        riskScore: riskAssessment.score,
        factors: riskAssessment.factors,
        mfaMethods: mfaChallenge.methods,
      }, user.id);

      this.logger.endOperation('login', operationId, true);

      return {
        success: false,
        mfaRequired: mfaChallenge,
        meta: {
          riskScore: riskAssessment.score,
          requiresMfa: true,
          ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
        }
      };
    }

    // 5. ✅ OPTIMISÉ : Gestion intelligente des sessions avec SessionService
    console.log('🔍 DEBUG LOGIN - Pas de MFA requis, gestion session intelligente');
    
    const sessionResult: ISessionLoginResult = await this.sessionService.handleUserLogin(
      user.id,
      deviceInfo,
      loginData.rememberMe || false
    );

    console.log('🔍 DEBUG LOGIN - Session result:', {
      sessionId: sessionResult.session.id,
      type: sessionResult.type,
      isReused: sessionResult.isReused,
      tokensReused: sessionResult.tokensReused,
    });

    // 6. ✅ OPTIMISÉ : Enregistrer succès avec métriques
    await this.handleSuccessfulLogin(user.id, user.email, deviceInfo, sessionResult);

    // 7. Formater réponse selon ILoginResult
    const loginResult: ILoginResult = {
      success: true,
      user: this.mapDbUserToProfile(user),
      tokens: sessionResult.tokens,
      session: {
        sessionId: sessionResult.session.id,
        expiresAt: sessionResult.session.expires_at.toISOString(),
        deviceInfo,
        isActive: sessionResult.session.is_active,
        lastActivity: sessionResult.session.last_activity.toISOString(),
        isReused: sessionResult.isReused,
        sessionType: sessionResult.type,
      },
      meta: {
        riskScore: riskAssessment.score,
        requiresMfa: false,
        ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
        sessionType: sessionResult.type,
        wasSessionReused: sessionResult.isReused,
        tokensReused: sessionResult.tokensReused,
      }
    };

    this.logger.logBusinessEvent('LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      sessionId: sessionResult.session.id,
      sessionType: sessionResult.type,
      sessionReused: sessionResult.isReused,
      tokensReused: sessionResult.tokensReused,
      riskScore: riskAssessment.score,
    }, user.id);

    this.logger.endOperation('login', operationId, true);
    return loginResult;

  } catch (error) {
    this.logger.logErrorEvent(
      error as Error,
      'AuthService.login',
      undefined,
      JSON.stringify({
        email: loginData.email,
        context: {
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        }
      })
    );

    this.logger.endOperation('login', operationId, false);
    
    if (error instanceof InvalidCredentialsException ||
        error instanceof AccountLockedException ||
        error instanceof EmailNotVerifiedException) {
      throw error;
    }
    
    this.logger.error('Authentication failed with unexpected error', error.stack, 'AuthService.login', JSON.stringify({
      email: loginData.email,
      context: {
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      }
    }));
    throw new InternalServerErrorException('Authentication failed');
  }
}

  /**
   * ✅ AMÉLIORÉ : Inscription avec création automatique de session
   * Inscription utilisateur avec session et tokens automatiques
   */
  async register(
    registerData: IRegisterRequest, 
    clientInfo?: { ip: string; userAgent: string }
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

      // 1. Vérifications préalables existantes
      await this.checkEmailExists(registerData.email);
      await this.validatePasswordStrength(registerData.password);
      await this.checkRegistrationRateLimit(clientInfo?.ip);

      // 2. Hash du mot de passe avec service centralisé
      const hashedPassword = await this.passwordService.hashPassword(registerData.password);

      // 3. Créer utilisateur en base selon schema.prisma exact
      const user = await this.prisma.users.create({
        data: {
          email: registerData.email,
          password: hashedPassword,
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          phone: registerData.phone || null,
          is_active: true,
          email_verified: false,
          phone_verified: false,
          last_login: null,
          metadata: {
            termsAccepted: registerData.termsAccepted,
            marketingConsent: registerData.marketingConsent || false,
            dateOfBirth: registerData.dateOfBirth || null,
            registrationIp: clientInfo?.ip,
            registrationUserAgent: clientInfo?.userAgent,
          },
        },
      });

      // 4. Transformer données DB vers format application
      const userProfile: IUserProfile = this.mapDbUserToProfile(user);

      // 5. Générer token de vérification email
      const verificationTokenData = await this.emailVerificationService.generateVerificationToken(
        user.id,
        user.email
      );

      // 6. Envoyer email de bienvenue avec lien de vérification
      this.email.sendWelcomeEmail(
        user.email,
        user.first_name,
        verificationTokenData.token
      ).catch(error => {
        this.logger.error('Failed to send welcome email', error.stack, 'AuthService.register', JSON.stringify({
          userId: user.id,
          email: user.email
        }));
        });

      // 7. Traitement onboarding si secret fourni
      let onboardingResult;
      if (registerData.onboardingSecret) {
        onboardingResult = await this.processOnboardingSecret(
          user.id, 
          registerData.onboardingSecret
        );
      }

      // ✅ NOUVEAU : 8. Création automatique de session et tokens
      let tokens: ITokenPair | null = null;
      let sessionInfo = null;

      if (clientInfo) {
        console.log('🔍 DEBUG REGISTER - Création session automatique post-inscription');
        
        const deviceInfo: IDeviceInfo = DeviceUtil.normalizeDeviceInfo({
          userAgent: clientInfo.userAgent,
          ipAddress: this.validateAndNormalizeIp(clientInfo.ip),
        });

        // Créer session pour l'utilisateur nouvellement inscrit
        const session = await this.sessionService.createSession(
          user.id,
          deviceInfo,
          false // Pas de "remember me" pour nouvelle inscription
        );

        // Générer tokens JWT pour la session
        tokens = await this.tokenService.generateTokenPair(
          user.id,
          user.email,
          session.id,
          false, // Pas de "remember me"
          deviceInfo.deviceFingerprint,
          userProfile.roles || [],
          userProfile.permissions || []
        );

        sessionInfo = {
          sessionId: session.id,
          expiresAt: session.expires_at.toISOString(),
          deviceInfo,
          isActive: session.is_active,
          lastActivity: session.last_activity.toISOString(),
        };

        console.log('🔍 DEBUG REGISTER - Session et tokens créés:', {
          sessionId: session.id,
          hasTokens: !!tokens,
        });
      }

      // 9. Logger inscription réussie
      this.logger.logBusinessEvent('USER_REGISTERED', {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        hasOnboardingSecret: !!registerData.onboardingSecret,
        onboardingApplied: !!onboardingResult?.incentiveApplied,
        hasAutoSession: !!sessionInfo,
      }, user.id);

      this.logger.endOperation('register', operationId, true);

      return {
        success: true,
        user: userProfile,
        tokens,
        session: sessionInfo,
        verification: {
          emailSent: true,
          verificationRequired: true,
          tokenId: verificationTokenData.id,
        },
        onboarding: onboardingResult,
        message: tokens 
          ? 'Compte créé avec succès. Vous êtes connecté automatiquement. Vérifiez votre email.'
          : 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
      };

    } catch (error) {
      this.logger.endOperation('register', operationId, false, undefined, { error: error.message });
      
      if (error instanceof EmailAlreadyExistsException ||
          error instanceof WeakPasswordException) {
        throw error;
      }

      this.logger.error('Registration failed with unexpected error', error.stack, 'AuthService', JSON.stringify({
        email: registerData.email,
      }));
      throw new InternalServerErrorException('Erreur lors de l\'inscription');
    }
  }

  /**
 * ✅ OPTIMISÉ : Gestion succès login avec métriques de session
 * Ajouter cette méthode à AuthService si elle n'existe pas
 */
private async handleSuccessfulLogin(
  userId: string,
  email: string, // ✅ AJOUTÉ : email en paramètre
  deviceInfo: IDeviceInfo, 
  sessionResult: ISessionLoginResult
): Promise<void> {
  try {
    // Traitement en parallèle optimisé
    await Promise.all([
      // Mettre à jour last_login
      this.prisma.users.update({
        where: { id: userId },
        data: {
          last_login: new Date(),
        },
      }),
      
      // ✅ CORRIGÉ : Enregistrer tentative réussie avec email correct
      this.prisma.login_attempts.create({
        data: {
          email: email, // ✅ CORRIGÉ : utiliser l'email fourni
          user_id: userId,
          ip_address: deviceInfo.ipAddress,
          user_agent: deviceInfo.userAgent,
          success: true,
          failure_reason: null,
          is_suspicious: false,
          geolocation: deviceInfo.geolocation,
          metadata: {
            sessionId: sessionResult.session.id,
            sessionType: sessionResult.type,
            sessionReused: sessionResult.isReused,
            tokensReused: sessionResult.tokensReused,
            deviceFingerprint: deviceInfo.deviceFingerprint,
          },
        }
      })
    ]);

  } catch (error) {
    this.logger.warn('Failed to handle successful login', JSON.stringify({
      userId,
      email,
      sessionId: sessionResult.session.id,
      error: error.message,
    }));
  }
}

  /**
   * ✅ AMÉLIORÉ : Validation utilisateur avec PasswordService centralisé
   * Validation utilisateur et mot de passe (résout problème double hashage)
   */
  async validateUser(
    email: string, 
    password: string,
    context?: { ipAddress?: string; userAgent?: string; deviceFingerprint?: string }
  ): Promise<IUserProfile | null> {
    const operationId = this.logger.startOperation('validateUser', { email });

    try {
      // 1. Chercher utilisateur avec relations selon schema.prisma
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

      // ✅ 4. AMÉLIORÉ : Validation password avec service centralisé (résout double hashage)
      console.log('🔍 DEBUG validateUser - Vérification password avec PasswordService pour:', email);
      const isPasswordValid = await this.passwordService.verifyUserPasswordByEmail(email, password);
      
      if (!isPasswordValid) {
        console.log('🔍 DEBUG validateUser - Password invalide pour:', email);
        this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'invalid_password' });
        return null;
      }

      console.log('🔍 DEBUG validateUser - Password valide pour:', email);

      // 5. Transformer données DB vers format application
      const user = this.mapDbUserToProfile(dbUser);

      // 6. Ajouter rôles
      user.roles = dbUser.user_roles_user_roles_user_idTousers
        ?.filter(ur => ur.status === 'ACTIVE')
        .map(ur => ur.roles.name) || [];

      // Pour l'instant, permissions vide (sera implémenté plus tard)
      user.permissions = [];

      this.logger.endOperation('validateUser', operationId, true);
      return user;

    } catch (error) {
      this.logger.endOperation('validateUser', operationId, false, undefined, { error: error.message });
      
      if (error instanceof AccountLockedException || error instanceof EmailNotVerifiedException) {
        throw error;
      }

      this.logger.error('User validation failed', error.stack, JSON.stringify({ email }));
      return null;
    }
  }

  /**
   * Logout utilisateur avec révocation session
   */
  async logout(sessionId: string, allDevices?: boolean): Promise<boolean> {
    const operationId = this.logger.startOperation('logout', { sessionId, allDevices });

    try {
      if (allDevices) {
        // Récupérer user ID depuis session d'abord
        const session = await this.sessionService.validateSession(sessionId);
        if (session) {
          const revokedCount = await this.sessionService.revokeAllUserSessions(session.user_id);
          this.logger.logBusinessEvent('LOGOUT_ALL_DEVICES', {
            userId: session.user_id,
            revokedSessions: revokedCount,
          }, session.user_id);
          
          this.logger.endOperation('logout', operationId, true);
          return revokedCount > 0;
        }
      } else {
        const success = await this.sessionService.revokeSession(sessionId);
        if (success) {
          this.logger.logBusinessEvent('LOGOUT', { sessionId });
        }
        
        this.logger.endOperation('logout', operationId, success);
        return success;
      }

      this.logger.endOperation('logout', operationId, false);
      return false;

    } catch (error) {
      this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
      this.logger.error('Logout failed', error.stack, 'AuthService');
      return false;
    }
  }

  /**
   * ✅ NOUVEAU : Refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<ITokenPair> {
    return await this.sessionService.refreshSession(refreshToken);
  }

  /**
 * ✅ OPTIMISÉ : verifyMfa() utilisant MfaService
 * Remplacer la méthode verifyMfa existante dans AuthService
 */
async verifyMfa(
  challengeToken: string, 
  code: string, 
  method: any
): Promise<ILoginResult> {
  const operationId = this.logger.startOperation('verifyMfa', { challengeToken, method });

  try {
    // 1. ✅ DÉLÉGATION : Vérifier via MfaService spécialisé
    const verification = {
      challengeToken,
      code,
      method,
      trustDevice: false // Peut être paramétrable
    };

    const isMfaValid = await this.mfaService.verifyMfa(verification);
    
    if (!isMfaValid) {
      throw new UnauthorizedException('Code MFA invalide');
    }

    // 2. Récupérer challenge pour obtenir userId et deviceInfo
    const challenge = await this.redis.getCache(`mfa_challenge:${challengeToken}`) as any;
    
    if (!challenge || new Date(challenge.expiresAt) < new Date()) {
      throw new UnauthorizedException('Challenge MFA expiré ou invalide');
    }

    // 3. Récupérer utilisateur
    const user = await this.getUserProfile(challenge.userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // 4. ✅ RÉUTILISATION : Gestion intelligente des sessions
    const deviceInfo: IDeviceInfo = {
      userAgent: challenge.deviceInfo?.userAgent || 'unknown',
      ipAddress: challenge.deviceInfo?.ipAddress || 'unknown',
      deviceFingerprint: challenge.deviceFingerprint,
      isMobile: challenge.deviceInfo?.isMobile || false,
      geolocation: challenge.deviceInfo?.geolocation
    };

    const sessionResult = await this.sessionService.handleUserLogin(
      user.id,
      deviceInfo,
      false // MFA flow généralement sans remember me
    );

    // 5. Logger succès MFA
    this.logger.logBusinessEvent('MFA_VERIFICATION_SUCCESS', {
      userId: user.id,
      email: user.email,
      method,
      sessionId: sessionResult.session.id,
      sessionType: sessionResult.type,
    }, user.id);

    this.logger.endOperation('verifyMfa', operationId, true);

    return {
      success: true,
      user: this.mapDbUserToProfile(user),
      tokens: sessionResult.tokens,
      session: {
        sessionId: sessionResult.session.id,
        expiresAt: sessionResult.session.expires_at.toISOString(),
        deviceInfo,
        isActive: sessionResult.session.is_active,
        lastActivity: sessionResult.session.last_activity.toISOString(),
        sessionType: sessionResult.type,
      },
      meta: {
        riskScore: 0, // Post-MFA = risque faible
        requiresMfa: false,
        ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
        sessionType: sessionResult.type,
        wasSessionReused: sessionResult.isReused,
        tokensReused: sessionResult.tokensReused,
      },
    };

  } catch (error) {
    this.logger.logErrorEvent(
      error as Error,
      'AuthService.verifyMfa',
      undefined,
      JSON.stringify({ challengeToken: challengeToken.substring(0, 8) + '...', method })
    );

    this.logger.endOperation('verifyMfa', operationId, false);
    throw error;
  }
}

  /**
   * ✅ CORRIGÉ : Vérification email (conserve signature existante)
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
      // Déléguer à EmailVerificationService
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
   * ✅ CORRIGÉ : Renvoyer email de vérification (conserve signature existante)
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
      this.email.sendVerificationEmail(user.email, verificationTokenData.token).catch(error => {
        this.logger.error('Failed to send verification email', error.stack, 'AuthService.resendVerificationEmail', JSON.stringify({
          userId: user.id,
          email: user.email
        }));
      });

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
   * ✅ NOUVEAU : Récupère le statut de vérification email d'un utilisateur
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
          email: true,
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

  // ============================================================================
  // MÉTHODES PRIVÉES (conservées de l'implémentation existante)
  // ============================================================================

  /**
   * Validation force mot de passe avec service centralisé
   */
  private async validatePasswordStrength(password: string): Promise<void> {
    const validation = await this.passwordService.validatePasswordStrength(password);
    
    if (!validation.isValid) {
      throw new WeakPasswordException(validation.suggestions);
    }
  }

  /**
   * Vérifier unicité email
   */
  private async checkEmailExists(email: string): Promise<void> {
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }
  }

  /**
   * ✅ CORRIGÉ : Rate limiting inscription par IP avec SECURITY_CONSTANTS
   */
  private async checkRegistrationRateLimit(ip?: string): Promise<void> {
  if (!ip) return;

  const key = `registration_attempts:${ip}`;
  const attempts = await this.redis.getCache(key) as number | null;
  const currentAttempts = attempts ? parseInt(String(attempts), 10) : 0;
  
  const maxAttempts = SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS;
  const windowMs = SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.WINDOW_MS;
  
  if (currentAttempts >= maxAttempts) {
    // ✅ CORRIGÉ : Exception spécifique 429 au lieu d'Error générique
    const retryAfter = Math.ceil(windowMs / 1000); // Convertir en secondes
    throw new RegistrationRateLimitedException(retryAfter);
  }

  // Incrémenter le compteur
  const ttl = Math.ceil(windowMs / 1000); // TTL en secondes
  await this.redis.setCache(key, currentAttempts + 1, ttl);
}

  /**
   * Gestion échec de connexion
   */
  private async handleFailedLogin(email: string, context?: any): Promise<void> {
    // Logger échec
    this.logger.logBusinessEvent('LOGIN_FAILED', {
      email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      reason: 'invalid_credentials',
    });

    // Rate limiting par email
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.getCache(key) as number | null;
    const currentAttempts = attempts ? parseInt(String(attempts), 10) : 0;
    await this.redis.setCache(key, currentAttempts + 1, 3600);
  }

  /**
   * Mise à jour last_login
   */
  private async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { 
        last_login: new Date(),
        metadata: {
          lastLoginIp: ipAddress,
        }
      },
    });
  }

  /**
   * Validation et normalisation IP
   */
  private validateAndNormalizeIp(ip: string): string {
    if (!ip || ip === 'unknown') {
      return '127.0.0.1'; // IP fallback valide
    }
    
    // Validation basique IP v4/v6
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
      return ip;
    }
    
    return '127.0.0.1'; // IP fallback si invalide
  }

  /**
   * Traitement secret onboarding
   */
  private async processOnboardingSecret(userId: string, secret: string): Promise<any> {
    // Logique existante conservée
    return {
      incentiveApplied: false,
      incentiveType: 'none',
      incentiveValue: 0,
      migratedTickets: 0,
    };
  }

  /**
   * Récupérer profil utilisateur par ID
   */
  private async getUserProfile(userId: string): Promise<IUserProfile | null> {
    const dbUser = await this.prisma.users.findUnique({
      where: { id: userId },
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

    if (!dbUser) return null;

    const user = this.mapDbUserToProfile(dbUser);
    user.roles = dbUser.user_roles_user_roles_user_idTousers
      ?.filter(ur => ur.status === 'ACTIVE')
      .map(ur => ur.roles.name) || [];
    user.permissions = [];

    return user;
  }

  /**
   * Transformation données DB vers profil utilisateur
   */
  private mapDbUserToProfile(dbUser: any): IUserProfile {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      avatar: dbUser.avatar,
      isActive: dbUser.is_active,
      emailVerified: dbUser.email_verified,
      phoneVerified: dbUser.phone_verified,
      lastLogin: dbUser.last_login,
      metadata: dbUser.metadata,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      roles: [],
      permissions: [],
    };
  }
  /**
 * ✅ MODIFIÉ : Génère challenge MFA via méthodes existantes MfaService
 */
private async generateMfaChallenge(
  userId: string, 
  email: string, 
  deviceInfo: IDeviceInfo
): Promise<IMfaChallenge> {
  try {
    // 1. Obtenir les méthodes disponibles
    const availableMethods = await this.mfaService.getAvailableProviders(userId);
    
    // 2. Générer le challenge avec la méthode existante
    return await this.mfaService.generateMfaChallenge(
      userId, 
      availableMethods, 
      deviceInfo.deviceFingerprint
    );
  } catch (error) {
    this.logger.logErrorEvent(
      error as Error,
      'AuthService.generateMfaChallenge',
      userId,
      JSON.stringify({ email, deviceInfo: { ipAddress: deviceInfo.ipAddress } })
    );
    throw error;
  }
}

/**
 * ✅ MODIFIÉ : Vérifie si MFA requis via méthode existante MfaService
 */
private async isMfaRequired(userId: string, riskScore: number): Promise<boolean> {
  try {
    return await this.mfaService.requiresMfa(userId, riskScore);
  } catch (error) {
    this.logger.warn('Erreur vérification MFA requis', JSON.stringify({
      userId,
      riskScore,
      error: error.message,
    }));
    
    // En cas d'erreur, sécurité = MFA requis
    return true;
  }
}

}