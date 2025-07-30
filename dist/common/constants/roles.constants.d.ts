export declare const ROLE_CODES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ADMIN: "ADMIN";
    readonly ORGANIZER_ADMIN: "ORGANIZER_ADMIN";
    readonly ORGANIZER_MANAGER: "ORGANIZER_MANAGER";
    readonly VENUE_ADMIN: "VENUE_ADMIN";
    readonly VENUE_MANAGER: "VENUE_MANAGER";
    readonly SECURITY_MANAGER: "SECURITY_MANAGER";
    readonly SUPPORT_AGENT: "SUPPORT_AGENT";
    readonly VALIDATOR: "VALIDATOR";
    readonly STAFF: "STAFF";
    readonly VIP_GOLD: "VIP_GOLD";
    readonly SUBSCRIBER: "SUBSCRIBER";
    readonly USER: "USER";
};
export declare const SYSTEM_ROLES: {
    readonly SUPER_ADMIN: {
        readonly code: "SUPER_ADMIN";
        readonly name: "Super Administrateur";
        readonly description: "Accès complet au système - Administration totale";
        readonly level: 100;
        readonly isActive: true;
        readonly permissions: readonly ("users.create" | "users.read" | "users.update" | "users.delete" | "users.read.self" | "users.update.self" | "users.read.all" | "users.update.all" | "users.delete.all" | "users.profile.update" | "users.profile.view" | "users.profile.view.all" | "users.activate" | "users.deactivate" | "users.suspend" | "users.verify.email" | "users.verify.phone" | "users.password.reset" | "users.password.force_change" | "users.roles.assign" | "users.roles.remove" | "users.roles.view" | "users.import" | "users.export" | "users.bulk" | "users.search" | "users.search.advanced" | "roles.create" | "roles.read" | "roles.update" | "roles.delete" | "roles.permissions.manage" | "roles.permissions.view" | "roles.permissions.assign" | "groups.create" | "groups.read" | "groups.update" | "groups.delete" | "groups.members.manage" | "roles.assign.users" | "roles.assign.bulk" | "roles.hierarchy.manage" | "auth.login" | "auth.logout" | "auth.refresh" | "auth.mfa.enable" | "auth.mfa.disable" | "auth.mfa.verify" | "auth.mfa.backup_codes" | "auth.sessions.view" | "auth.sessions.manage" | "auth.sessions.terminate" | "auth.sessions.terminate.all" | "auth.login_attempts.view" | "auth.blacklist.manage" | "auth.security_events.view" | "auth.security_policies.manage" | "organizers.create" | "organizers.read" | "organizers.update" | "organizers.delete" | "organizers.read.own" | "organizers.update.own" | "organizers.manage.own" | "organizers.validate" | "organizers.suspend" | "organizers.activate" | "organizers.approve" | "organizers.reject" | "organizers.venues.manage" | "organizers.venues.assign" | "organizers.team.manage" | "organizers.team.invite" | "organizers.team.remove" | "events.create" | "events.read" | "events.update" | "events.delete" | "events.create.own" | "events.read.own" | "events.update.own" | "events.delete.own" | "events.publish" | "events.cancel" | "events.postpone" | "events.reschedule" | "events.participants.manage" | "events.participants.add" | "events.participants.remove" | "events.ticketing.configure" | "events.pricing.manage" | "events.zones.manage" | "ticketing.sell" | "ticketing.manual_sales" | "ticketing.bulk_sales" | "ticketing.pricing.configure" | "ticketing.templates.manage" | "ticketing.zones.configure" | "ticketing.refunds.process" | "ticketing.refunds.approve" | "ticketing.refunds.view" | "access.scan_qr" | "access.manual_entry" | "access.logs.view" | "access.rights.manage" | "ticketing.reports.sales" | "ticketing.reports.access" | "ticketing.reports.export" | "venues.create" | "venues.read" | "venues.update" | "venues.delete" | "venues.manage.own" | "venues.configure.own" | "venues.mappings.edit" | "venues.zones.manage" | "venues.seating.configure" | "venues.access_points.manage" | "venues.amenities.manage" | "venues.media.upload" | "venues.media.manage" | "finance.payments.process" | "finance.payments.view" | "finance.payments.refund" | "finance.commissions.view" | "finance.commissions.calculate" | "finance.commissions.approve" | "finance.reports.view" | "finance.reports.export" | "finance.revenue.view" | "finance.refunds.initiate" | "finance.refunds.approve" | "finance.refunds.process" | "system.settings.manage" | "system.settings.view" | "system.integrations.configure" | "system.audit.view" | "system.audit.export" | "system.audit.settings" | "system.metrics.view" | "system.health.view" | "system.monitoring.manage" | "system.backup.create" | "system.backup.restore" | "system.backup.manage" | "system.apis.manage" | "system.webhooks.configure" | "system.apis.logs")[];
    };
    readonly ADMIN: {
        readonly code: "ADMIN";
        readonly name: "Administrateur";
        readonly description: "Administration de la plateforme - Gestion utilisateurs et organisateurs";
        readonly level: 90;
        readonly isActive: true;
        readonly permissions: readonly [...("users.create" | "users.read" | "users.update" | "users.delete" | "users.read.self" | "users.update.self" | "users.read.all" | "users.update.all" | "users.delete.all" | "users.profile.update" | "users.profile.view" | "users.profile.view.all" | "users.activate" | "users.deactivate" | "users.suspend" | "users.verify.email" | "users.verify.phone" | "users.password.reset" | "users.password.force_change" | "users.roles.assign" | "users.roles.remove" | "users.roles.view" | "users.import" | "users.export" | "users.bulk" | "users.search" | "users.search.advanced" | "roles.read" | "roles.update" | "roles.permissions.view" | "groups.read" | "groups.update" | "groups.members.manage" | "roles.assign.users" | "auth.login" | "auth.logout" | "auth.refresh" | "auth.mfa.enable" | "auth.mfa.disable" | "auth.mfa.verify" | "auth.mfa.backup_codes" | "auth.sessions.view" | "auth.sessions.manage" | "auth.sessions.terminate" | "auth.sessions.terminate.all" | "auth.login_attempts.view" | "auth.blacklist.manage" | "auth.security_events.view" | "auth.security_policies.manage" | "organizers.create" | "organizers.read" | "organizers.update" | "organizers.delete" | "organizers.read.own" | "organizers.update.own" | "organizers.manage.own" | "organizers.validate" | "organizers.suspend" | "organizers.activate" | "organizers.approve" | "organizers.reject" | "organizers.venues.manage" | "organizers.venues.assign" | "organizers.team.manage" | "organizers.team.invite" | "organizers.team.remove")[], "events.read", "events.update", "events.cancel", "events.postpone", "venues.read", "venues.update", "finance.payments.view", "finance.commissions.view", "finance.reports.view", "system.settings.manage", "system.audit.view", "system.metrics.view"];
    };
    readonly ORGANIZER_ADMIN: {
        readonly code: "ORGANIZER_ADMIN";
        readonly name: "Administrateur Organisateur";
        readonly description: "Administration complète d'une organisation - Gestion événements et équipe";
        readonly level: 80;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.view", "users.search", "organizers.read.own", "organizers.update.own", "organizers.manage.own", "organizers.team.manage", "organizers.team.invite", "organizers.team.remove", "organizers.venues.manage", ...("events.create" | "events.read" | "events.update" | "events.delete" | "events.create.own" | "events.read.own" | "events.update.own" | "events.delete.own" | "events.publish" | "events.cancel" | "events.postpone" | "events.reschedule" | "events.participants.manage" | "events.participants.add" | "events.participants.remove" | "events.ticketing.configure" | "events.pricing.manage" | "events.zones.manage" | "ticketing.sell" | "ticketing.manual_sales" | "ticketing.bulk_sales" | "ticketing.pricing.configure" | "ticketing.templates.manage" | "ticketing.zones.configure" | "ticketing.refunds.process" | "ticketing.refunds.approve" | "ticketing.refunds.view" | "access.scan_qr" | "access.manual_entry" | "access.logs.view" | "access.rights.manage" | "ticketing.reports.sales" | "ticketing.reports.access" | "ticketing.reports.export")[], "venues.manage.own", "venues.configure.own", "venues.mappings.edit", "venues.zones.manage", "finance.payments.view", "finance.commissions.view", "finance.revenue.view", "finance.reports.view", "finance.refunds.initiate"];
    };
    readonly ORGANIZER_MANAGER: {
        readonly code: "ORGANIZER_MANAGER";
        readonly name: "Manager Organisateur";
        readonly description: "Gestion opérationnelle des événements - Création et billetterie";
        readonly level: 70;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.view", "organizers.read.own", "organizers.update.own", "events.create.own", "events.read.own", "events.update.own", "events.publish", "events.participants.manage", "events.ticketing.configure", "events.pricing.manage", "ticketing.sell", "ticketing.pricing.configure", "ticketing.zones.configure", "ticketing.refunds.view", "ticketing.reports.sales", "venues.read", "venues.manage.own", "finance.payments.view", "finance.revenue.view"];
    };
    readonly VENUE_ADMIN: {
        readonly code: "VENUE_ADMIN";
        readonly name: "Administrateur Venue";
        readonly description: "Administration complète d'un lieu - Configuration et gestion";
        readonly level: 60;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.view", ...("venues.create" | "venues.read" | "venues.update" | "venues.delete" | "venues.manage.own" | "venues.configure.own" | "venues.mappings.edit" | "venues.zones.manage" | "venues.seating.configure" | "venues.access_points.manage" | "venues.amenities.manage" | "venues.media.upload" | "venues.media.manage")[], "events.read", "events.participants.manage", "access.scan_qr", "access.manual_entry", "access.logs.view", "access.rights.manage", "ticketing.reports.access"];
    };
    readonly VENUE_MANAGER: {
        readonly code: "VENUE_MANAGER";
        readonly name: "Manager Venue";
        readonly description: "Gestion opérationnelle d'un lieu - Événements et accès";
        readonly level: 50;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "venues.read", "venues.manage.own", "venues.zones.manage", "venues.access_points.manage", "events.read", "access.scan_qr", "access.manual_entry", "access.logs.view"];
    };
    readonly SECURITY_MANAGER: {
        readonly code: "SECURITY_MANAGER";
        readonly name: "Responsable Sécurité";
        readonly description: "Gestion de la sécurité - Contrôle d'accès et incidents";
        readonly level: 52;
        readonly isActive: true;
        readonly permissions: readonly ["auth.login_attempts.view", "auth.blacklist.manage", "auth.security_events.view", "auth.sessions.view", "access.scan_qr", "access.manual_entry", "access.logs.view", "access.rights.manage", "users.read", "users.profile.view", "users.suspend", "system.audit.view"];
    };
    readonly SUPPORT_AGENT: {
        readonly code: "SUPPORT_AGENT";
        readonly name: "Agent Support";
        readonly description: "Support client - Assistance utilisateurs et résolution incidents";
        readonly level: 40;
        readonly isActive: true;
        readonly permissions: readonly ["users.read", "users.profile.view", "users.password.reset", "users.verify.email", "users.verify.phone", "users.search", "ticketing.reports.sales", "ticketing.refunds.view", "ticketing.refunds.process", "events.read", "finance.payments.view", "finance.refunds.initiate"];
    };
    readonly VALIDATOR: {
        readonly code: "VALIDATOR";
        readonly name: "Validateur";
        readonly description: "Validation de contenus - Modération et approbation";
        readonly level: 30;
        readonly isActive: true;
        readonly permissions: readonly ["organizers.read", "organizers.validate", "organizers.approve", "organizers.reject", "events.read", "events.update", "venues.read", "venues.update"];
    };
    readonly STAFF: {
        readonly code: "STAFF";
        readonly name: "Personnel";
        readonly description: "Personnel terrain - Accès aux outils opérationnels quotidiens";
        readonly level: 28;
        readonly isActive: true;
        readonly permissions: readonly ["access.scan_qr", "access.manual_entry", "events.read", "users.read.self", "users.update.self"];
    };
    readonly VIP_GOLD: {
        readonly code: "VIP_GOLD";
        readonly name: "VIP Gold";
        readonly description: "Membres VIP premium - Accès privilèges et services exclusifs";
        readonly level: 12;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.update", "events.read", "ticketing.sell"];
    };
    readonly SUBSCRIBER: {
        readonly code: "SUBSCRIBER";
        readonly name: "Abonné";
        readonly description: "Abonnés réguliers - Accès prioritaire billetterie et contenus";
        readonly level: 11;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.update", "events.read", "ticketing.sell"];
    };
    readonly USER: {
        readonly code: "USER";
        readonly name: "Utilisateur";
        readonly description: "Utilisateurs standards - Accès de base aux fonctionnalités publiques";
        readonly level: 10;
        readonly isActive: true;
        readonly permissions: readonly ["users.read.self", "users.update.self", "users.profile.update", "events.read", "ticketing.sell"];
    };
};
export declare const ROLE_HIERARCHY: ("ADMIN" | "USER" | "SUPER_ADMIN" | "ORGANIZER_ADMIN" | "ORGANIZER_MANAGER" | "VENUE_ADMIN" | "VENUE_MANAGER" | "SECURITY_MANAGER" | "SUPPORT_AGENT" | "VALIDATOR" | "STAFF" | "VIP_GOLD" | "SUBSCRIBER")[];
export declare const ADMIN_ROLES: ("ADMIN" | "USER" | "SUPER_ADMIN" | "ORGANIZER_ADMIN" | "ORGANIZER_MANAGER" | "VENUE_ADMIN" | "VENUE_MANAGER" | "SECURITY_MANAGER" | "SUPPORT_AGENT" | "VALIDATOR" | "STAFF" | "VIP_GOLD" | "SUBSCRIBER")[];
export declare const ORGANIZER_ROLES: ("ORGANIZER_ADMIN" | "ORGANIZER_MANAGER")[];
export declare const VENUE_ROLES: ("VENUE_ADMIN" | "VENUE_MANAGER")[];
export declare const END_USER_ROLES: ("USER" | "VIP_GOLD" | "SUBSCRIBER")[];
export declare const canAssignRole: (assignerRoleCode: string, targetRoleCode: string) => boolean;
export declare const getAssignableRoles: (roleCode: string) => string[];
export type RoleCode = keyof typeof SYSTEM_ROLES;
