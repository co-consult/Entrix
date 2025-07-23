// src/modules/auth/utils/device.util.ts

import { IDeviceInfo } from '../interfaces/session.interface';
import { CryptoUtil } from './crypto.util';

/**
 * Utilitaires Device Fingerprinting Entrix V3.0
 */

export class DeviceUtil {
  /**
   * Parse User-Agent pour extraire infos device
   */
  static parseUserAgent(userAgent: string): {
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    isMobile: boolean;
    isBot: boolean;
  } {
    const ua = userAgent || '';

    // Détection mobile
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Détection bot
    const isBot = /bot|crawler|spider|scraper|selenium|phantomjs|headless/i.test(ua);

    // Détection navigateur
    let browser = 'Unknown';
    let browserVersion = '';

    if (ua.includes('Chrome')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('Edge')) {
      browser = 'Edge';
      const match = ua.match(/Edge\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    }

    // Détection OS
    let os = 'Unknown';
    let osVersion = '';

    if (ua.includes('Windows')) {
      os = 'Windows';
      if (ua.includes('Windows NT 10.0')) osVersion = '10';
      else if (ua.includes('Windows NT 6.3')) osVersion = '8.1';
      else if (ua.includes('Windows NT 6.1')) osVersion = '7';
    } else if (ua.includes('Mac OS X')) {
      os = 'macOS';
      const match = ua.match(/Mac OS X ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    } else if (ua.includes('Android')) {
      os = 'Android';
      const match = ua.match(/Android ([0-9.]+)/);
      osVersion = match ? match[1] : '';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
      const match = ua.match(/OS ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    }

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      isMobile,
      isBot
    };
  }

  /**
   * Génère empreinte device
   */
  static generateDeviceFingerprint(deviceInfo: Partial<IDeviceInfo>): string {
    const components = [
      deviceInfo.userAgent || '',
      deviceInfo.ipAddress || '',
      JSON.stringify(deviceInfo.geolocation || {}),
    ];

    const fingerprintData = components.join('|');
    return CryptoUtil.sha256Hash(fingerprintData);
  }

  /**
   * Calcule entropie device
   */
  static calculateDeviceEntropy(deviceInfo: IDeviceInfo): number {
    let entropy = 0;

    // User-Agent apporte ~10-15 bits
    if (deviceInfo.userAgent) entropy += 12;

    // Géolocalisation apporte ~10-20 bits selon précision
    if (deviceInfo.geolocation?.country) entropy += 8;
    if (deviceInfo.geolocation?.city) entropy += 10;
    if (deviceInfo.geolocation?.coordinates) entropy += 15;

    // IP apporte ~25-30 bits
    if (deviceInfo.ipAddress) entropy += 25;

    return entropy;
  }

  /**
   * Normalise DeviceInfo
   */
  static normalizeDeviceInfo(rawDeviceInfo: any): IDeviceInfo {
    const userAgentInfo = this.parseUserAgent(rawDeviceInfo.userAgent || '');

    return {
      deviceId: rawDeviceInfo.deviceId,
      userAgent: rawDeviceInfo.userAgent || '',
      browser: userAgentInfo.browser,
      os: userAgentInfo.os,
      isMobile: userAgentInfo.isMobile,
      ipAddress: rawDeviceInfo.ipAddress || '',
      geolocation: rawDeviceInfo.geolocation || null,
    };
  }

  /**
   * Compare deux devices pour similarité
   */
  static compareDevices(device1: IDeviceInfo, device2: IDeviceInfo): {
    similarity: number;
    factors: string[];
  } {
    const factors: string[] = [];
    let similarity = 0;

    // User-Agent (30%)
    if (device1.userAgent === device2.userAgent) {
      similarity += 30;
      factors.push('userAgent');
    }

    // IP Address (25%)
    if (device1.ipAddress === device2.ipAddress) {
      similarity += 25;
      factors.push('ipAddress');
    }

    // Géolocalisation (20%)
    if (device1.geolocation?.country === device2.geolocation?.country) {
      similarity += 10;
      factors.push('country');
    }
    if (device1.geolocation?.city === device2.geolocation?.city) {
      similarity += 10;
      factors.push('city');
    }

    // Browser/OS (25%)
    if (device1.browser === device2.browser) {
      similarity += 15;
      factors.push('browser');
    }
    if (device1.os === device2.os) {
      similarity += 10;
      factors.push('os');
    }

    return { similarity, factors };
  }
}