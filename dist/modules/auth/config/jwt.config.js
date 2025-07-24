"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtRefreshConfig = exports.getJwtConfig = void 0;
const getJwtConfig = (configService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: {},
    verifyOptions: {
        issuer: 'entrix-v3',
        audience: 'entrix-users',
        clockTolerance: 30,
    },
});
exports.getJwtConfig = getJwtConfig;
const getJwtRefreshConfig = (configService) => ({
    secret: configService.get('JWT_REFRESH_SECRET', configService.get('JWT_SECRET')),
    signOptions: {},
    verifyOptions: {
        issuer: 'entrix-v3',
        audience: 'entrix-refresh',
        clockTolerance: 60,
    },
});
exports.getJwtRefreshConfig = getJwtRefreshConfig;
//# sourceMappingURL=jwt.config.js.map