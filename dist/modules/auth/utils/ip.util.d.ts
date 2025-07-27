export declare class IpUtils {
    static validateAndNormalizeIp(ip: string | undefined | null): string;
    static extractIpFromRequest(request: any): string;
    static isSameSubnet(ip1: string, ip2: string): boolean;
}
