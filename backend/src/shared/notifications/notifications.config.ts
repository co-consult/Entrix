import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Notifications
 */
export const notificationsValidationSchema = Joi.object({
  NOTIFICATIONS_EMAIL_ENABLED: Joi.boolean().default(true).label('NOTIFICATIONS_EMAIL_ENABLED'),
  NOTIFICATIONS_WS_ENABLED: Joi.boolean().default(true).label('NOTIFICATIONS_WS_ENABLED'),
  NOTIFICATIONS_SMS_ENABLED: Joi.boolean().default(false).label('NOTIFICATIONS_SMS_ENABLED'),
  NOTIFICATIONS_PUSH_ENABLED: Joi.boolean().default(false).label('NOTIFICATIONS_PUSH_ENABLED'),
  NOTIFICATIONS_DEFAULT_CHANNEL: Joi.string().valid('email', 'ws', 'sms', 'push').default('email').label('NOTIFICATIONS_DEFAULT_CHANNEL'),
  NOTIFICATIONS_PRIORITY_LEVELS: Joi.string().optional().label('NOTIFICATIONS_PRIORITY_LEVELS'),
});

/**
 * Configuration Notifications pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [notificationsConfig] })
 */
export default registerAs('notifications', () => ({
  emailEnabled: process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false',
  wsEnabled: process.env.NOTIFICATIONS_WS_ENABLED !== 'false',
  smsEnabled: process.env.NOTIFICATIONS_SMS_ENABLED === 'true',
  pushEnabled: process.env.NOTIFICATIONS_PUSH_ENABLED === 'true',
  defaultChannel: process.env.NOTIFICATIONS_DEFAULT_CHANNEL || 'email',
  priorityLevels: process.env.NOTIFICATIONS_PRIORITY_LEVELS ? process.env.NOTIFICATIONS_PRIORITY_LEVELS.split(',') : ['low', 'normal', 'high', 'critical'],
})); 