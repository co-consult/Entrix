"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpUtils = void 0;
const net_1 = require("net");
class IpUtils {
    static validateAndNormalizeIp(ip) {
        if (!ip || ip.trim() === '') {
            return '127.0.0.1';
        }
        const cleanIp = ip.trim();
        if (cleanIp.startsWith('::ffff:')) {
            const ipv4Part = cleanIp.substring(7);
            if ((0, net_1.isIP)(ipv4Part) === 4) {
                return ipv4Part;
            }
        }
        if (cleanIp === '::1') {
            return '127.0.0.1';
        }
        const ipVersion = (0, net_1.isIP)(cleanIp);
        if (ipVersion === 4) {
            return cleanIp;
        }
        if (ipVersion === 6) {
            return cleanIp;
        }
        console.warn(`Invalid IP address received: ${cleanIp}, using localhost`);
        return '127.0.0.1';
    }
    static extractIpFromRequest(request) {
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
    static isSameSubnet(ip1, ip2) {
        try {
            const normalizedIp1 = this.validateAndNormalizeIp(ip1);
            const normalizedIp2 = this.validateAndNormalizeIp(ip2);
            if ((0, net_1.isIP)(normalizedIp1) === 4 && (0, net_1.isIP)(normalizedIp2) === 4) {
                const parts1 = normalizedIp1.split('.');
                const parts2 = normalizedIp2.split('.');
                if (parts1.length === 4 && parts2.length === 4) {
                    return parts1[0] === parts2[0] &&
                        parts1[1] === parts2[1] &&
                        parts1[2] === parts2[2];
                }
            }
            return normalizedIp1 === normalizedIp2;
        }
        catch {
            return false;
        }
    }
}
exports.IpUtils = IpUtils;
//# sourceMappingURL=ip.util.js.map