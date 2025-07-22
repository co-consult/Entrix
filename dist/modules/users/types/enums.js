"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = exports.ValidationState = exports.BadgeCategory = exports.SupporterLevel = exports.IncentiveType = exports.SortOrder = exports.ImageFormat = exports.FileType = exports.CommunicationChannel = exports.BusinessEventType = exports.NotificationPriority = exports.NotificationType = exports.AuditAction = exports.SecurityLevel = exports.InvitationStatus = exports.InvitationType = exports.MembershipStatus = exports.Status = void 0;
var Status;
(function (Status) {
    Status["ACTIVE"] = "ACTIVE";
    Status["INACTIVE"] = "INACTIVE";
    Status["PENDING"] = "PENDING";
    Status["SUSPENDED"] = "SUSPENDED";
    Status["DELETED"] = "DELETED";
})(Status || (exports.Status = Status = {}));
var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["ACTIVE"] = "ACTIVE";
    MembershipStatus["PENDING"] = "PENDING";
    MembershipStatus["SUSPENDED"] = "SUSPENDED";
    MembershipStatus["LEFT"] = "LEFT";
    MembershipStatus["EXPELLED"] = "EXPELLED";
})(MembershipStatus || (exports.MembershipStatus = MembershipStatus = {}));
var InvitationType;
(function (InvitationType) {
    InvitationType["GROUP"] = "GROUP";
    InvitationType["EVENT"] = "EVENT";
    InvitationType["FRIEND"] = "FRIEND";
})(InvitationType || (exports.InvitationType = InvitationType = {}));
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["DECLINED"] = "DECLINED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
    InvitationStatus["CANCELLED"] = "CANCELLED";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel["LOW"] = "LOW";
    SecurityLevel["STANDARD"] = "STANDARD";
    SecurityLevel["HIGH"] = "HIGH";
    SecurityLevel["MAXIMUM"] = "MAXIMUM";
})(SecurityLevel || (exports.SecurityLevel = SecurityLevel = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["READ"] = "READ";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["PERMISSION_CHANGE"] = "PERMISSION_CHANGE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["NORMAL"] = "NORMAL";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var BusinessEventType;
(function (BusinessEventType) {
    BusinessEventType["USER_REGISTERED"] = "USER_REGISTERED";
    BusinessEventType["USER_VERIFIED"] = "USER_VERIFIED";
    BusinessEventType["GROUP_CREATED"] = "GROUP_CREATED";
    BusinessEventType["GROUP_JOINED"] = "GROUP_JOINED";
    BusinessEventType["INVITATION_SENT"] = "INVITATION_SENT";
    BusinessEventType["PROFILE_COMPLETED"] = "PROFILE_COMPLETED";
    BusinessEventType["ANONYMOUS_CONVERTED"] = "ANONYMOUS_CONVERTED";
})(BusinessEventType || (exports.BusinessEventType = BusinessEventType = {}));
var CommunicationChannel;
(function (CommunicationChannel) {
    CommunicationChannel["EMAIL"] = "EMAIL";
    CommunicationChannel["SMS"] = "SMS";
    CommunicationChannel["PUSH"] = "PUSH";
    CommunicationChannel["WHATSAPP"] = "WHATSAPP";
    CommunicationChannel["TELEGRAM"] = "TELEGRAM";
})(CommunicationChannel || (exports.CommunicationChannel = CommunicationChannel = {}));
var FileType;
(function (FileType) {
    FileType["IMAGE"] = "IMAGE";
    FileType["DOCUMENT"] = "DOCUMENT";
    FileType["VIDEO"] = "VIDEO";
    FileType["AUDIO"] = "AUDIO";
})(FileType || (exports.FileType = FileType = {}));
var ImageFormat;
(function (ImageFormat) {
    ImageFormat["JPEG"] = "JPEG";
    ImageFormat["JPG"] = "JPG";
    ImageFormat["PNG"] = "PNG";
    ImageFormat["WEBP"] = "WEBP";
    ImageFormat["GIF"] = "GIF";
})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
var IncentiveType;
(function (IncentiveType) {
    IncentiveType["BONUS_POINTS"] = "BONUS_POINTS";
    IncentiveType["DISCOUNT_NEXT"] = "DISCOUNT_NEXT";
    IncentiveType["FREE_UPGRADE"] = "FREE_UPGRADE";
    IncentiveType["EXCLUSIVE_ACCESS"] = "EXCLUSIVE_ACCESS";
    IncentiveType["GIFT_VOUCHER"] = "GIFT_VOUCHER";
})(IncentiveType || (exports.IncentiveType = IncentiveType = {}));
var SupporterLevel;
(function (SupporterLevel) {
    SupporterLevel["CASUAL"] = "CASUAL";
    SupporterLevel["REGULAR"] = "REGULAR";
    SupporterLevel["DEDICATED"] = "DEDICATED";
    SupporterLevel["ULTRA"] = "ULTRA";
})(SupporterLevel || (exports.SupporterLevel = SupporterLevel = {}));
var BadgeCategory;
(function (BadgeCategory) {
    BadgeCategory["ACTIVITY"] = "ACTIVITY";
    BadgeCategory["SOCIAL"] = "SOCIAL";
    BadgeCategory["PURCHASE"] = "PURCHASE";
    BadgeCategory["LOYALTY"] = "LOYALTY";
    BadgeCategory["SPECIAL"] = "SPECIAL";
})(BadgeCategory || (exports.BadgeCategory = BadgeCategory = {}));
var ValidationState;
(function (ValidationState) {
    ValidationState["PENDING"] = "PENDING";
    ValidationState["VALID"] = "VALID";
    ValidationState["INVALID"] = "INVALID";
    ValidationState["EXPIRED"] = "EXPIRED";
})(ValidationState || (exports.ValidationState = ValidationState = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorType["BUSINESS_RULE_ERROR"] = "BUSINESS_RULE_ERROR";
    ErrorType["PERMISSION_ERROR"] = "PERMISSION_ERROR";
    ErrorType["NOT_FOUND_ERROR"] = "NOT_FOUND_ERROR";
    ErrorType["CONFLICT_ERROR"] = "CONFLICT_ERROR";
    ErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
//# sourceMappingURL=enums.js.map