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
exports.loggerValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.loggerValidationSchema = Joi.object({
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info').label('LOG_LEVEL'),
    LOG_FORMAT: Joi.string().valid('json', 'simple', 'pretty').default('json').label('LOG_FORMAT'),
    LOG_ENABLE_CONSOLE: Joi.boolean().default(true).label('LOG_ENABLE_CONSOLE'),
    LOG_ENABLE_FILE: Joi.boolean().default(false).label('LOG_ENABLE_FILE'),
    LOG_FILE_PATH: Joi.string().optional().label('LOG_FILE_PATH'),
    LOG_MAX_SIZE: Joi.string().optional().label('LOG_MAX_SIZE'),
    LOG_MAX_FILES: Joi.string().optional().label('LOG_MAX_FILES'),
});
exports.default = (0, config_1.registerAs)('logger', () => ({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH,
    maxSize: process.env.LOG_MAX_SIZE,
    maxFiles: process.env.LOG_MAX_FILES,
}));
//# sourceMappingURL=logger.config.js.map