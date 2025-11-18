import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Email
 */
export const emailValidationSchema = Joi.object({
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

/**
 * Configuration Email pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [emailConfig] })
 */
export default registerAs('email', () => ({
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