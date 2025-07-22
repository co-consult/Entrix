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
exports.swaggerValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.swaggerValidationSchema = Joi.object({
    SWAGGER_ENABLED: Joi.boolean().default(true).label('SWAGGER_ENABLED'),
    SWAGGER_TITLE: Joi.string().default('Entrix API').label('SWAGGER_TITLE'),
    SWAGGER_DESCRIPTION: Joi.string().optional().label('SWAGGER_DESCRIPTION'),
    SWAGGER_VERSION: Joi.string().default('1.0').label('SWAGGER_VERSION'),
    SWAGGER_PATH: Joi.string().default('api/docs').label('SWAGGER_PATH'),
    SWAGGER_AUTH_TYPE: Joi.string().valid('bearer', 'cookie').optional().label('SWAGGER_AUTH_TYPE'),
    SWAGGER_TAGS: Joi.string().optional().label('SWAGGER_TAGS'),
});
exports.default = (0, config_1.registerAs)('swagger', () => ({
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: process.env.SWAGGER_TITLE || 'Entrix API',
    description: process.env.SWAGGER_DESCRIPTION,
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'api/docs',
    authType: process.env.SWAGGER_AUTH_TYPE,
    tags: process.env.SWAGGER_TAGS ? process.env.SWAGGER_TAGS.split(',') : [],
}));
//# sourceMappingURL=swagger.config.js.map