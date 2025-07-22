// src/modules/users/types/enums.ts

// Statuts généraux
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// Statuts de membership
export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING', 
  SUSPENDED = 'SUSPENDED',
  LEFT = 'LEFT',
  EXPELLED = 'EXPELLED',
}

// Types d'invitations
export enum InvitationType {
  GROUP = 'GROUP',
  EVENT = 'EVENT',
  FRIEND = 'FRIEND',
}

// Statuts d'invitation
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// Niveaux de sécurité
export enum SecurityLevel {
  LOW = 'LOW',
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
  MAXIMUM = 'MAXIMUM',
}

// Types d'actions d'audit
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

// Types de notifications
export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

// Priorités de notification
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL', 
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Types d'événements business
export enum BusinessEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_VERIFIED = 'USER_VERIFIED',
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_JOINED = 'GROUP_JOINED',
  INVITATION_SENT = 'INVITATION_SENT',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  ANONYMOUS_CONVERTED = 'ANONYMOUS_CONVERTED',
}

// Canaux de communication
export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
}

// Types de fichiers autorisés
export enum FileType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

// Formats d'image autorisés
export enum ImageFormat {
  JPEG = 'JPEG',
  JPG = 'JPG',
  PNG = 'PNG',
  WEBP = 'WEBP',
  GIF = 'GIF',
}

// Ordres de tri
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Types d'incentives pour l'onboarding
export enum IncentiveType {
  BONUS_POINTS = 'BONUS_POINTS',
  DISCOUNT_NEXT = 'DISCOUNT_NEXT',
  FREE_UPGRADE = 'FREE_UPGRADE',
  EXCLUSIVE_ACCESS = 'EXCLUSIVE_ACCESS',
  GIFT_VOUCHER = 'GIFT_VOUCHER',
}

// Niveaux de supporter
export enum SupporterLevel {
  CASUAL = 'CASUAL',
  REGULAR = 'REGULAR',
  DEDICATED = 'DEDICATED',
  ULTRA = 'ULTRA',
}

// Types de badges
export enum BadgeCategory {
  ACTIVITY = 'ACTIVITY',
  SOCIAL = 'SOCIAL',
  PURCHASE = 'PURCHASE',
  LOYALTY = 'LOYALTY',
  SPECIAL = 'SPECIAL',
}

// États de validation
export enum ValidationState {
  PENDING = 'PENDING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED',
}

// Types d'erreurs métier
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}