// src/shared/email/email-diagnostics.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import { promisify } from 'util';
import { LoggerService } from '../logger/logger.service';

interface EmailDiagnosticResult {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    configuration: DiagnosticCheck;
    connectivity: DiagnosticCheck;
    authentication: DiagnosticCheck;
    dnsResolution: DiagnosticCheck;
    testEmail: DiagnosticCheck;
  };
  recommendations: string[];
  summary: string;
}

interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

/**
 * Service de diagnostic email Entrix V3.0
 * Aide à identifier et résoudre les problèmes SMTP
 */
@Injectable()
export class EmailDiagnosticsService {
  private readonly logger: LoggerService;
  private readonly resolveMx = promisify(dns.resolveMx);

  constructor(
    private readonly config: ConfigService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EmailDiagnostics');
  }

  /**
   * Diagnostic complet du service email
   */
  async runFullDiagnostic(): Promise<EmailDiagnosticResult> {
    const operationId = this.logger.startOperation('runFullDiagnostic');

    try {
      const checks = {
        configuration: await this.checkConfiguration(),
        connectivity: await this.checkConnectivity(),
        authentication: await this.checkAuthentication(),
        dnsResolution: await this.checkDnsResolution(),
        testEmail: await this.checkTestEmail()
      };

      const recommendations = this.generateRecommendations(checks);
      const summary = this.generateSummary(checks);
      const status = this.determineOverallStatus(checks);

      this.logger.endOperation('runFullDiagnostic', operationId, true);

      return {
        status,
        checks,
        recommendations,
        summary
      };

    } catch (error) {
      this.logger.endOperation('runFullDiagnostic', operationId, false);
      throw error;
    }
  }

  /**
   * Vérification de la configuration SMTP
   */
  private async checkConfiguration(): Promise<DiagnosticCheck> {
    const startTime = Date.now();

    try {
      const requiredSettings = [
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USER',
        'SMTP_PASSWORD',
        'EMAIL_FROM'
      ];

      const missingSettings: string[] = [];
      const settings: any = {};

      for (const setting of requiredSettings) {
        const value = this.config.get<string>(setting);
        if (!value) {
          missingSettings.push(setting);
        } else {
          settings[setting] = setting.includes('PASSWORD') ? '***' : value;
        }
      }

      if (missingSettings.length > 0) {
        return {
          name: 'Configuration SMTP',
          status: 'fail',
          message: `Paramètres manquants: ${missingSettings.join(', ')}`,
          details: { missingSettings, currentSettings: settings },
          duration: Date.now() - startTime
        };
      }

      // Vérifications spécifiques
      const port = parseInt(this.config.get<string>('SMTP_PORT', '587'));
      const secure = this.config.get<boolean>('SMTP_SECURE', false);
      
      const warnings: string[] = [];
      
      if (port === 25) {
        warnings.push('Port 25 souvent bloqué par les FAI');
      }
      
      if (port === 465 && !secure) {
        warnings.push('Port 465 nécessite secure: true');
      }
      
      if (port === 587 && secure) {
        warnings.push('Port 587 utilise généralement STARTTLS, pas SSL direct');
      }

      return {
        name: 'Configuration SMTP',
        status: warnings.length > 0 ? 'warning' : 'pass',
        message: warnings.length > 0 ? `Avertissements: ${warnings.join(', ')}` : 'Configuration complète',
        details: { settings, warnings },
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Configuration SMTP',
        status: 'fail',
        message: `Erreur lors de la vérification: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test de connectivité au serveur SMTP
   */
  private async checkConnectivity(): Promise<DiagnosticCheck> {
    const startTime = Date.now();

    try {
      const transporter = this.createDiagnosticTransporter();
      
      // Test de connexion avec timeout
      const connected = await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de connexion (10s)')), 10000)
        )
      ]);

      return {
        name: 'Connectivité SMTP',
        status: 'pass',
        message: 'Connexion au serveur SMTP réussie',
        details: { 
          host: this.config.get<string>('SMTP_HOST'),
          port: this.config.get<string>('SMTP_PORT'),
          connected: true
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Connectivité SMTP',
        status: 'fail',
        message: `Impossible de se connecter: ${error.message}`,
        details: this.analyzeConnectionError(error.message),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test d'authentification SMTP
   */
  private async checkAuthentication(): Promise<DiagnosticCheck> {
    const startTime = Date.now();

    try {
      const transporter = this.createDiagnosticTransporter();
      
      // Vérifier l'authentification
      await transporter.verify();

      return {
        name: 'Authentification SMTP',
        status: 'pass',
        message: 'Authentification réussie',
        details: {
          user: this.config.get<string>('SMTP_USER'),
          authMethod: 'LOGIN'
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorAnalysis = this.analyzeAuthError(error.message);
      
      return {
        name: 'Authentification SMTP',
        status: 'fail',
        message: `Échec d'authentification: ${error.message}`,
        details: errorAnalysis,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Vérification de la résolution DNS
   */
  private async checkDnsResolution(): Promise<DiagnosticCheck> {
    const startTime = Date.now();

    try {
      const smtpHost = this.config.get<string>('SMTP_HOST');
      const emailDomain = this.config.get<string>('EMAIL_FROM', '').split('@')[1];

      const checks = await Promise.allSettled([
        this.resolveMx(smtpHost),
        emailDomain ? this.resolveMx(emailDomain) : Promise.resolve([])
      ]);

      const smtpMx = checks[0].status === 'fulfilled' ? checks[0].value : null;
      const domainMx = checks[1].status === 'fulfilled' ? checks[1].value : null;

      const details = {
        smtpHost,
        smtpMxRecords: smtpMx,
        emailDomain,
        domainMxRecords: domainMx
      };

      if (!smtpMx) {
        return {
          name: 'Résolution DNS',
          status: 'fail',
          message: `Impossible de résoudre ${smtpHost}`,
          details,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Résolution DNS',
        status: 'pass',
        message: 'Résolution DNS réussie',
        details,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Résolution DNS',
        status: 'fail',
        message: `Erreur DNS: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test d'envoi d'email
   */
  private async checkTestEmail(): Promise<DiagnosticCheck> {
    const startTime = Date.now();

    try {
      const transporter = this.createDiagnosticTransporter();
      const testEmail = this.config.get<string>('EMAIL_TEST_RECIPIENT');

      if (!testEmail) {
        return {
          name: 'Test d\'envoi',
          status: 'warning',
          message: 'EMAIL_TEST_RECIPIENT non configuré - test ignoré',
          duration: Date.now() - startTime
        };
      }

      const result = await transporter.sendMail({
        from: this.config.get<string>('EMAIL_FROM'),
        to: testEmail,
        subject: 'Test diagnostic CSS - ' + new Date().toISOString(),
        text: 'Email de test du système de diagnostic du Club Sportif Sfaxien',
        html: '<p>Email de test du système de diagnostic du <strong>Club Sportif Sfaxien</strong></p>'
      });

      return {
        name: 'Test d\'envoi',
        status: 'pass',
        message: 'Email de test envoyé avec succès',
        details: {
          messageId: result.messageId,
          recipient: testEmail,
          accepted: result.accepted,
          rejected: result.rejected
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Test d\'envoi',
        status: 'fail',
        message: `Échec d'envoi: ${error.message}`,
        details: this.analyzeEmailError(error.message),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Création d'un transporteur pour les diagnostics
   */
  private createDiagnosticTransporter(): nodemailer.Transporter {
    return nodemailer.createTransporter({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      debug: true // Active le debug pour les diagnostics
    });
  }

  /**
   * Analyse des erreurs de connexion
   */
  private analyzeConnectionError(errorMessage: string): any {
    const analysis = {
      errorType: 'unknown',
      possibleCauses: [],
      solutions: []
    };

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      analysis.errorType = 'dns_resolution';
      analysis.possibleCauses.push('Nom d\'hôte SMTP incorrect');
      analysis.solutions.push('Vérifier SMTP_HOST dans la configuration');
    }

    if (errorMessage.includes('ECONNREFUSED')) {
      analysis.errorType = 'connection_refused';
      analysis.possibleCauses.push('Port SMTP incorrect', 'Serveur SMTP arrêté');
      analysis.solutions.push('Vérifier SMTP_PORT', 'Contacter l\'administrateur du serveur SMTP');
    }

    if (errorMessage.includes('ETIMEDOUT')) {
      analysis.errorType = 'timeout';
      analysis.possibleCauses.push('Firewall bloquant', 'Serveur SMTP lent');
      analysis.solutions.push('Vérifier les règles firewall', 'Essayer un autre port (587, 465, 25)');
    }

    if (errorMessage.includes('certificate') || errorMessage.includes('TLS')) {
      analysis.errorType = 'tls_certificate';
      analysis.possibleCauses.push('Certificat TLS invalide', 'Configuration SSL/TLS incorrecte');
      analysis.solutions.push('Vérifier SMTP_SECURE', 'Ajouter rejectUnauthorized: false pour test');
    }

    return analysis;
  }

  /**
   * Analyse des erreurs d'authentification
   */
  private analyzeAuthError(errorMessage: string): any {
    const analysis = {
      errorType: 'auth_failed',
      possibleCauses: [],
      solutions: []
    };

    if (errorMessage.includes('535') || errorMessage.includes('authentication failed')) {
      analysis.possibleCauses.push('Nom d\'utilisateur ou mot de passe incorrect');
      analysis.solutions.push('Vérifier SMTP_USER et SMTP_PASSWORD');
    }

    if (errorMessage.includes('534')) {
      analysis.possibleCauses.push('Authentification à deux facteurs activée');
      analysis.solutions.push('Générer un mot de passe d\'application');
    }

    return analysis;
  }

  /**
   * Analyse des erreurs d'envoi d'email
   */
  private analyzeEmailError(errorMessage: string): any {
    const analysis = {
      errorType: 'send_failed',
      possibleCauses: [],
      solutions: []
    };

    if (errorMessage.includes('451')) {
      analysis.errorType = 'temporary_failure';
      analysis.possibleCauses.push('Erreur temporaire du serveur', 'Limite de taux atteinte');
      analysis.solutions.push('Réessayer dans quelques minutes', 'Réduire la fréquence d\'envoi');
    }

    if (errorMessage.includes('550')) {
      analysis.errorType = 'rejected';
      analysis.possibleCauses.push('Email rejeté par le destinataire', 'Domain ou IP blacklisté');
      analysis.solutions.push('Vérifier la réputation de l\'IP', 'Configurer SPF/DKIM');
    }

    return analysis;
  }

  /**
   * Génération des recommandations
   */
  private generateRecommendations(checks: any): string[] {
    const recommendations: string[] = [];

    if (checks.configuration.status === 'fail') {
      recommendations.push('Configurer tous les paramètres SMTP requis');
    }

    if (checks.connectivity.status === 'fail') {
      recommendations.push('Vérifier la connectivité réseau et les paramètres firewall');
    }

    if (checks.authentication.status === 'fail') {
      recommendations.push('Vérifier les identifiants SMTP et l\'authentification 2FA');
    }

    if (checks.testEmail.status === 'fail') {
      recommendations.push('Configurer un transporteur de fallback');
      recommendations.push('Implémenter un système de retry pour les emails');
    }

    // Recommandations de bonnes pratiques
    recommendations.push('Configurer SPF, DKIM et DMARC pour améliorer la délivrabilité');
    recommendations.push('Surveiller la réputation de l\'IP d\'envoi');
    recommendations.push('Implémenter des templates email responsive');

    return recommendations;
  }

  /**
   * Génération du résumé
   */
  private generateSummary(checks: any): string {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter((check: any) => check.status === 'pass').length;
    const failed = Object.values(checks).filter((check: any) => check.status === 'fail').length;
    const warnings = Object.values(checks).filter((check: any) => check.status === 'warning').length;

    return `${passed}/${total} vérifications réussies${failed > 0 ? `, ${failed} échecs` : ''}${warnings > 0 ? `, ${warnings} avertissements` : ''}`;
  }

  /**
   * Détermination du statut global
   */
  private determineOverallStatus(checks: any): 'healthy' | 'warning' | 'error' {
    const statuses = Object.values(checks).map((check: any) => check.status);

    if (statuses.includes('fail')) {
      return 'error';
    }

    if (statuses.includes('warning')) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Configuration SMTP recommandée pour les providers populaires
   */
  getRecommendedConfigurations(): Record<string, any> {
    return {
      gmail: {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        note: 'Utiliser un mot de passe d\'application avec 2FA activé'
      },
      office365: {
        SMTP_HOST: 'smtp.office365.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        note: 'Authentification moderne requise'
      },
      mailgun: {
        SMTP_HOST: 'smtp.mailgun.org',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        note: 'Service transactionnel recommandé pour la production'
      },
      sendgrid: {
        SMTP_HOST: 'smtp.sendgrid.net',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        note: 'Excellent pour les emails en volume'
      }
    };
  }
}