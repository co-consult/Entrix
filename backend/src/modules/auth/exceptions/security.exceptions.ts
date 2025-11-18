// src/modules/auth/exceptions/security.exceptions.ts

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

/**
 * Exceptions de sécurité Entrix V3.0
 * ATTENTION: Les exceptions Captcha, ResetToken et DeviceToken sont dans auth.exceptions.ts
 */

// Activité suspecte
export class SuspiciousActivityException extends ForbiddenException {
  constructor(riskScore: number, factors: string[]) {
    super({
      success: false,
      error: {
        code: 'SUSPICIOUS_ACTIVITY',
        message: 'Activité suspecte détectée',
        details: 'Votre compte a été temporairement protégé',
        riskScore,
        factors,
        contactSupport: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// IP bloquée
export class BlockedIpException extends ForbiddenException {
  constructor(ip: string, reason: string) {
    super({
      success: false,
      error: {
        code: 'BLOCKED_IP',
        message: 'Adresse IP bloquée',
        details: `L'adresse IP ${ip} a été bloquée: ${reason}`,
        contactSupport: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Géolocalisation non autorisée
export class UnauthorizedLocationException extends ForbiddenException {
  constructor(country: string) {
    super({
      success: false,
      error: {
        code: 'UNAUTHORIZED_LOCATION',
        message: 'Localisation non autorisée',
        details: `L'accès depuis ${country} n'est pas autorisé`,
        verification: 'email',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Appareil suspecte détecté
export class SuspiciousDeviceException extends ForbiddenException {
  constructor(deviceFingerprint: string, reason: string) {
    super({
      success: false,
      error: {
        code: 'SUSPICIOUS_DEVICE',
        message: 'Appareil suspect détecté',
        details: `Appareil ${deviceFingerprint.substring(0, 8)}... signalé: ${reason}`,
        requiresVerification: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Vitesse de connexion anormale (impossible géographiquement)
export class VelocityAnomalyException extends ForbiddenException {
  constructor(previousLocation: string, currentLocation: string, timeSpan: number) {
    super({
      success: false,
      error: {
        code: 'VELOCITY_ANOMALY',
        message: 'Déplacement géographique impossible',
        details: `Connexion de ${previousLocation} vers ${currentLocation} en ${timeSpan} minutes est physiquement impossible`,
        requiresVerification: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Pattern d'attaque détecté
export class AttackPatternException extends ForbiddenException {
  constructor(patternType: string, confidence: number) {
    super({
      success: false,
      error: {
        code: 'ATTACK_PATTERN_DETECTED',
        message: 'Pattern d\'attaque détecté',
        details: `Pattern ${patternType} détecté avec ${confidence}% de confiance`,
        blocked: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Session compromise détectée
export class CompromisedSessionException extends UnauthorizedException {
  constructor(sessionId: string, reason: string) {
    super({
      success: false,
      error: {
        code: 'COMPROMISED_SESSION',
        message: 'Session compromise détectée',
        details: `Session ${sessionId.substring(0, 8)}... compromise: ${reason}`,
        forceLogout: true,
        changePasswordRequired: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Accès concurrent suspect
export class SuspiciousConcurrentAccessException extends ForbiddenException {
  constructor(sessionCount: number, ipAddresses: string[]) {
    super({
      success: false,
      error: {
        code: 'SUSPICIOUS_CONCURRENT_ACCESS',
        message: 'Accès concurrent suspect',
        details: `${sessionCount} sessions simultanées depuis ${ipAddresses.length} IPs différentes`,
        activeIpAddresses: ipAddresses.map(ip => `${ip.substring(0, 7)}...`),
        requiresVerification: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Automation/Bot détecté
export class BotDetectedException extends ForbiddenException {
  constructor(detectionMethod: string, confidence: number) {
    super({
      success: false,
      error: {
        code: 'BOT_DETECTED',
        message: 'Automation détectée',
        details: `Bot détecté via ${detectionMethod} (confiance: ${confidence}%)`,
        requiresCaptcha: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Honeypot trigger
export class HoneypotTriggeredException extends ForbiddenException {
  constructor(honeypotType: string) {
    super({
      success: false,
      error: {
        code: 'HONEYPOT_TRIGGERED',
        message: 'Tentative d\'accès non autorisé',
        details: `Honeypot ${honeypotType} déclenché`,
        blocked: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
}