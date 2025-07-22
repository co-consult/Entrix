// src/modules/auth/constants/auth.constants.ts

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Identifiants invalides',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  EMAIL_NOT_VERIFIED: 'Email non vérifié',
  ACCOUNT_LOCKED: 'Compte verrouillé',
  MFA_REQUIRED: 'Authentification à double facteur requise',
  SESSION_EXPIRED: 'Session expirée',
  TOKEN_INVALID: 'Token invalide ou expiré',
  PASSWORD_RESET_SENT: 'Email de réinitialisation envoyé',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès',
  EMAIL_ALREADY_USED: 'Cet email est déjà utilisé',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives, veuillez réessayer plus tard',
};

export const AUTH_CONSTANTS = {
  JWT_EXPIRES_IN: '1h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  MFA_CODE_LENGTH: 6,
  MFA_CODE_TTL: 300, // 5 minutes
  PASSWORD_RESET_TOKEN_TTL: 900, // 15 minutes
  SESSION_TTL: 86400, // 24h
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 900, // 15 minutes
};
