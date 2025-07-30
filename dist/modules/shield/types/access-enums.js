"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventType = exports.RoleScope = exports.ResourceType = exports.PermissionAction = exports.MembershipStatus = exports.AccessType = exports.AccessAction = exports.AccessStatus = exports.AccessSourceType = exports.AccessRightStatus = void 0;
var AccessRightStatus;
(function (AccessRightStatus) {
    AccessRightStatus["VALID"] = "VALID";
    AccessRightStatus["USED"] = "USED";
    AccessRightStatus["EXPIRED"] = "EXPIRED";
    AccessRightStatus["CANCELLED"] = "CANCELLED";
    AccessRightStatus["TRANSFERRED"] = "TRANSFERRED";
    AccessRightStatus["REFUNDED"] = "REFUNDED";
    AccessRightStatus["BLOCKED"] = "BLOCKED";
    AccessRightStatus["PENDING"] = "PENDING";
    AccessRightStatus["SUSPENDED"] = "SUSPENDED";
})(AccessRightStatus || (exports.AccessRightStatus = AccessRightStatus = {}));
var AccessSourceType;
(function (AccessSourceType) {
    AccessSourceType["SUBSCRIPTION"] = "SUBSCRIPTION";
    AccessSourceType["TICKET"] = "TICKET";
    AccessSourceType["INVITATION"] = "INVITATION";
    AccessSourceType["STAFF_PASS"] = "STAFF_PASS";
    AccessSourceType["PRESS_PASS"] = "PRESS_PASS";
    AccessSourceType["VIP_PASS"] = "VIP_PASS";
    AccessSourceType["COMPLEMENTARY"] = "COMPLEMENTARY";
    AccessSourceType["SEASON_PASS"] = "SEASON_PASS";
    AccessSourceType["SPONSOR_PASS"] = "SPONSOR_PASS";
    AccessSourceType["ARTIST_PASS"] = "ARTIST_PASS";
})(AccessSourceType || (exports.AccessSourceType = AccessSourceType = {}));
var AccessStatus;
(function (AccessStatus) {
    AccessStatus["SUCCESS"] = "SUCCESS";
    AccessStatus["DENIED"] = "DENIED";
    AccessStatus["WARNING"] = "WARNING";
    AccessStatus["ERROR"] = "ERROR";
    AccessStatus["PARTIAL_SUCCESS"] = "PARTIAL_SUCCESS";
    AccessStatus["PENDING"] = "PENDING";
})(AccessStatus || (exports.AccessStatus = AccessStatus = {}));
var AccessAction;
(function (AccessAction) {
    AccessAction["ENTRY"] = "ENTRY";
    AccessAction["EXIT"] = "EXIT";
    AccessAction["RE_ENTRY"] = "RE_ENTRY";
    AccessAction["ZONE_CHANGE"] = "ZONE_CHANGE";
    AccessAction["VALIDATION"] = "VALIDATION";
    AccessAction["CHECK"] = "CHECK";
    AccessAction["TRANSFER"] = "TRANSFER";
})(AccessAction || (exports.AccessAction = AccessAction = {}));
var AccessType;
(function (AccessType) {
    AccessType["MAIN_ENTRANCE"] = "MAIN_ENTRANCE";
    AccessType["VIP_ENTRANCE"] = "VIP_ENTRANCE";
    AccessType["STAFF_ENTRANCE"] = "STAFF_ENTRANCE";
    AccessType["EMERGENCY_EXIT"] = "EMERGENCY_EXIT";
    AccessType["SERVICE_ENTRANCE"] = "SERVICE_ENTRANCE";
    AccessType["DISABLED_ENTRANCE"] = "DISABLED_ENTRANCE";
    AccessType["MEDIA_ENTRANCE"] = "MEDIA_ENTRANCE";
    AccessType["PLAYER_ENTRANCE"] = "PLAYER_ENTRANCE";
})(AccessType || (exports.AccessType = AccessType = {}));
var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["ACTIVE"] = "ACTIVE";
    MembershipStatus["PENDING"] = "PENDING";
    MembershipStatus["SUSPENDED"] = "SUSPENDED";
    MembershipStatus["EXPIRED"] = "EXPIRED";
    MembershipStatus["CANCELLED"] = "CANCELLED";
})(MembershipStatus || (exports.MembershipStatus = MembershipStatus = {}));
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["CREATE"] = "CREATE";
    PermissionAction["READ"] = "READ";
    PermissionAction["UPDATE"] = "UPDATE";
    PermissionAction["DELETE"] = "DELETE";
    PermissionAction["MANAGE"] = "MANAGE";
    PermissionAction["APPROVE"] = "APPROVE";
    PermissionAction["REJECT"] = "REJECT";
    PermissionAction["TRANSFER"] = "TRANSFER";
    PermissionAction["SUSPEND"] = "SUSPEND";
    PermissionAction["ACTIVATE"] = "ACTIVATE";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["USER"] = "USER";
    ResourceType["EVENT"] = "EVENT";
    ResourceType["VENUE"] = "VENUE";
    ResourceType["ORGANIZER"] = "ORGANIZER";
    ResourceType["TICKET"] = "TICKET";
    ResourceType["ORDER"] = "ORDER";
    ResourceType["SUBSCRIPTION"] = "SUBSCRIPTION";
    ResourceType["ACCESS_RIGHT"] = "ACCESS_RIGHT";
    ResourceType["ROLE"] = "ROLE";
    ResourceType["PERMISSION"] = "PERMISSION";
    ResourceType["ZONE"] = "ZONE";
    ResourceType["SEAT"] = "SEAT";
    ResourceType["GROUP"] = "GROUP";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var RoleScope;
(function (RoleScope) {
    RoleScope["SYSTEM"] = "SYSTEM";
    RoleScope["ORGANIZER"] = "ORGANIZER";
    RoleScope["VENUE"] = "VENUE";
    RoleScope["GROUP"] = "GROUP";
    RoleScope["EVENT"] = "EVENT";
})(RoleScope || (exports.RoleScope = RoleScope = {}));
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["ACCESS_GRANTED"] = "ACCESS_GRANTED";
    AuditEventType["ACCESS_DENIED"] = "ACCESS_DENIED";
    AuditEventType["PERMISSION_GRANTED"] = "PERMISSION_GRANTED";
    AuditEventType["PERMISSION_REVOKED"] = "PERMISSION_REVOKED";
    AuditEventType["ROLE_ASSIGNED"] = "ROLE_ASSIGNED";
    AuditEventType["ROLE_REMOVED"] = "ROLE_REMOVED";
    AuditEventType["ACCESS_RIGHT_CREATED"] = "ACCESS_RIGHT_CREATED";
    AuditEventType["ACCESS_RIGHT_USED"] = "ACCESS_RIGHT_USED";
    AuditEventType["ACCESS_RIGHT_EXPIRED"] = "ACCESS_RIGHT_EXPIRED";
    AuditEventType["UNAUTHORIZED_ATTEMPT"] = "UNAUTHORIZED_ATTEMPT";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
//# sourceMappingURL=access-enums.js.map