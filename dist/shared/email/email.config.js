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
exports.emailValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.emailValidationSchema = Joi.object({
    EMAIL_FROM: Joi.string().email().required().label('EMAIL_FROM'),
    EMAIL_HOST: Joi.string().required().label('EMAIL_HOST'),
    EMAIL_PORT: Joi.number().integer().min(1).max(65535).required().label('EMAIL_PORT'),
    EMAIL_USER: Joi.string().required().label('EMAIL_USER'),
    EMAIL_PASS: Joi.string().required().label('EMAIL_PASS'),
    EMAIL_SECURE: Joi.boolean().default(false).label('EMAIL_SECURE'),
    EMAIL_DEFAULT_REPLY_TO: Joi.string().email().optional().label('EMAIL_DEFAULT_REPLY_TO'),
    EMAIL_PROVIDER: Joi.string().valid('smtp', 'sendgrid', 'mailgun').default('smtp').label('EMAIL_PROVIDER'),
    EMAIL_TEMPLATES_PATH: Joi.string().optional().label('EMAIL_TEMPLATES_PATH'),
});
exports.default = (0, config_1.registerAs)('email', () => ({
    from: process.env.EMAIL_FROM,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    secure: process.env.EMAIL_SECURE === 'true',
    defaultReplyTo: process.env.EMAIL_DEFAULT_REPLY_TO,
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    templatesPath: process.env.EMAIL_TEMPLATES_PATH,
}));
//# sourceMappingURL=email.config.js.map