/**
 * Token d'injection du service Notifications
 */
export const NOTIFICATIONS_SERVICE = 'NOTIFICATIONS_SERVICE';

/**
 * Namespace de configuration pour @nestjs/config
 */
export const NOTIFICATIONS_CONFIG_NAMESPACE = 'notifications';

/**
 * Canaux de notification supportés
 */
export const NOTIFICATION_CHANNELS = ['email', 'ws', 'sms', 'push'] as const;

/**
 * Niveaux de priorité par défaut
 */
export const NOTIFICATION_PRIORITY_LEVELS = ['low', 'normal', 'high', 'critical'] as const; 