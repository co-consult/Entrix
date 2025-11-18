// src/modules/auth/utils/ip.util.ts

/**
 * Utilitaires de validation et normalisation des adresses IP
 * pour compatibilité avec PostgreSQL INET
 */

import { isIP } from 'net';

export class IpUtils {
  /**
   * Valide et normalise une adresse IP pour PostgreSQL INET
   */
  static validateAndNormalizeIp(ip: string | undefined | null): string {
    // Valeur par défaut si IP manquante
    if (!ip || ip.trim() === '') {
      return '127.0.0.1';
    }

    const cleanIp = ip.trim();

    // Gérer les adresses IPv6 mappées en IPv4
    if (cleanIp.startsWith('::ffff:')) {
      const ipv4Part = cleanIp.substring(7);
      if (isIP(ipv4Part) === 4) {
        return ipv4Part;
      }
    }

    // Gérer les adresses locales
    if (cleanIp === '::1') {
      return '127.0.0.1';
    }

    // Vérifier si c'est une IP valide
    const ipVersion = isIP(cleanIp);
    
    if (ipVersion === 4) {
      return cleanIp;
    }
    
    if (ipVersion === 6) {
      // Retourner l'IPv6 telle quelle si valide
      return cleanIp;
    }

    // Si aucune validation ne passe, retourner localhost
    console.warn(`Invalid IP address received: ${cleanIp}, using localhost`);
    return '127.0.0.1';
  }

  /**
   * Extrait l'IP depuis une requête Express
   */
  static extractIpFromRequest(request: any): string {
    // Ordre de priorité pour extraction IP
    const possibleIps = [
      request.ip,
      request.connection?.remoteAddress,
      request.socket?.remoteAddress,
      request.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      request.headers['x-real-ip'],
      request.headers['x-client-ip'],
    ].filter(Boolean);

    for (const ip of possibleIps) {
      const normalizedIp = this.validateAndNormalizeIp(ip);
      if (normalizedIp !== '127.0.0.1' || ip === '127.0.0.1') {
        return normalizedIp;
      }
    }

    return '127.0.0.1';
  }

  /**
   * Vérifie si deux IPs sont dans le même sous-réseau
   */
  static isSameSubnet(ip1: string, ip2: string): boolean {
    try {
      const normalizedIp1 = this.validateAndNormalizeIp(ip1);
      const normalizedIp2 = this.validateAndNormalizeIp(ip2);

      // Pour IPv4 seulement
      if (isIP(normalizedIp1) === 4 && isIP(normalizedIp2) === 4) {
        const parts1 = normalizedIp1.split('.');
        const parts2 = normalizedIp2.split('.');
        
        if (parts1.length === 4 && parts2.length === 4) {
          // Vérifier les 3 premiers octets (sous-réseau /24)
          return parts1[0] === parts2[0] && 
                 parts1[1] === parts2[1] && 
                 parts1[2] === parts2[2];
        }
      }
      
      return normalizedIp1 === normalizedIp2;
    } catch {
      return false;
    }
  }
}