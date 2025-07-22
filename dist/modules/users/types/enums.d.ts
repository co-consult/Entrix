export declare enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED"
}
export declare enum MembershipStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    LEFT = "LEFT",
    EXPELLED = "EXPELLED"
}
export declare enum InvitationType {
    GROUP = "GROUP",
    EVENT = "EVENT",
    FRIEND = "FRIEND"
}
export declare enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare enum SecurityLevel {
    LOW = "LOW",
    STANDARD = "STANDARD",
    HIGH = "HIGH",
    MAXIMUM = "MAXIMUM"
}
export declare enum AuditAction {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
}
export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum BusinessEventType {
    USER_REGISTERED = "USER_REGISTERED",
    USER_VERIFIED = "USER_VERIFIED",
    GROUP_CREATED = "GROUP_CREATED",
    GROUP_JOINED = "GROUP_JOINED",
    INVITATION_SENT = "INVITATION_SENT",
    PROFILE_COMPLETED = "PROFILE_COMPLETED",
    ANONYMOUS_CONVERTED = "ANONYMOUS_CONVERTED"
}
export declare enum CommunicationChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    WHATSAPP = "WHATSAPP",
    TELEGRAM = "TELEGRAM"
}
export declare enum FileType {
    IMAGE = "IMAGE",
    DOCUMENT = "DOCUMENT",
    VIDEO = "VIDEO",
    AUDIO = "AUDIO"
}
export declare enum ImageFormat {
    JPEG = "JPEG",
    JPG = "JPG",
    PNG = "PNG",
    WEBP = "WEBP",
    GIF = "GIF"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare enum IncentiveType {
    BONUS_POINTS = "BONUS_POINTS",
    DISCOUNT_NEXT = "DISCOUNT_NEXT",
    FREE_UPGRADE = "FREE_UPGRADE",
    EXCLUSIVE_ACCESS = "EXCLUSIVE_ACCESS",
    GIFT_VOUCHER = "GIFT_VOUCHER"
}
export declare enum SupporterLevel {
    CASUAL = "CASUAL",
    REGULAR = "REGULAR",
    DEDICATED = "DEDICATED",
    ULTRA = "ULTRA"
}
export declare enum BadgeCategory {
    ACTIVITY = "ACTIVITY",
    SOCIAL = "SOCIAL",
    PURCHASE = "PURCHASE",
    LOYALTY = "LOYALTY",
    SPECIAL = "SPECIAL"
}
export declare enum ValidationState {
    PENDING = "PENDING",
    VALID = "VALID",
    INVALID = "INVALID",
    EXPIRED = "EXPIRED"
}
export declare enum ErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    BUSINESS_RULE_ERROR = "BUSINESS_RULE_ERROR",
    PERMISSION_ERROR = "PERMISSION_ERROR",
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
    CONFLICT_ERROR = "CONFLICT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
}
