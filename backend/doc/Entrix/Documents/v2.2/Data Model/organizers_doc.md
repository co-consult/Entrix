# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Organisateurs

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère les entités organisatrices d'événements : entreprises, associations, institutions publiques qui utilisent la plateforme Entrix pour organiser et commercialiser leurs événements. Il constitue l'épine dorsale commerciale de la plateforme.

### Principes de conception
- **Validation rigoureuse** : Processus de vetting complet des organisateurs
- **Flexibilité organisationnelle** : Support de structures diverses 
- **Commission adaptative** : Modèles tarifaires personnalisés
- **Écosystème partenaires** : Relations inter-organisateurs

---

## 🏢 Table `organizers` - Organisateurs

**Description** : Entités commerciales et institutionnelles qui organisent des événements sur la plateforme Entrix.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | - | Code organisateur unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom commercial public |
| `legal_name` | VARCHAR(200) | NOT NULL | - | Raison sociale officielle |
| `type` | ENUM | NOT NULL | - | Type d'organisateur |
| `registration_number` | VARCHAR(100) | NULL | - | N° registre commerce |
| `tax_id` | VARCHAR(50) | NULL | - | Identifiant fiscal tunisien |
| `founded_date` | DATE | NULL | - | Date de fondation |
| `description` | TEXT | NULL | - | Description publique |
| `logo_url` | TEXT | NULL | - | Logo organisateur |
| `cover_image_url` | TEXT | NULL | - | Image de couverture |
| `website` | VARCHAR(255) | NULL | - | Site web officiel |
| `email` | VARCHAR(255) | NOT NULL | - | Email contact principal |
| `phone` | VARCHAR(20) | NOT NULL | - | Téléphone principal |
| `address_line1` | VARCHAR(255) | NOT NULL | - | Adresse ligne 1 |
| `address_line2` | VARCHAR(255) | NULL | - | Adresse ligne 2 |
| `city` | VARCHAR(100) | NOT NULL | - | Ville siège |
| `postal_code` | VARCHAR(20) | NULL | - | Code postal |
| `country` | VARCHAR(2) | DEFAULT 'TN' | 'TN' | Code pays ISO |
| `primary_contact_id` | UUID | NULL, FK | - | Contact principal |
| `backup_contact_id` | UUID | NULL, FK | - | Contact de secours |
| `status` | ENUM | NOT NULL | 'PENDING' | Statut validation |
| `verification_level` | ENUM | NOT NULL | 'BASIC' | Niveau vérification |
| `commission_rate` | DECIMAL(5,4) | DEFAULT 0.10 | 0.1000 | Taux commission (10%) |
| `payment_delay_days` | INTEGER | DEFAULT 15 | 15 | Délai paiement J+15 |
| `payment_method` | ENUM | DEFAULT 'BANK_TRANSFER' | - | Méthode paiement préférée |
| `min_payout_amount` | DECIMAL(10,2) | DEFAULT 100.00 | 100.00 | Montant minimum virement |
| `legal_documents` | JSONB | NULL | - | Documents légaux |
| `banking_details` | JSONB | NULL | - | Infos bancaires chiffrées |
| `contract_details` | JSONB | NULL | - | Détails contrat |
| `business_metrics` | JSONB | NULL | - | Métriques calculées |
| `settings` | JSONB | NULL | - | Paramètres organisateur |
| `social_media` | JSONB | NULL | - | Réseaux sociaux |
| `categories` | TEXT[] | NULL | - | Catégories événements |
| `tags` | TEXT[] | NULL | - | Tags organisateur |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Mise en avant |
| `is_verified` | BOOLEAN | NOT NULL | FALSE | Vérifié par Entrix |
| `is_premium` | BOOLEAN | NOT NULL | FALSE | Compte premium |
| `verified_at` | TIMESTAMPTZ | NULL | - | Date validation |
| `verified_by` | UUID | NULL, FK | - | Validé par (admin) |
| `suspended_at` | TIMESTAMPTZ | NULL | - | Date suspension |
| `suspension_reason` | TEXT | NULL | - | Motif suspension |
| `total_events` | INTEGER | DEFAULT 0 | 0 | Nombre total événements |
| `total_revenue` | DECIMAL(12,2) | DEFAULT 0 | 0.00 | CA total généré |
| `total_attendees` | INTEGER | DEFAULT 0 | 0 | Total participants |
| `avg_rating` | DECIMAL(3,2) | NULL | - | Note moyenne (0-5) |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `type`
- `SPORTS_CLUB` : Club sportif professionnel
- `CULTURAL_PRODUCER` : Producteur culturel (concerts, théâtre)
- `FESTIVAL_ORGANIZER` : Organisateur de festivals
- `CORPORATE` : Entreprise (événements corporate)
- `ASSOCIATION` : Association à but non lucratif
- `GOVERNMENT` : Entité gouvernementale
- `EDUCATIONAL` : Institution éducative (universités, écoles)
- `RELIGIOUS` : Organisation religieuse
- `CHARITY` : Organisation caritative
- `MEDIA_COMPANY` : Entreprise médiatique
- `VENUE_OPERATOR` : Opérateur de lieux
- `OTHER` : Autre type d'organisateur

#### `status`
- `PENDING` : En attente de validation
- `UNDER_REVIEW` : En cours d'examen
- `APPROVED` : Approuvé et actif
- `CONDITIONAL` : Approuvé avec conditions
- `SUSPENDED` : Temporairement suspendu
- `REJECTED` : Demande rejetée
- `BANNED` : Banni définitivement
- `INACTIVE` : Inactif temporairement

#### `verification_level`
- `BASIC` : Vérification basique
- `STANDARD` : Vérification standard
- `ENHANCED` : Vérification renforcée
- `PREMIUM` : Vérification premium
- `INSTITUTIONAL` : Vérification institutionnelle

#### `payment_method`
- `BANK_TRANSFER` : Virement bancaire
- `MOBILE_MONEY` : Paiement mobile (Flouci)
- `CHECK` : Chèque
- `CASH` : Espèces (petits montants)
- `CRYPTO` : Cryptomonnaies

### Structure JSONB détaillées

#### `legal_documents`
```json
{
  "commercial_register": {
    "number": "B123456789",
    "issued_date": "2020-01-15",
    "expiry_date": "2030-01-15",
    "file_url": "https://secure.entrix.tn/docs/org123/rc_2020.pdf",
    "verified": true,
    "verified_at": "2024-01-15T10:00:00Z"
  },
  "tax_certificate": {
    "number": "TF987654321",
    "issued_date": "2024-12-01",
    "expiry_date": "2025-12-01",
    "file_url": "https://secure.entrix.tn/docs/org123/tf_2024.pdf",
    "verified": true
  },
  "insurance": {
    "provider": "Assurances STAR",
    "policy_number": "EVT2025/1234",
    "coverage_amount": 1000000,
    "currency": "TND",
    "valid_until": "2025-12-31",
    "file_url": "https://secure.entrix.tn/docs/org123/insurance.pdf"
  },
  "id_documents": {
    "passport": "L1234567",
    "national_id": "12345678",
    "verified": true
  }
}
```

#### `banking_details` (chiffré)
```json
{
  "primary_account": {
    "bank_name": "Banque de Tunisie",
    "account_holder": "CLUB AFRICAIN",
    "iban": "TN59 XXXX XXXX XXXX XXXX XXXX",
    "bic": "BTUBTNTT",
    "currency": "TND",
    "is_primary": true,
    "verified": true
  },
  "backup_account": {
    "bank_name": "Attijari Bank",
    "iban": "TN59 YYYY YYYY YYYY YYYY YYYY",
    "currency": "TND",
    "is_primary": false
  },
  "mobile_money": {
    "provider": "Flouci",
    "phone": "+21612345678",
    "verified": true
  }
}
```

#### `business_metrics`
```json
{
  "performance": {
    "events_last_12m": 45,
    "revenue_last_12m": 125000.00,
    "avg_ticket_price": 35.50,
    "conversion_rate": 0.78,
    "cancellation_rate": 0.02
  },
  "audience": {
    "total_followers": 15000,
    "repeat_customers": 3500,
    "avg_age": 28,
    "gender_split": {"male": 60, "female": 40}
  },
  "financials": {
    "commission_paid_ytd": 12500.00,
    "pending_payouts": 2500.00,
    "credit_score": 85,
    "payment_reliability": 0.98
  }
}
```

#### `settings`
```json
{
  "notifications": {
    "email_sales_reports": true,
    "sms_urgent_alerts": true,
    "weekly_summary": true,
    "event_reminders": true
  },
  "billing": {
    "auto_payout": true,
    "invoice_email": "finance@clubafricain.tn",
    "preferred_currency": "TND",
    "tax_inclusive_pricing": true
  },
  "branding": {
    "custom_colors": {"primary": "#FF0000", "secondary": "#FFFFFF"},
    "logo_position": "top_left",
    "show_entrix_branding": true
  },
  "operations": {
    "auto_confirm_events": false,
    "require_approval_threshold": 1000.00,
    "max_concurrent_events": 5,
    "default_refund_policy": "flexible"
  }
}
```

---

## 👥 Table `organizer_contacts` - Contacts organisateur

**Description** : Personnes de contact au sein de l'organisation pour différents aspects opérationnels.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Référence organisateur |
| `user_id` | UUID | NULL, FK | - | Compte utilisateur lié |
| `first_name` | VARCHAR(100) | NOT NULL | - | Prénom |
| `last_name` | VARCHAR(100) | NOT NULL | - | Nom |
| `title` | VARCHAR(100) | NULL | - | Titre/poste |
| `department` | VARCHAR(100) | NULL | - | Département |
| `email` | VARCHAR(255) | NOT NULL | - | Email professionnel |
| `phone` | VARCHAR(20) | NOT NULL | - | Téléphone |
| `mobile` | VARCHAR(20) | NULL | - | Mobile |
| `role` | ENUM | NOT NULL | - | Rôle dans organisation |
| `responsibilities` | TEXT[] | NULL | - | Responsabilités |
| `emergency_contact` | BOOLEAN | NOT NULL | FALSE | Contact d'urgence |
| `is_primary` | BOOLEAN | NOT NULL | FALSE | Contact principal |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Contact actif |
| `languages` | VARCHAR(10)[] | NULL | - | Langues parlées |
| `timezone` | VARCHAR(50) | DEFAULT 'Africa/Tunis' | - | Fuseau horaire |
| `availability` | JSONB | NULL | - | Disponibilités |
| `notes` | TEXT | NULL | - | Notes internes |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `role`

- `CEO` : Directeur général
- `MANAGER` : Directeur/Manager
- `OPERATIONS` : Responsable opérations
- `MARKETING` : Responsable marketing
- `FINANCE` : Responsable financier
- `TECHNICAL` : Responsable technique
- `LEGAL` : Responsable juridique
- `CUSTOMER_SERVICE` : Service client
- `EVENT_COORDINATOR` : Coordinateur événements
- `SECURITY` : Responsable sécurité
- `MEDIA` : Relations médias
- `OTHER` : Autre rôle

---

## 🤝 Table `organizer_partnerships` - Partenariats

**Description** : Relations de partenariat entre organisateurs pour événements collaboratifs ou réseaux.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `primary_organizer_id` | UUID | NOT NULL, FK | - | Organisateur principal |
| `partner_organizer_id` | UUID | NOT NULL, FK | - | Organisateur partenaire |
| `partnership_type` | ENUM | NOT NULL | - | Type partenariat |
| `name` | VARCHAR(200) | NOT NULL | - | Nom partenariat |
| `description` | TEXT | NULL | - | Description |
| `status` | ENUM | NOT NULL | 'PROPOSED' | Statut partenariat |
| `revenue_split` | JSONB | NOT NULL | - | Répartition revenus |
| `responsibilities` | JSONB | NOT NULL | - | Répartition responsabilités |
| `contract_terms` | JSONB | NULL | - | Termes contractuels |
| `start_date` | DATE | NOT NULL | - | Début partenariat |
| `end_date` | DATE | NULL | - | Fin partenariat |
| `auto_renew` | BOOLEAN | NOT NULL | FALSE | Renouvellement auto |
| `exclusive` | BOOLEAN | NOT NULL | FALSE | Partenariat exclusif |
| `created_by` | UUID | NOT NULL, FK | - | Créé par |
| `approved_by_primary` | UUID | NULL, FK | - | Approuvé par principal |
| `approved_by_partner` | UUID | NULL, FK | - | Approuvé par partenaire |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Partenariat actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `partnership_type`
- `EVENT_COLLABORATION` : Collaboration événementielle
- `VENUE_SHARING` : Partage de lieux
- `CROSS_PROMOTION` : Promotion croisée
- `TECHNICAL_PARTNERSHIP` : Partenariat technique
- `SPONSOR_NETWORK` : Réseau sponsors
- `MEDIA_PARTNERSHIP` : Partenariat médias
- `EDUCATIONAL` : Partenariat éducatif
- `STRATEGIC_ALLIANCE` : Alliance stratégique

#### `status`
- `PROPOSED` : Proposé
- `UNDER_NEGOTIATION` : En négociation
- `PENDING_APPROVAL` : En attente approbation
- `ACTIVE` : Actif
- `SUSPENDED` : Suspendu
- `TERMINATED` : Terminé
- `EXPIRED` : Expiré

---

## 📊 Table `organizer_commissions` - Historique commissions

**Description** : Calculs et historique des commissions dues par les organisateurs à la plateforme.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Référence organisateur |
| `period_start` | DATE | NOT NULL | - | Début période |
| `period_end` | DATE | NOT NULL | - | Fin période |
| `total_sales` | DECIMAL(12,2) | NOT NULL | 0.00 | Ventes totales période |
| `commission_rate` | DECIMAL(5,4) | NOT NULL | - | Taux commission appliqué |
| `commission_amount` | DECIMAL(12,2) | NOT NULL | 0.00 | Montant commission |
| `payment_fees` | DECIMAL(12,2) | NOT NULL | 0.00 | Frais paiement |
| `refund_adjustments` | DECIMAL(12,2) | DEFAULT 0.00 | 0.00 | Ajustements remboursements |
| `bonus_earnings` | DECIMAL(12,2) | DEFAULT 0.00 | 0.00 | Bonus performance |
| `penalty_deductions` | DECIMAL(12,2) | DEFAULT 0.00 | 0.00 | Pénalités déduites |
| `net_amount` | DECIMAL(12,2) | NOT NULL | 0.00 | Montant net dû |
| `currency` | VARCHAR(3) | NOT NULL | 'TND' | Devise |
| `status` | ENUM | NOT NULL | 'CALCULATED' | Statut commission |
| `invoice_number` | VARCHAR(50) | NULL | - | N° facture |
| `invoice_date` | DATE | NULL | - | Date facture |
| `payment_due_date` | DATE | NULL | - | Échéance paiement |
| `paid_amount` | DECIMAL(12,2) | DEFAULT 0.00 | 0.00 | Montant payé |
| `paid_at` | TIMESTAMPTZ | NULL | - | Date paiement |
| `payment_reference` | VARCHAR(100) | NULL | - | Référence paiement |
| `payment_method` | ENUM | NULL | - | Méthode paiement |
| `breakdown` | JSONB | NULL | - | Détail calculs |
| `notes` | TEXT | NULL | - | Notes |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM `status`

- `CALCULATED` : Calculée
- `INVOICED` : Facturée
- `PAID` : Payée
- `PARTIALLY_PAID` : Partiellement payée
- `OVERDUE` : En retard
- `DISPUTED` : Contestée
- `WAIVED` : Annulée
- `ADJUSTED` : Ajustée

---

## 📈 Table `organizer_ratings` - Évaluations organisateurs

**Description** : Système d'évaluation des organisateurs par les participants pour maintenir la qualité.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `organizer_id` | UUID | NOT NULL, FK | - | Organisateur évalué |
| `user_id` | UUID | NOT NULL, FK | - | Utilisateur évaluateur |
| `event_id` | UUID | NULL, FK | - | Événement concerné |
| `overall_rating` | INTEGER | NOT NULL | - | Note globale (1-5) |
| `organization_rating` | INTEGER | NULL | - | Note organisation |
| `communication_rating` | INTEGER | NULL | - | Note communication |
| `value_rating` | INTEGER | NULL | - | Note rapport qualité/prix |
| `venue_rating` | INTEGER | NULL | - | Note lieu |
| `service_rating` | INTEGER | NULL | - | Note service |
| `comment` | TEXT | NULL | - | Commentaire |
| `pros` | TEXT[] | NULL | - | Points positifs |
| `cons` | TEXT[] | NULL | - | Points négatifs |
| `would_recommend` | BOOLEAN | NULL | - | Recommanderait |
| `would_attend_again` | BOOLEAN | NULL | - | Participerait à nouveau |
| `is_verified` | BOOLEAN | NOT NULL | FALSE | Évaluation vérifiée |
| `is_anonymous` | BOOLEAN | NOT NULL | FALSE | Évaluation anonyme |
| `helpful_votes` | INTEGER | NOT NULL | 0 | Votes utiles |
| `total_votes` | INTEGER | NOT NULL | 0 | Total votes |
| `flagged_count` | INTEGER | NOT NULL | 0 | Signalements |
| `moderated_at` | TIMESTAMPTZ | NULL | - | Date modération |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Organisateurs ↔ Contacts
ALTER TABLE organizer_contacts 
ADD CONSTRAINT fk_contacts_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

-- Organisateurs ↔ Utilisateurs (contact principal)
ALTER TABLE organizers 
ADD CONSTRAINT fk_organizers_primary_contact 
FOREIGN KEY (primary_contact_id) REFERENCES organizer_contacts(id) ON DELETE SET NULL;

-- Partenariats ↔ Organisateurs
ALTER TABLE organizer_partnerships 
ADD CONSTRAINT fk_partnerships_primary 
FOREIGN KEY (primary_organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

ALTER TABLE organizer_partnerships 
ADD CONSTRAINT fk_partnerships_partner 
FOREIGN KEY (partner_organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;

-- Commissions ↔ Organisateurs
ALTER TABLE organizer_commissions 
ADD CONSTRAINT fk_commissions_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE RESTRICT;

-- Évaluations ↔ Organisateurs
ALTER TABLE organizer_ratings 
ADD CONSTRAINT fk_ratings_organizer 
FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE;
```

### Contraintes de validation

```sql
-- Code organisateur format valide
ALTER TABLE organizers ADD CONSTRAINT chk_organizer_code_format 
CHECK (code ~* '^[A-Z0-9_-]{3,20}$');

-- Email format valide
ALTER TABLE organizers ADD CONSTRAINT chk_organizer_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Commission rate dans limites raisonnables
ALTER TABLE organizers ADD CONSTRAINT chk_commission_rate_bounds 
CHECK (commission_rate >= 0.0000 AND commission_rate <= 0.5000);

-- Notes entre 1 et 5
ALTER TABLE organizer_ratings ADD CONSTRAINT chk_rating_bounds 
CHECK (overall_rating >= 1 AND overall_rating <= 5);

-- Dates partenariat cohérentes
ALTER TABLE organizer_partnerships ADD CONSTRAINT chk_partnership_dates 
CHECK (end_date IS NULL OR end_date > start_date);
```

### Index de performance

```sql
-- Recherche organisateurs actifs
CREATE INDEX idx_organizers_active ON organizers(status, is_verified) 
WHERE status = 'APPROVED';

-- Recherche par code/nom
CREATE INDEX idx_organizers_search ON organizers USING gin(
  to_tsvector('french', name || ' ' || COALESCE(description, ''))
);

-- Performance commissions
CREATE INDEX idx_commissions_period ON organizer_commissions(
  organizer_id, period_start, period_end
);

-- Évaluations par organisateur
CREATE INDEX idx_ratings_organizer_recent ON organizer_ratings(
  organizer_id, created_at DESC
);
```

---

## 📊 Métriques et KPIs

### Indicateurs de croissance
- **Nouveaux organisateurs/mois** : Acquisition
- **Taux d'approbation** : % candidatures acceptées
- **Time to approval** : Délai moyen validation
- **Rétention organisateurs** : % actifs après 12 mois

### Indicateurs de performance
- **Événements par organisateur** : Productivité moyenne
- **Revenus par organisateur** : Performance commerciale
- **Taux de commission moyen** : Profitabilité plateforme
- **Satisfaction utilisateurs** : Notes moyennes par organisateur

### Indicateurs de qualité
- **Taux d'annulation** : % événements annulés
- **Réclamations clients** : Nombre par organisateur
- **Délais de paiement** : Respect échéances
- **Score compliance** : Respect règles plateforme

Cette documentation couvre la gestion complète des organisateurs dans Entrix V3.0, permettant un écosystème robuste et évolutif pour tous les types d'entités organisatrices.