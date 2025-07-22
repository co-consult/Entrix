# Matrice de Traçabilité Bidirectionnelle - Entrix V2.1
## Liaison Spécifications Fonctionnelles ↔ Modèle de Données

---

## 1. TRAÇABILITÉ FONCTIONNALITÉ → TABLES/VUES

### 🔐 MODULE AUTHENTIFICATION & UTILISATEURS

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Inscription utilisateur** | `users`, `user_profiles` | `v_user_complete` | `update_timestamp_column()` | Création compte spectateur avec profil |
| **Connexion/Déconnexion** | `users`, `user_sessions`, `login_attempts` | - | `detect_suspicious_activity()` | Authentification sécurisée avec détection fraude |
| **Gestion profil** | `user_profiles` | `v_user_complete` | `update_timestamp_column()` | Modification données personnelles et préférences |
| **Rôles et permissions** | `roles`, `user_roles`, `groups`, `user_groups` | - | `is_admin()`, `is_organizer()` | Gestion droits d'accès hiérarchiques |
| **Dashboard utilisateur** | `tickets`, `subscriptions`, `orders` | `v_user_dashboard` | `get_user_dashboard_data()` | Vue consolidée activité utilisateur |
| **Programme fidélité** | `tickets`, `orders` | `v_user_dashboard` | - | Points calculés sur achats |

### 🏢 MODULE ORGANISATEURS

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Inscription organisateur** | `organizers` | `v_organizer_details` | `validate_organizer_business_rules()` | Demande validation avec documents |
| **Validation organisateur** | `organizers`, `audit_logs` | `v_organizer_details` | `validate_organizer()` | Processus approbation admin |
| **Dashboard organisateur** | `events`, `tickets`, `organizer_commissions` | `v_organizer_performance` | `update_organizer_stats()` | Statistiques et revenus |
| **Gestion équipe** | `user_groups`, `groups` | - | `can_manage_organizer()` | Permissions membres organisation |
| **Relations venues** | `venue_organizer_relations` | - | - | Propriété/gestion lieux |
| **Commission et facturation** | `organizer_commissions`, `payments` | `v_commission_summary` | `calculate_organizer_commission_rate()` | Calcul et suivi commissions |

### 📅 MODULE ÉVÉNEMENTS

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Création événement** | `events`, `event_categories` | `v_event_details` | `validate_event_business_rules()` | Planification avec venue et config |
| **Gestion participants** | `participants`, `event_participants` | `v_event_participants_full` | - | Invitations et confirmations |
| **Configuration billetterie** | `event_ticket_config`, `ticket_types` | - | `sync_event_config_organizer()` | Prix et disponibilités par zone |
| **Publication événement** | `events` | `v_event_details` | `auto_manage_event_status()` | Mise en ligne et ouverture ventes |
| **Programmation détaillée** | `event_schedules` | - | - | Planning segments événement |
| **Médias événement** | `event_media` | - | - | Photos, vidéos, documents |
| **Restrictions** | `event_restrictions` | - | - | Âge, dress code, sécurité |
| **Statistiques live** | `event_stats`, `access_control_log` | `v_event_analytics` | - | Suivi temps réel |

### 🏟️ MODULE VENUES & CARTOGRAPHIE

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Configuration venue** | `venues`, `venue_mappings` | `v_venue_details` | - | Paramétrage lieu et capacités |
| **Zonage et sièges** | `venue_zones`, `seats` | - | `sync_venue_capacity()` | Organisation hiérarchique espaces |
| **Points d'accès** | `access_points` | - | - | Entrées/sorties et sécurité |
| **Services et équipements** | `venue_amenities` | - | - | Restauration, parking, etc. |
| **Médias venue** | `venue_media` | - | - | Photos zones et vues sièges |
| **Disponibilités** | `events` | `v_venue_analytics` | - | Calendrier occupation |
| **Analytics venue** | `events`, `tickets` | `v_venue_analytics` | `calculate_venue_occupancy_rate()` | Performance et revenus |

### 🎫 MODULE BILLETTERIE

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Catalogue billets** | `ticket_types`, `event_ticket_config` | - | - | Types et configurations |
| **Achat billets** | `orders`, `order_items`, `tickets` | `v_order_details` | `calculate_order_totals()` | Processus achat complet |
| **Génération QR codes** | `access_rights` | - | `generate_access_codes()` | Création codes sécurisés |
| **Gestion abonnements** | `subscription_plans`, `subscriptions` | `v_subscription_details` | `sync_subscription_organizer()` | Souscription et suivi |
| **Transferts billets** | `tickets`, `access_rights`, `access_transactions_log` | `v_ticket_details` | `transfer_ticket()` | Cession entre utilisateurs |
| **Pricing dynamique** | `pricing_rules` | - | `calculate_pricing()` | Tarification intelligente |
| **Promotions** | `pricing_rules` | - | - | Codes promo et réductions |

### 🚪 MODULE CONTRÔLE D'ACCÈS

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Validation QR code** | `access_rights`, `access_control_log` | - | `validate_access_right()` | Scan et vérification entrée |
| **Gestion flux** | `access_control_log`, `access_points` | `v_access_control_stats` | - | Monitoring temps réel |
| **Blacklist** | `blacklist` | - | `check_blacklist()` | Exclusions et interdictions |
| **Incidents accès** | `access_control_log`, `security_events` | - | - | Gestion problèmes terrain |
| **Re-entry/Sorties** | `access_control_log` | - | - | Mouvements multiples |

### 💰 MODULE PAIEMENTS

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Méthodes paiement** | `payment_methods` | - | - | Flouci, CB, virements |
| **Transaction paiement** | `payments`, `payment_attempts` | `v_payment_summary` | `sync_payment_organizer()` | Processing sécurisé |
| **Remboursements** | `refunds` | - | - | Gestion annulations |
| **Webhooks** | `payment_webhooks` | - | - | Notifications passerelles |
| **Reconciliation** | `payments`, `organizer_commissions` | `v_financial_summary` | - | Rapprochement comptable |

### 📊 MODULE REPORTING

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Dashboard admin** | Multiple | `v_dashboard_admin` | - | Vue globale plateforme |
| **Analytics événements** | `events`, `tickets` | `v_event_analytics` | `generate_event_report()` | Performance détaillée |
| **Reporting financier** | `payments`, `organizer_commissions` | `v_financial_summary` | - | Revenus et marges |
| **Analytics billetterie** | `tickets`, `orders` | `v_ticket_analytics` | - | Ventes et tendances |
| **Performance organisateurs** | `organizers`, `events` | `v_organizer_performance` | `get_organizer_stats()` | KPIs par organisateur |

### 🔒 MODULE SÉCURITÉ

| Fonctionnalité | Tables Principales | Vues Utilisées | Triggers/Fonctions | Description |
|----------------|-------------------|----------------|-------------------|-------------|
| **Audit trail** | `audit_logs` | - | `audit_table_changes()` | Traçabilité complète |
| **Détection fraude** | `login_attempts`, `security_events` | - | `detect_suspicious_activity()` | Monitoring anomalies |
| **MFA** | `mfa_tokens` | - | - | Double authentification |
| **Rate limiting** | `rate_limiting` | - | - | Protection API |
| **RLS** | Toutes tables | - | Multiple fonctions RLS | Sécurité niveau ligne |

---

## 2. TRAÇABILITÉ TABLE/VUE → FONCTIONNALITÉS

### 📋 TABLES PRINCIPALES

| Table | Module Principal | Fonctionnalités Servies | Criticité |
|-------|-----------------|------------------------|-----------|
| **users** | Authentification | Inscription, connexion, profil, tous modules | 🔴 Critique |
| **organizers** | Organisateurs | Gestion événements, commissions, relations venues | 🔴 Critique |
| **events** | Événements | Création, publication, billetterie, analytics | 🔴 Critique |
| **tickets** | Billetterie | Achat, transfert, contrôle accès | 🔴 Critique |
| **access_rights** | Contrôle Accès | Validation entrée, QR codes, traçabilité | 🔴 Critique |
| **orders** | Paiements | Panier, checkout, facturation | 🔴 Critique |
| **payments** | Paiements | Transactions, remboursements, reconciliation | 🔴 Critique |
| **venues** | Venues | Configuration lieux, disponibilités | 🟡 Important |
| **participants** | Événements | Équipes, artistes, speakers | 🟡 Important |
| **subscriptions** | Billetterie | Abonnements saison, fidélisation | 🟡 Important |
| **blacklist** | Sécurité | Exclusions, interdictions accès | 🟡 Important |
| **audit_logs** | Sécurité | Traçabilité, conformité GDPR | 🟡 Important |

### 📊 VUES PRINCIPALES

| Vue | Module Principal | Fonctionnalités Servies | Usage |
|-----|-----------------|------------------------|-------|
| **v_user_dashboard** | Utilisateurs | Dashboard personnel, historique | Interface utilisateur |
| **v_organizer_performance** | Organisateurs | KPIs, revenus, analytics | Dashboard organisateur |
| **v_event_details** | Événements | Fiche événement complète | Pages publiques |
| **v_event_analytics** | Reporting | Statistiques ventes, performance | Analytics organisateur |
| **v_venue_details** | Venues | Configuration, disponibilités | Gestion venues |
| **v_ticket_details** | Billetterie | Détails billet avec QR | Emails, impression |
| **v_order_details** | Paiements | Récapitulatif commande | Facturation |
| **v_dashboard_admin** | Administration | Métriques globales plateforme | Supervision |
| **v_financial_summary** | Finance | Revenus, commissions, marges | Comptabilité |

### 🔧 FONCTIONS CRITIQUES

| Fonction | Module | Usage | Impact |
|----------|--------|-------|--------|
| **validate_access_right()** | Contrôle Accès | Validation QR temps réel | Performance critique événement |
| **calculate_pricing()** | Billetterie | Tarification dynamique | Revenue optimization |
| **transfer_ticket()** | Billetterie | Transfert sécurisé billets | Expérience utilisateur |
| **calculate_organizer_commission_rate()** | Finance | Calcul commissions | Facturation mensuelle |
| **check_blacklist()** | Sécurité | Vérification exclusions | Sécurité événements |
| **get_upcoming_events()** | Événements | Liste événements filtrés | Pages principales |

---

## 3. MATRICE RÈGLES MÉTIER ↔ CONTRAINTES TECHNIQUES

| Règle Métier | Implémentation Technique | Type | Localisation |
|--------------|-------------------------|------|--------------|
| Un organisateur doit être validé pour créer des événements | `organizers.status = 'ACTIVE'` | Trigger | `validate_event_business_rules()` |
| Un utilisateur ne peut avoir qu'un abonnement actif par organisateur | Index unique partiel | Contrainte | `uk_subscriptions_user_organizer_active` |
| Les billets VIP incluent parking gratuit | Métadonnées JSON | Logique app | `ticket_types.metadata` |
| Commission organisateur entre 5-18% selon type | Check constraint + fonction | Mixte | `check_organizers_commission_rate` |
| Âge minimum 13 ans pour inscription | Check constraint | Base données | `chk_user_profiles_birth_date` |
| QR code unique par billet | Unique constraint | Base données | `uk_access_rights_qr_code` |
| Place ne peut être vendue 2 fois | Trigger | Base données | `prevent_seat_double_booking()` |
| Remboursement max J-7 événement | Logique métier | Application | Service remboursement |
| Capacité événement ≤ capacité venue | Check + Trigger | Base données | `check_capacity_consistency()` |
| Session réservation 15 minutes | Configuration | Application | `order.expires_at` |

---

## 4. FLUX DE DONNÉES PAR CAS D'USAGE

### 🛒 CAS D'USAGE : ACHAT DE BILLET

```
1. Sélection événement
   → SELECT FROM v_event_details WHERE status='PUBLISHED'
   
2. Choix places
   → SELECT FROM venue_zones, seats WHERE available
   → INSERT INTO orders (status='DRAFT')
   
3. Ajout panier
   → INSERT INTO order_items
   → UPDATE orders SET total_amount
   
4. Paiement
   → INSERT INTO payments
   → UPDATE orders SET status='CONFIRMED'
   
5. Génération billets
   → INSERT INTO tickets
   → INSERT INTO access_rights
   → TRIGGER generate_access_codes()
   
6. Confirmation
   → SELECT FROM v_ticket_details
   → Email avec QR codes
```

### 🎟️ CAS D'USAGE : CONTRÔLE D'ACCÈS

```
1. Scan QR Code
   → SELECT validate_access_right(qr_code)
   
2. Vérification
   → CHECK blacklist
   → CHECK access_rights status
   → CHECK event timing
   
3. Autorisation/Refus
   → INSERT INTO access_control_log
   → UPDATE access_rights.current_uses
   
4. Monitoring
   → UPDATE event_stats
   → TRIGGER suspicious activity alerts
```

---

## 5. IMPACT DES MODIFICATIONS

### 🔄 MATRICE D'IMPACT CHANGEMENTS

| Modification | Tables Impactées | Vues à Recalculer | Risques |
|--------------|------------------|-------------------|---------|
| Ajout type organisateur | `organizers` | `v_organizer_details`, `v_organizer_performance` | Faible |
| Changement calcul commission | `organizer_commissions` | `v_commission_summary`, `v_financial_summary` | Moyen |
| Nouveau type de billet | `ticket_types` | `v_ticket_details`, `v_ticket_analytics` | Faible |
| Modification RLS | Toutes tables | Toutes vues | Élevé |
| Ajout zone venue | `venue_zones`, `seats` | `v_venue_details` | Moyen |
| Nouvelle méthode paiement | `payment_methods` | `v_payment_summary` | Faible |

---

## 6. OPTIMISATIONS CROSS-FONCTIONNELLES

| Optimisation | Tables Concernées | Bénéfice | Index/Technique |
|--------------|------------------|----------|----------------|
| Recherche événements | `events`, `venues`, `organizers` | Performance page d'accueil | `idx_events_api_public` |
| Dashboard temps réel | Vues matérialisées suggérées | Réduction charge DB | `v_dashboard_*` → MATERIALIZED |
| Validation accès | `access_rights` | <1 sec validation | `idx_access_rights_qr_code` |
| Calcul commissions | `organizer_commissions` | Batch mensuel optimisé | `idx_organizer_commissions_organizer_status` |
| Analytics venue | `events`, `tickets` | Rapports instantanés | Indexes temporels multiples |

---

## 7. DOCUMENTATION DES JOINTURES CRITIQUES

### 🔗 JOINTURES FRÉQUENTES

```sql
-- Jointure critique 1: Événement complet
events e
JOIN organizers o ON e.organizer_id = o.id
JOIN venues v ON e.venue_id = v.id
JOIN event_categories ec ON e.category_id = ec.id

-- Jointure critique 2: Billet avec accès
tickets t
JOIN users u ON t.user_id = u.id
JOIN events e ON t.event_id = e.id
JOIN access_rights ar ON t.id = ar.ticket_id

-- Jointure critique 3: Commande complète
orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN payments p ON o.id = p.order_id
LEFT JOIN users u ON o.user_id = u.id
```

---

## 8. GLOSSAIRE MÉTIER ↔ TECHNIQUE

| Terme Métier | Nom Technique | Type | Description |
|--------------|---------------|------|-------------|
| Spectateur | `users` | Table | Utilisateur achetant des billets |
| Club/Producteur | `organizers` | Table | Entité organisant des événements |
| Match/Concert | `events` | Table | Instance d'événement |
| Tribune/Zone | `venue_zones` | Table | Espace dans un lieu |
| Place | `seats` | Table | Siège individuel numéroté |
| Billet | `tickets` + `access_rights` | Tables | Droit d'accès à un événement |
| Abonnement | `subscriptions` | Table | Accès multiple événements |
| Carte supporter | `subscription_plans` | Table | Type d'abonnement |
| Virement organisateur | `organizer_commissions` | Table | Paiement des revenus |
| Liste noire | `blacklist` | Table | Interdictions d'accès |

---

Cette matrice de traçabilité garantit que chaque fonctionnalité est correctement mappée aux éléments du modèle de données et vice-versa, facilitant la maintenance et l'évolution du système.