"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceUtil = void 0;
const crypto_util_1 = require("./crypto.util");
class DeviceUtil {
    static parseUserAgent(userAgent) {
        const ua = userAgent || '';
        const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isBot = /bot|crawler|spider|scraper|selenium|phantomjs|headless/i.test(ua);
        let browser = 'Unknown';
        let browserVersion = '';
        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            const match = ua.match(/Chrome\/([0-9.]+)/);
            browserVersion = match ? match[1] : '';
        }
        else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            const match = ua.match(/Firefox\/([0-9.]+)/);
            browserVersion = match ? match[1] : '';
        }
        else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            const match = ua.match(/Version\/([0-9.]+)/);
            browserVersion = match ? match[1] : '';
        }
        else if (ua.includes('Edge')) {
            browser = 'Edge';
            const match = ua.match(/Edge\/([0-9.]+)/);
            browserVersion = match ? match[1] : '';
        }
        let os = 'Unknown';
        let osVersion = '';
        if (ua.includes('Windows')) {
            os = 'Windows';
            if (ua.includes('Windows NT 10.0'))
                osVersion = '10';
            else if (ua.includes('Windows NT 6.3'))
                osVersion = '8.1';
            else if (ua.includes('Windows NT 6.1'))
                osVersion = '7';
        }
        else if (ua.includes('Mac OS X')) {
            os = 'macOS';
            const match = ua.match(/Mac OS X ([0-9_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : '';
        }
        else if (ua.includes('Linux')) {
            os = 'Linux';
        }
        else if (ua.includes('Android')) {
            os = 'Android';
            const match = ua.match(/Android ([0-9.]+)/);
            osVersion = match ? match[1] : '';
        }
        else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
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
    static generateDeviceFingerprint(deviceInfo) {
        const components = [
            deviceInfo.userAgent || '',
            deviceInfo.ipAddress || '',
            JSON.stringify(deviceInfo.geolocation || {}),
        ];
        const fingerprintData = components.join('|');
        return crypto_util_1.CryptoUtil.sha256Hash(fingerprintData);
    }
    static calculateDeviceEntropy(deviceInfo) {
        let entropy = 0;
        if (deviceInfo.userAgent)
            entropy += 12;
        if (deviceInfo.geolocation?.country)
            entropy += 8;
        if (deviceInfo.geolocation?.city)
            entropy += 10;
        if (deviceInfo.geolocation?.coordinates)
            entropy += 15;
        if (deviceInfo.ipAddress)
            entropy += 25;
        return entropy;
    }
    static normalizeDeviceInfo(rawDeviceInfo) {
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
    static compareDevices(device1, device2) {
        const factors = [];
        let similarity = 0;
        if (device1.userAgent === device2.userAgent) {
            similarity += 30;
            factors.push('userAgent');
        }
        if (device1.ipAddress === device2.ipAddress) {
            similarity += 25;
            factors.push('ipAddress');
        }
        if (device1.geolocation?.country === device2.geolocation?.country) {
            similarity += 10;
            factors.push('country');
        }
        if (device1.geolocation?.city === device2.geolocation?.city) {
            similarity += 10;
            factors.push('city');
        }
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
    static generateDeviceName(deviceInfo) {
        if (!deviceInfo.userAgent && !deviceInfo.ipAddress) {
            return 'Appareil inconnu';
        }
        const userAgentInfo = this.parseUserAgent(deviceInfo.userAgent || '');
        let deviceName = '';
        if (userAgentInfo.os !== 'Unknown') {
            if (userAgentInfo.isMobile) {
                if (userAgentInfo.os === 'iOS') {
                    deviceName = deviceInfo.userAgent?.includes('iPad') ? 'iPad' : 'iPhone';
                }
                else if (userAgentInfo.os === 'Android') {
                    deviceName = 'Android';
                }
                else {
                    deviceName = `${userAgentInfo.os} Mobile`;
                }
            }
            else {
                deviceName = userAgentInfo.os;
            }
        }
        else {
            deviceName = userAgentInfo.isMobile ? 'Mobile' : 'Desktop';
        }
        if (userAgentInfo.browser !== 'Unknown') {
            deviceName += ` • ${userAgentInfo.browser}`;
        }
        if (deviceInfo.geolocation?.city) {
            deviceName += ` • ${deviceInfo.geolocation.city}`;
        }
        else if (deviceInfo.geolocation?.country) {
            deviceName += ` • ${deviceInfo.geolocation.country}`;
        }
        const now = new Date();
        const timeStr = now.toLocaleDateString('fr-TN', {
            day: '2-digit',
            month: '2-digit'
        });
        deviceName += ` (${timeStr})`;
        return deviceName;
    }
}
exports.DeviceUtil = DeviceUtil;
//# sourceMappingURL=device.util.js.map