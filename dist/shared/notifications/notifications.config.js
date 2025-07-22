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
exports.notificationsValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.notificationsValidationSchema = Joi.object({
    NOTIFICATIONS_EMAIL_ENABLED: Joi.boolean().default(true).label('NOTIFICATIONS_EMAIL_ENABLED'),
    NOTIFICATIONS_WS_ENABLED: Joi.boolean().default(true).label('NOTIFICATIONS_WS_ENABLED'),
    NOTIFICATIONS_SMS_ENABLED: Joi.boolean().default(false).label('NOTIFICATIONS_SMS_ENABLED'),
    NOTIFICATIONS_PUSH_ENABLED: Joi.boolean().default(false).label('NOTIFICATIONS_PUSH_ENABLED'),
    NOTIFICATIONS_DEFAULT_CHANNEL: Joi.string().valid('email', 'ws', 'sms', 'push').default('email').label('NOTIFICATIONS_DEFAULT_CHANNEL'),
    NOTIFICATIONS_PRIORITY_LEVELS: Joi.string().optional().label('NOTIFICATIONS_PRIORITY_LEVELS'),
});
exports.default = (0, config_1.registerAs)('notifications', () => ({
    emailEnabled: process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false',
    wsEnabled: process.env.NOTIFICATIONS_WS_ENABLED !== 'false',
    smsEnabled: process.env.NOTIFICATIONS_SMS_ENABLED === 'true',
    pushEnabled: process.env.NOTIFICATIONS_PUSH_ENABLED === 'true',
    defaultChannel: process.env.NOTIFICATIONS_DEFAULT_CHANNEL || 'email',
    priorityLevels: process.env.NOTIFICATIONS_PRIORITY_LEVELS ? process.env.NOTIFICATIONS_PRIORITY_LEVELS.split(',') : ['low', 'normal', 'high', 'critical'],
}));
//# sourceMappingURL=notifications.config.js.map