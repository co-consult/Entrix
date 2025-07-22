# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
| Event Code | `EVT_YYYY_MM_XXXXX` | `EVT_2025_07_00123` | Année + mois + séquence |
| Payment Ref | `PAY_YYYYMMDD_XXXXX` | `PAY_20250704_98765` | Date + séquence jour |
| Organizer Code | `ORG_YYYY_XXXXX` | `ORG_2025_00042` | Année + séquence année |

### Formats de Validation

| Champ | Format | Regex | Exemple Valide |
|-------|--------|-------|----------------|
| Email | Standard RFC 5322 | `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
 | `supporter@entrix.tn` |
| Téléphone | International | `^[+]?[1-9][0-9]{7,14}# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
 | `+21698765432` |
| Code Postal TN | 4 chiffres | `^[0-9]{4}# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
 | `1000` |
| RNIS | Matricule fiscal | `^[0-9]{7}[A-Z]{3}[0-9]{3}# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
 | `1234567ABC000` |
| RIB Tunisie | 20 chiffres | `^[0-9]{20}# Dictionnaire de Données Unifié - Entrix V2.1
## Correspondance Métier ↔ Technique avec Règles de Gestion

---

## 1. ENTITÉS PRINCIPALES

### 👤 UTILISATEUR / USER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Spectateur** | `users` | Table principale | - | Personne physique achetant des billets |
| Identifiant unique | `users.id` | UUID | PK, NOT NULL | Généré automatiquement, jamais modifiable |
| Adresse email | `users.email` | VARCHAR(255) | UNIQUE, NOT NULL | Format email valide, utilisé pour connexion |
| Mot de passe | `users.password` | VARCHAR(255) | NOT NULL | Min 8 caractères, hashé BCrypt |
| Prénom | `users.first_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Nom | `users.last_name` | VARCHAR(100) | NOT NULL | Caractères alphabétiques + accents |
| Téléphone mobile | `users.phone` | VARCHAR(20) | NULL | Format international, utilisé pour SMS |
| Photo de profil | `users.avatar` | TEXT | NULL | URL stockage cloud, max 5MB |
| Compte actif | `users.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = accès bloqué plateforme |
| Email vérifié | `users.email_verified` | TIMESTAMPTZ | NULL | NULL = non vérifié, date = vérifié |
| Date inscription | `users.created_at` | TIMESTAMPTZ | NOT NULL | Horodatage création compte |
| Dernière connexion | `users.last_login` | TIMESTAMPTZ | NULL | MAJ à chaque connexion réussie |

#### Profil Étendu

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Date de naissance | `user_profiles.date_of_birth` | DATE | NULL | Âge minimum 13 ans à l'inscription |
| Genre | `user_profiles.gender` | ENUM | NULL | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY |
| Ville résidence | `user_profiles.city` | VARCHAR(100) | NULL | Pour statistiques et suggestions |
| Pays | `user_profiles.country` | VARCHAR(2) | DEFAULT 'TN' | Code ISO 2 lettres |
| Langue préférée | `user_profiles.language` | VARCHAR(5) | DEFAULT 'fr' | fr, ar, en principalement |
| Supporter depuis | `user_profiles.supporter_since` | DATE | NULL | Date début supporterisme |
| Contact urgence | `user_profiles.emergency_contact` | JSONB | NULL | {name, phone, relationship} |

---

### 🏢 ORGANISATEUR / ORGANIZER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Organisateur événement** | `organizers` | Table principale | - | Entité légale organisant des événements |
| Code organisateur | `organizers.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: ORG_YYYY_XXXXX |
| Nom commercial | `organizers.name` | VARCHAR(200) | NOT NULL | Nom affiché publiquement |
| Type organisateur | `organizers.type` | ENUM | NOT NULL | SPORTS_CLUB, CULTURAL_PRODUCER, etc. |
| Statut validation | `organizers.status` | ENUM | DEFAULT 'PENDING' | PENDING → ACTIVE (validation manuelle) |
| Email contact | `organizers.contact_email` | VARCHAR(255) | NOT NULL | Contact principal notifications |
| Commission plateforme | `organizers.commission_rate` | DECIMAL(5,4) | DEFAULT 0.12 | 5-18% selon type et volume |
| Délai paiement | `organizers.payment_terms` | INTEGER | DEFAULT 15 | Jours avant virement |
| Total événements | `organizers.total_events_organized` | INTEGER | DEFAULT 0 | Calculé automatiquement |
| CA total généré | `organizers.total_revenue_generated` | DECIMAL(15,2) | DEFAULT 0 | MAJ après chaque paiement |
| Note satisfaction | `organizers.average_satisfaction_score` | DECIMAL(3,2) | NULL | Sur 10, calculé sur feedbacks |
| Validé par | `organizers.validated_by` | UUID | FK users | Admin ayant validé |
| Date validation | `organizers.validated_at` | TIMESTAMPTZ | NULL | NULL = non validé |

#### Informations Légales

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| Raison sociale | `organizers.legal_name` | VARCHAR(300) | NULL | Nom légal complet |
| Matricule fiscal | `organizers.rnis` | VARCHAR(20) | NULL | Registre National tunisien |
| Documents légaux | `organizers.legal_documents` | JSONB | NULL | {type, url, validity_date} |
| Coordonnées bancaires | `organizers.banking_details` | JSONB | NULL | {rib, bank_name, swift} - crypté |
| Assurances | `organizers.insurance_info` | JSONB | NULL | {type, policy_number, expiry} |

---

### 📅 ÉVÉNEMENT / EVENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Match/Concert/Conférence** | `events` | Table principale | - | Instance unique d'événement |
| Code événement | `events.code` | VARCHAR(100) | UNIQUE, NOT NULL | Format: EVT_YYYY_MM_XXXXX |
| Titre événement | `events.name` | VARCHAR(200) | NOT NULL | Titre public affiché |
| Organisateur | `events.organizer_id` | UUID | FK, NOT NULL | Lien obligatoire vers organisateur |
| Lieu | `events.venue_id` | VARCHAR(255) | FK, NOT NULL | Venue sélectionné |
| Configuration lieu | `events.mapping_id` | VARCHAR(255) | FK, NOT NULL | Config spécifique du venue |
| Date/heure début | `events.scheduled_start` | TIMESTAMPTZ | NOT NULL | Heure officielle début |
| Date/heure fin | `events.scheduled_end` | TIMESTAMPTZ | NOT NULL | Doit être > scheduled_start |
| Statut événement | `events.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→PUBLISHED→LIVE→FINISHED |
| Visibilité | `events.visibility` | ENUM | DEFAULT 'PUBLIC' | PUBLIC, PRIVATE, MEMBERS_ONLY, etc. |
| Capacité maximale | `events.max_capacity` | INTEGER | NULL | Ne peut excéder capacité venue |
| Ouverture ventes | `events.sales_start` | TIMESTAMPTZ | NULL | Début commercialisation billets |
| Fermeture ventes | `events.sales_end` | TIMESTAMPTZ | NULL | Fin vente (généralement H-2) |
| Mis en avant | `events.is_featured` | BOOLEAN | DEFAULT FALSE | Affichage prioritaire homepage |

---

### 🎫 BILLET / TICKET

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Billet spectateur** | `tickets` | Table principale | - | Droit d'accès individuel |
| Numéro billet | `tickets.ticket_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: TKT_YYYYMMDD_XXXXXX |
| Propriétaire | `tickets.user_id` | UUID | FK, NOT NULL | Utilisateur détenteur actuel |
| Événement | `tickets.event_id` | UUID | FK, NOT NULL | Événement concerné |
| Type billet | `tickets.ticket_type_id` | UUID | FK, NOT NULL | Catégorie tarifaire |
| Zone venue | `tickets.zone_id` | VARCHAR(255) | FK, NULL | Zone si placement libre |
| Place assignée | `tickets.seat_id` | VARCHAR(255) | FK, NULL | Siège si numéroté |
| Prix payé | `tickets.price_paid` | DECIMAL(10,2) | NOT NULL | Montant réellement payé |
| Actif | `tickets.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = annulé/remboursé |

#### Droit d'Accès Associé

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **QR Code** | `access_rights.qr_code` | VARCHAR(255) | UNIQUE, NOT NULL | Code unique crypté |
| Code sécurité | `access_rights.access_code` | VARCHAR(100) | UNIQUE, NOT NULL | Code backup si QR illisible |
| Statut accès | `access_rights.status` | ENUM | DEFAULT 'VALID' | VALID→USED/EXPIRED/CANCELLED |
| Valide du | `access_rights.valid_from` | TIMESTAMPTZ | NOT NULL | Généralement J-24h événement |
| Valide jusqu'au | `access_rights.valid_until` | TIMESTAMPTZ | NOT NULL | Généralement J+6h événement |
| Utilisations max | `access_rights.max_uses` | INTEGER | DEFAULT 1 | 1 pour billets, plus pour pass |
| Utilisations actuelles | `access_rights.current_uses` | INTEGER | DEFAULT 0 | Incrémenté à chaque scan |
| Première utilisation | `access_rights.used_at` | TIMESTAMPTZ | NULL | Horodatage premier scan |

---

### 🏟️ LIEU / VENUE

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Stade/Salle/Théâtre** | `venues` | Table principale | - | Lieu physique accueillant événements |
| Nom du lieu | `venues.name` | VARCHAR(200) | NOT NULL | Nom commercial connu |
| Slug URL | `venues.slug` | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly pour pages web |
| Adresse complète | `venues.address` | TEXT | NOT NULL | Adresse postale complète |
| Ville | `venues.city` | VARCHAR(100) | NOT NULL | Pour filtres recherche |
| Capacité maximale | `venues.max_capacity` | INTEGER | NOT NULL | Capacité totale tous publics |
| Propriétaire principal | `venues.primary_owner_id` | UUID | FK organizers | Propriétaire légal |
| Gestionnaire principal | `venues.primary_manager_id` | UUID | FK organizers | Exploitant opérationnel |
| Actif | `venues.is_active` | BOOLEAN | DEFAULT TRUE | FALSE = fermé/indisponible |

#### Configuration (Mapping)

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Configuration usage** | `venue_mappings` | Table | - | Agencement selon type événement |
| Type configuration | `venue_mappings.mapping_type` | ENUM | NOT NULL | DEFAULT, EVENT_SPECIFIC, etc. |
| Capacité effective | `venue_mappings.effective_capacity` | INTEGER | NOT NULL | ≤ venue.max_capacity |
| Catégories événements | `venue_mappings.event_categories` | TEXT[] | NULL | Types événements supportés |

#### Zones

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Tribune/Secteur** | `venue_zones` | Table | - | Division logique du lieu |
| Nom zone | `venue_zones.name` | VARCHAR(200) | NOT NULL | Ex: "Tribune Nord", "Orchestre" |
| Type zone | `venue_zones.zone_type` | ENUM | NOT NULL | SEATING_AREA, VIP_AREA, etc. |
| Catégorie tarifaire | `venue_zones.category` | ENUM | NOT NULL | PREMIUM, STANDARD, BASIC, etc. |
| Capacité zone | `venue_zones.capacity` | INTEGER | NOT NULL | Nombre places/personnes max |
| Prix de base | `venue_zones.base_price` | DECIMAL(10,2) | DEFAULT 0 | Prix référence pour événements |
| Accessible PMR | `venue_zones.is_accessible` | BOOLEAN | DEFAULT FALSE | Accès handicapés |

---

## 2. TRANSACTIONS ET FLUX

### 🛒 COMMANDE / ORDER

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Panier/Commande** | `orders` | Table principale | - | Transaction d'achat |
| Numéro commande | `orders.order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: ORD_YYYYMMDD_XXXXX |
| Client | `orders.user_id` | UUID | FK, NULL | NULL si achat invité |
| Organisateur principal | `orders.primary_organizer_id` | UUID | FK | Calculé automatiquement |
| Statut commande | `orders.status` | ENUM | DEFAULT 'DRAFT' | DRAFT→CONFIRMED→COMPLETED |
| Montant HT | `orders.subtotal_amount` | DECIMAL(10,2) | DEFAULT 0 | Somme articles avant réductions |
| Réduction | `orders.discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Total réductions appliquées |
| Frais service | `orders.processing_fee` | DECIMAL(10,2) | DEFAULT 0 | Frais plateforme client |
| Total TTC | `orders.total_amount` | DECIMAL(10,2) | DEFAULT 0 | Montant final à payer |
| Canal d'achat | `orders.purchase_channel` | ENUM | DEFAULT 'WEB' | WEB, MOBILE_APP, COUNTER, etc. |
| Expire le | `orders.expires_at` | TIMESTAMPTZ | NULL | Libération panier si non payé |

---

### 💳 PAIEMENT / PAYMENT

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Transaction bancaire** | `payments` | Table principale | - | Paiement effectif |
| Référence paiement | `payments.payment_number` | VARCHAR(50) | UNIQUE, NOT NULL | Format: PAY_YYYYMMDD_XXXXX |
| Commande liée | `payments.order_id` | UUID | FK, NOT NULL | Commande payée |
| Méthode paiement | `payments.payment_method_id` | UUID | FK, NOT NULL | Flouci, CB, etc. |
| Montant | `payments.amount` | DECIMAL(10,2) | NOT NULL | Montant débité |
| Statut | `payments.status` | ENUM | DEFAULT 'PENDING' | PENDING→COMPLETED/FAILED |
| ID transaction externe | `payments.external_transaction_id` | VARCHAR(100) | UNIQUE | Référence passerelle |
| Frais processing | `payments.processing_fee` | DECIMAL(8,2) | DEFAULT 0 | Commission passerelle |
| Net perçu | `payments.net_amount` | DECIMAL(10,2) | NOT NULL | amount - processing_fee |
| Date paiement | `payments.payment_date` | TIMESTAMPTZ | NULL | Horodatage confirmation |

---

### 💰 COMMISSION / COMMISSION

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Commission Entrix** | `organizer_commissions` | Table | - | Part plateforme sur ventes |
| Organisateur | `organizer_commissions.organizer_id` | UUID | FK, NOT NULL | Bénéficiaire net |
| Type commission | `organizer_commissions.commission_type` | VARCHAR(30) | NOT NULL | STANDARD, PREMIUM, etc. |
| Montant de base | `organizer_commissions.base_amount` | DECIMAL(10,2) | NOT NULL | CA avant commission |
| Taux commission | `organizer_commissions.commission_rate` | DECIMAL(5,4) | NULL | Ex: 0.1200 = 12% |
| Montant commission | `organizer_commissions.commission_amount` | DECIMAL(10,2) | NOT NULL | Part Entrix |
| Frais plateforme | `organizer_commissions.platform_fee` | DECIMAL(10,2) | NOT NULL | Frais fixes additionnels |
| Net organisateur | `organizer_commissions.net_to_organizer` | DECIMAL(10,2) | NOT NULL | Montant à verser |
| Statut | `organizer_commissions.status` | ENUM | DEFAULT 'PENDING' | PENDING→CALCULATED→PAID |
| Date paiement due | `organizer_commissions.payment_due_date` | DATE | NOT NULL | Échéance virement |

---

## 3. CONTRÔLE ET SÉCURITÉ

### 🚪 CONTRÔLE D'ACCÈS / ACCESS CONTROL

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Scan entrée** | `access_control_log` | Table log | - | Journal contrôles physiques |
| Droit d'accès scanné | `access_control_log.access_right_id` | UUID | FK, NOT NULL | QR code présenté |
| Point d'accès | `access_control_log.access_point_id` | VARCHAR(255) | FK | Porte/tournique utilisé |
| Action | `access_control_log.action` | ENUM | NOT NULL | ENTRY, EXIT, RE_ENTRY, etc. |
| Résultat | `access_control_log.result` | ENUM | NOT NULL | SUCCESS, DENIED, WARNING |
| Motif refus | `access_control_log.denial_reason` | ENUM | NULL | Si refusé : EXPIRED, ALREADY_USED... |
| Appareil contrôle | `access_control_log.controller_device` | VARCHAR(100) | NULL | ID scanner/smartphone |
| Heure scan | `access_control_log.scanned_at` | TIMESTAMPTZ | NOT NULL | Horodatage précis |

---

### 🚫 LISTE NOIRE / BLACKLIST

| Terme Métier | Nom Technique | Type | Contraintes | Règles de Gestion |
|--------------|---------------|------|-------------|-------------------|
| **Interdiction accès** | `blacklist` | Table | - | Exclusions sécurité |
| Type exclusion | `blacklist.type` | ENUM | NOT NULL | USER, EMAIL, PHONE, IP, etc. |
| Valeur | `blacklist.value` | VARCHAR(255) | NOT NULL | Valeur à bloquer |
| Portée | `blacklist.scope` | ENUM | NOT NULL | EVENT, VENUE, ORGANIZER, GLOBAL |
| Cible événement | `blacklist.target_event_id` | UUID | FK | Si scope = EVENT |
| Cible organisateur | `blacklist.organizer_id` | UUID | FK | Si scope = ORGANIZER |
| Motif | `blacklist.reason` | VARCHAR(100) | NOT NULL | Raison interdiction |
| Gravité | `blacklist.severity` | ENUM | DEFAULT 'MEDIUM' | INFO→LOW→MEDIUM→HIGH→CRITICAL |
| Valide jusqu'au | `blacklist.valid_until` | TIMESTAMPTZ | NULL | NULL = permanent |
| Statut appel | `blacklist.appeal_status` | ENUM | DEFAULT 'NONE' | NONE→PENDING→ACCEPTED/REJECTED |

---

## 4. ÉNUMÉRATIONS MÉTIER

### Types d'Organisateurs

| Valeur Technique | Libellé Métier | Description | Commission Base |
|------------------|----------------|-------------|-----------------|
| `SPORTS_CLUB` | Club sportif | CA, EST, CSS, etc. | 12% |
| `CULTURAL_PRODUCER` | Producteur culturel | Festivals, concerts | 15% |
| `CORPORATE` | Entreprise | Événements B2B | 18% |
| `ASSOCIATION` | Association | ONG, caritatif | 5% |
| `FEDERATION` | Fédération | Sportive nationale | 10% |
| `INSTITUTION` | Institution publique | Ministères, mairies | 8% |
| `PRIVATE_COMPANY` | Société privée | Organisateur pro | 15% |

### Statuts Événement

| Valeur Technique | Libellé Métier | Description | Actions Possibles |
|------------------|----------------|-------------|-------------------|
| `DRAFT` | Brouillon | En création | Toutes modifications |
| `SCHEDULED` | Programmé | Dates confirmées | Modif limitées |
| `PUBLISHED` | Publié | Vente ouverte | Config billetterie seule |
| `LIVE` | En cours | Événement actif | Monitoring seul |
| `FINISHED` | Terminé | Événement fini | Lecture seule |
| `CANCELLED` | Annulé | Ne se fera pas | Remboursements |
| `POSTPONED` | Reporté | Nouvelle date à venir | Report billets |

### Méthodes de Paiement

| Valeur Technique | Libellé Métier | Frais | Délai Crédit |
|------------------|----------------|-------|--------------|
| `MOBILE_WALLET` | Flouci | 2.5% | J+1 |
| `CREDIT_CARD` | Carte bancaire | 2.8% | J+2 |
| `BANK_TRANSFER` | Virement | 0% | J+3 |
| `CASH` | Espèces | 0% | Immédiat |

---

## 5. RÈGLES DE CALCUL

### Calcul Commission Organisateur

```sql
commission_rate = base_rate 
  - volume_bonus      -- Si CA > seuils
  - loyalty_bonus     -- Si ancienneté
  + penalty_rate      -- Si incidents

commission_amount = base_amount * commission_rate
platform_fee = fixed_fee_per_transaction
net_to_organizer = base_amount - commission_amount - platform_fee
```

### Calcul Capacité Événement

```sql
event.max_capacity = MIN(
  venue_mapping.effective_capacity,
  SUM(venue_zones.capacity WHERE active),
  regulatory_max_capacity
)
```

### Calcul Prix Billet Final

```sql
final_price = ticket_type.base_price
  * zone.price_modifier          -- Coefficient zone
  * event.price_modifier          -- Coefficient événement
  - promotional_discount          -- Réductions
  + seat.premium_supplement       -- Si siège premium
  + processing_fee                -- Frais service
```

---

## 6. FORMATS ET PATTERNS

### Formats Identifiants

| Type | Pattern | Exemple | Règle Génération |
|------|---------|---------|------------------|
| User ID | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` | Auto PostgreSQL |
| Order Number | `ORD_YYYYMMDD_XXXXX` | `ORD_20250704_12345` | Date + séquence jour |
| Ticket Number | `TKT_YYYYMMDD_XXXXXX` | `TKT_20250704_123456` | Date + séquence jour |
| QR Code | `QR_XXXXXXXXXXXX` | `QR_A1B2C3D4E5F6` | 12 chars aléatoires |
 | `01234567890123456789` |

---

## 7. DONNÉES CALCULÉES ET DÉRIVÉES

### Champs Calculés Automatiquement

| Donnée Métier | Calcul | Déclencheur | Stockage |
|---------------|--------|-------------|----------|
| **Âge utilisateur** | `DATE_PART('year', AGE(date_of_birth))` | À la volée | Vue `v_user_complete` |
| **Points fidélité** | `COUNT(tickets) * 10` | À la volée | Vue `v_user_dashboard` |
| **Taux remplissage** | `(tickets_sold / max_capacity) * 100` | Temps réel | Vue `v_event_analytics` |
| **Commission nette** | Voir formule section 5 | Trigger sur payment | Table `organizer_commissions` |
| **Durée abonnement** | `end_date - start_date` | À la création | Vue `v_subscription_details` |
| **Organisateur favori** | MAX(COUNT) par user | À la volée | Vue `v_user_dashboard` |
| **Revenus organisateur** | SUM(net_to_organizer) | Trigger payment | Table `organizers` |

### Agrégations Temporelles

| Métrique | Période | Calcul | Usage |
|----------|---------|--------|-------|
| **CA mensuel** | Mois | `SUM(payments.amount) GROUP BY month` | Reporting finance |
| **Nouveaux users** | 30 jours | `COUNT(*) WHERE created_at > NOW()-30d` | Dashboard admin |
| **Taux conversion** | Période | `(buyers / visitors) * 100` | Analytics |
| **Pic affluence** | Heure | `MAX(COUNT) GROUP BY hour` | Capacity planning |

---

## 8. MÉTADONNÉES ET DONNÉES NON-STRUCTURÉES

### Champs JSONB Principaux

| Table.Champ | Structure Type | Exemple | Usage |
|-------------|---------------|---------|-------|
| **users.preferences** | Préférences UI/UX | `{"theme": "dark", "notifications": {"email": true, "sms": false}}` | Personnalisation |
| **organizers.legal_documents** | Documents légaux | `[{"type": "license", "url": "s3://...", "expiry": "2026-12-31"}]` | Conformité |
| **organizers.banking_details** | Infos bancaires | `{"rib": "encrypted...", "bank": "BIAT", "swift": "BIATTNTT"}` | Paiements |
| **events.pricing_config** | Config tarifaire | `{"early_bird": {"discount": 20, "until": "2025-06-01"}}` | Tarification |
| **events.restrictions** | Restrictions | `{"age_minimum": 16, "dress_code": "casual", "prohibited": ["weapons"]}` | Règlement |
| **tickets.ticket_metadata** | Infos additionnelles | `{"special_needs": "wheelchair", "dietary": "vegetarian"}` | Services |
| **access_rights.special_permissions** | Droits spéciaux | `{"vip_lounge": true, "backstage": false, "parking": "VIP"}` | Privilèges |

### Données Binaires/Médias

| Type Média | Stockage | Taille Max | Formats Acceptés | CDN |
|------------|----------|------------|------------------|-----|
| Photos profil | S3/CloudFront | 5 MB | JPG, PNG, WEBP | Oui |
| Logos organisateurs | S3/CloudFront | 2 MB | PNG, SVG | Oui |
| Affiches événements | S3/CloudFront | 10 MB | JPG, PNG, PDF | Oui |
| Photos venues | S3/CloudFront | 8 MB | JPG, PNG, WEBP | Oui |
| Documents légaux | S3 sécurisé | 20 MB | PDF | Non |

---

## 9. DONNÉES SENSIBLES ET SÉCURITÉ

### Classification Données

| Niveau | Type de Données | Exemples | Protection |
|--------|----------------|----------|------------|
| **🔴 Critique** | PII financières | RIB, cartes bancaires | Chiffrement AES-256 + Tokenisation |
| **🟠 Sensible** | PII personnelles | Email, téléphone, adresse | Chiffrement + RLS strict |
| **🟡 Interne** | Données business | Commissions, analytics | RLS + Audit trail |
| **🟢 Public** | Infos événements | Noms, dates, lieux | Cache CDN |

### Données Soumises à GDPR

| Donnée | Droit Utilisateur | Implémentation | Délai |
|--------|------------------|----------------|-------|
| Profil personnel | Accès | Export JSON via API | 24h |
| Historique achats | Portabilité | Export CSV structuré | 48h |
| Préférences marketing | Modification | Interface utilisateur | Immédiat |
| Compte complet | Effacement | Anonymisation (pas suppression) | 30 jours |
| Données paiement | Rectification | Support + validation | 5 jours |

---

## 10. CONTRAINTES D'INTÉGRITÉ RÉFÉRENTIELLE

### Règles de Suppression (CASCADE/RESTRICT)

| Relation Parent → Enfant | Action DELETE | Justification |
|-------------------------|---------------|---------------|
| users → tickets | RESTRICT | Garder historique |
| users → user_profiles | CASCADE | Profil lié au compte |
| organizers → events | RESTRICT | Intégrité historique |
| events → tickets | RESTRICT | Traçabilité financière |
| venues → events | RESTRICT | Cohérence planning |
| orders → order_items | CASCADE | Détails liés commande |
| payments → refunds | RESTRICT | Audit trail financier |

### Contraintes Métier Complexes

| Règle | Implémentation | Vérification |
|-------|----------------|--------------|
| Un user = 1 abonnement actif/organisateur | Index unique partiel | `uk_subscriptions_user_organizer_active` |
| Place vendue une seule fois | Trigger | `prevent_seat_double_booking()` |
| Capacité événement ≤ venue | Check + Trigger | `check_capacity_consistency()` |
| Commission 5-18% | Check constraint | `chk_organizers_commission_rate` |
| Dates événement cohérentes | Check constraint | `chk_events_scheduled_dates` |

---

## 11. ÉVOLUTION ET VERSIONING

### Stratégie de Versioning

| Élément | Convention | Exemple | Migration |
|---------|-----------|---------|-----------|
| Tables | Suffixe _v2 si breaking | `users` → `users_v2` | Script migration |
| Colonnes | Ajout sans suppression | `phone` → `phone` + `phone_v2` | Période transition |
| Enums | Ajout valeurs only | Jamais supprimer | Compatible ascending |
| Vues | Versioning dans nom | `v_user_dashboard_v2` | Parallel run |

### Données d'Audit

| Action | Table Audit | Données Capturées | Rétention |
|--------|-------------|-------------------|-----------|
| CREATE | `audit_logs` | New values + user + IP | 7 ans |
| UPDATE | `audit_logs` | Old + new values + user | 7 ans |
| DELETE | `audit_logs` | Old values + reason | 10 ans |
| LOGIN | `login_attempts` | User + IP + result | 1 an |
| ACCESS | `access_control_log` | All scan attempts | 2 ans |

---

## 12. GLOSSAIRE ACRONYMES TECHNIQUES

| Acronyme | Signification | Contexte Entrix |
|----------|---------------|-----------------|
| **PK** | Primary Key | Identifiant unique table |
| **FK** | Foreign Key | Référence autre table |
| **UUID** | Universally Unique ID | Format ID principal |
| **JSONB** | JSON Binary | Données semi-structurées |
| **RLS** | Row Level Security | Sécurité niveau ligne |
| **RBAC** | Role Based Access Control | Gestion permissions |
| **QR** | Quick Response | Codes barres 2D billets |
| **CA** | Chiffre d'Affaires | Revenus totaux |
| **TTC** | Toutes Taxes Comprises | Prix final client |
| **HT** | Hors Taxes | Prix avant taxes |
| **J+N** | Jour + N | Délai en jours |
| **KPI** | Key Performance Indicator | Indicateur performance |
| **API** | Application Programming Interface | Interface programmation |
| **CDN** | Content Delivery Network | Distribution contenu |
| **S3** | Simple Storage Service | Stockage AWS |

---

Ce dictionnaire unifié établit une correspondance claire et complète entre les concepts métier et leur implémentation technique, facilitant la communication entre équipes fonctionnelles et techniques.