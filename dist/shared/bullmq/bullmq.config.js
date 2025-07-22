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
exports.bullmqValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.bullmqValidationSchema = Joi.object({
    BULLMQ_PREFIX: Joi.string().default('bullmq').label('BULLMQ_PREFIX'),
    BULLMQ_CONCURRENCY: Joi.number().integer().min(1).default(5).label('BULLMQ_CONCURRENCY'),
    BULLMQ_REDIS_HOST: Joi.string().optional().label('BULLMQ_REDIS_HOST'),
    BULLMQ_REDIS_PORT: Joi.number().integer().min(1).max(65535).optional().label('BULLMQ_REDIS_PORT'),
    BULLMQ_REDIS_PASSWORD: Joi.string().allow('').optional().label('BULLMQ_REDIS_PASSWORD'),
    BULLMQ_REDIS_DB: Joi.number().integer().min(0).optional().label('BULLMQ_REDIS_DB'),
    BULLMQ_REDIS_TLS: Joi.boolean().optional().label('BULLMQ_REDIS_TLS'),
});
exports.default = (0, config_1.registerAs)('bullmq', () => ({
    prefix: process.env.BULLMQ_PREFIX || 'bullmq',
    concurrency: process.env.BULLMQ_CONCURRENCY ? Number(process.env.BULLMQ_CONCURRENCY) : 5,
    redis: {
        host: process.env.BULLMQ_REDIS_HOST || process.env.REDIS_HOST,
        port: process.env.BULLMQ_REDIS_PORT ? Number(process.env.BULLMQ_REDIS_PORT) : (process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379),
        password: process.env.BULLMQ_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
        db: process.env.BULLMQ_REDIS_DB ? Number(process.env.BULLMQ_REDIS_DB) : (process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0),
        tls: process.env.BULLMQ_REDIS_TLS === 'true' || process.env.REDIS_TLS === 'true',
    },
}));
//# sourceMappingURL=bullmq.config.js.map