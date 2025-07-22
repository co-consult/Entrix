"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.prismaValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().uri().required().label('DATABASE_URL'),
    PRISMA_LOG_LEVEL: Joi.string()
        .valid('info', 'warn', 'error', 'query')
        .default('info')
        .label('PRISMA_LOG_LEVEL'),
    PRISMA_POOL_MIN: Joi.number().integer().min(1).default(2).label('PRISMA_POOL_MIN'),
    PRISMA_POOL_MAX: Joi.number().integer().min(1).default(10).label('PRISMA_POOL_MAX'),
});
exports.default = (0, config_1.registerAs)('prisma', () => ({
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.PRISMA_LOG_LEVEL || 'info',
    poolMin: process.env.PRISMA_POOL_MIN ? Number(process.env.PRISMA_POOL_MIN) : 2,
    poolMax: process.env.PRISMA_POOL_MAX ? Number(process.env.PRISMA_POOL_MAX) : 10,
}));
//# sourceMappingURL=prisma.config.js.map