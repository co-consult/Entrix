# Documentation Modèle de Données Entrix V3.0
## Groupe Fonctionnel : Gestion des Médias et Fichiers

---

## 📋 Vue d'ensemble

Ce groupe fonctionnel gère l'écosystème complet des ressources numériques sur Entrix V3.0 : images, vidéos, documents, audio et autres fichiers multimédias. Il assure le stockage, la diffusion, l'optimisation et la sécurité de tous les contenus de la plateforme.

### Principes de conception
- **Performance optimisée** : CDN global et compression intelligente
- **Sécurité renforcée** : Contrôle d'accès et protection des contenus
- **Multi-formats** : Support étendu des formats médias
- **Évolutivité** : Architecture cloud-native scalable

### Innovations V3.0
- **🎯 Optimisation automatique** : Compression et redimensionnement intelligent
- **🔐 Accès granulaire** : Permissions par fichier et contexte
- **📱 Responsive delivery** : Adaptation automatique aux appareils
- **🎬 Streaming intégré** : Diffusion vidéo/audio haute qualité

---

## 🎭 Table `media_files` - Fichiers multimédias

**Description** : Catalogue central de tous les fichiers multimédias utilisés sur la plateforme.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `file_hash` | VARCHAR(64) | UNIQUE, NOT NULL | - | Hash SHA-256 du fichier |
| `filename` | VARCHAR(500) | NOT NULL | - | Nom fichier original |
| `display_name` | VARCHAR(500) | NULL | - | Nom d'affichage |
| `slug` | VARCHAR(255) | NULL | - | Slug URL-friendly |
| `file_type` | ENUM | NOT NULL | - | Type de fichier |
| `media_category` | ENUM | NOT NULL | - | Catégorie média |
| `mime_type` | VARCHAR(100) | NOT NULL | - | Type MIME |
| `file_extension` | VARCHAR(10) | NOT NULL | - | Extension fichier |
| `file_size` | BIGINT | NOT NULL | - | Taille en bytes |
| `file_size_formatted` | VARCHAR(20) | NULL | - | Taille formatée |
| `storage_provider` | ENUM | NOT NULL | 'S3' | Fournisseur stockage |
| `storage_path` | TEXT | NOT NULL | - | Chemin stockage |
| `storage_bucket` | VARCHAR(100) | NOT NULL | - | Bucket/conteneur |
| `storage_region` | VARCHAR(50) | NULL | - | Région stockage |
| `cdn_url` | TEXT | NULL | - | URL CDN |
| `public_url` | TEXT | NULL | - | URL publique |
| `secure_url` | TEXT | NULL | - | URL sécurisée |
| `thumbnail_url` | TEXT | NULL | - | URL miniature |
| `preview_url` | TEXT | NULL | - | URL aperçu |
| `dimensions` | JSONB | NULL | - | Dimensions si image/vidéo |
| `duration` | INTEGER | NULL | - | Durée si audio/vidéo (sec) |
| `bitrate` | INTEGER | NULL | - | Débit si audio/vidéo |
| `frame_rate` | DECIMAL(6,3) | NULL | - | FPS si vidéo |
| `color_space` | VARCHAR(20) | NULL | - | Espace couleur |
| `compression_ratio` | DECIMAL(5,2) | NULL | - | Ratio compression |
| `quality_score` | INTEGER | NULL | - | Score qualité (0-100) |
| `metadata` | JSONB | NULL | - | Métadonnées EXIF/techniques |
| `alt_text` | VARCHAR(500) | NULL | - | Texte alternatif |
| `caption` | TEXT | NULL | - | Légende |
| `description` | TEXT | NULL | - | Description |
| `keywords` | TEXT[] | NULL | - | Mots-clés |
| `copyright_info` | VARCHAR(500) | NULL | - | Informations copyright |
| `license_type` | ENUM | NULL | - | Type licence |
| `usage_rights` | JSONB | NULL | - | Droits d'usage |
| `attribution_required` | BOOLEAN | NOT NULL | FALSE | Attribution requise |
| `commercial_use_allowed` | BOOLEAN | NOT NULL | TRUE | Usage commercial |
| `owner_type` | ENUM | NOT NULL | - | Type propriétaire |
| `owner_id` | UUID | NOT NULL | - | ID propriétaire |
| `uploaded_by` | UUID | NULL, FK | - | Téléchargé par |
| `visibility` | ENUM | NOT NULL | 'PRIVATE' | Visibilité |
| `access_level` | ENUM | NOT NULL | 'RESTRICTED' | Niveau accès |
| `download_allowed` | BOOLEAN | NOT NULL | FALSE | Téléchargement autorisé |
| `hotlink_protection` | BOOLEAN | NOT NULL | TRUE | Protection hotlink |
| `watermark_applied` | BOOLEAN | NOT NULL | FALSE | Filigrane appliqué |
| `optimization_applied` | BOOLEAN | NOT NULL | FALSE | Optimisation appliquée |
| `variants_generated` | BOOLEAN | NOT NULL | FALSE | Variantes générées |
| `processing_status` | ENUM | NOT NULL | 'PENDING' | Statut traitement |
| `processing_progress` | INTEGER | DEFAULT 0 | 0 | Progression traitement % |
| `processing_error` | TEXT | NULL | - | Erreur traitement |
| `virus_scan_status` | ENUM | NOT NULL | 'PENDING' | Statut scan virus |
| `virus_scan_result` | VARCHAR(100) | NULL | - | Résultat scan |
| `content_moderation` | JSONB | NULL | - | Modération contenu |
| `analytics_data` | JSONB | NULL | - | Données analytics |
| `download_count` | INTEGER | DEFAULT 0 | 0 | Nombre téléchargements |
| `view_count` | INTEGER | DEFAULT 0 | 0 | Nombre vues |
| `last_accessed` | TIMESTAMPTZ | NULL | - | Dernier accès |
| `expires_at` | TIMESTAMPTZ | NULL | - | Date expiration |
| `archive_date` | DATE | NULL | - | Date archivage |
| `deletion_date` | DATE | NULL | - | Date suppression |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Fichier actif |
| `is_public` | BOOLEAN | NOT NULL | FALSE | Publiquement accessible |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Fichier mis en avant |
| `is_system` | BOOLEAN | NOT NULL | FALSE | Fichier système |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `file_type`
- `IMAGE` : Image
- `VIDEO` : Vidéo
- `AUDIO` : Audio
- `DOCUMENT` : Document
- `ARCHIVE` : Archive
- `FONT` : Police
- `VECTOR` : Graphique vectoriel
- `3D_MODEL` : Modèle 3D
- `SPREADSHEET` : Tableur
- `PRESENTATION` : Présentation
- `CODE` : Code source
- `DATA` : Données
- `OTHER` : Autre

#### `media_category`
- `EVENT_PHOTO` : Photo événement
- `VENUE_PHOTO` : Photo lieu
- `PROFILE_PHOTO` : Photo profil
- `LOGO` : Logo
- `BANNER` : Bannière
- `THUMBNAIL` : Miniature
- `GALLERY` : Galerie
- `PROMO_VIDEO` : Vidéo promotionnelle
- `LIVESTREAM` : Diffusion live
- `AUDIO_TRACK` : Piste audio
- `PODCAST` : Podcast
- `DOCUMENT` : Document
- `TICKET_TEMPLATE` : Template billet
- `CERTIFICATE` : Certificat
- `MERCHANDISE` : Merchandising
- `SOCIAL_MEDIA` : Réseaux sociaux
- `MARKETING` : Marketing
- `PRESS_KIT` : Kit presse
- `LEGAL` : Légal
- `TECHNICAL` : Technique

#### `storage_provider`
- `S3` : Amazon S3
- `AZURE_BLOB` : Azure Blob Storage
- `GOOGLE_CLOUD` : Google Cloud Storage
- `CLOUDINARY` : Cloudinary
- `LOCAL` : Stockage local
- `FTP` : Serveur FTP
- `SFTP` : Serveur SFTP

#### `license_type`
- `COPYRIGHT` : Protégé par copyright
- `CC_BY` : Creative Commons Attribution
- `CC_BY_SA` : CC Attribution-ShareAlike
- `CC_BY_NC` : CC Attribution-NonCommercial
- `CC_BY_ND` : CC Attribution-NoDerivs
- `CC0` : Domaine public
- `PROPRIETARY` : Propriétaire
- `ROYALTY_FREE` : Libre de droits
- `RIGHTS_MANAGED` : Droits gérés

#### `owner_type`
- `USER` : Utilisateur
- `ORGANIZER` : Organisateur
- `VENUE` : Lieu
- `EVENT` : Événement
- `SYSTEM` : Système
- `THIRD_PARTY` : Tiers

#### `visibility`
- `PUBLIC` : Public
- `PRIVATE` : Privé
- `MEMBERS_ONLY` : Membres uniquement
- `ORGANIZATION` : Organisation
- `RESTRICTED` : Accès restreint

#### `access_level`
- `PUBLIC` : Accès public
- `AUTHENTICATED` : Utilisateurs connectés
- `AUTHORIZED` : Utilisateurs autorisés
- `RESTRICTED` : Accès restreint
- `ADMIN_ONLY` : Administrateurs uniquement

#### `processing_status`
- `PENDING` : En attente
- `PROCESSING` : En cours
- `COMPLETED` : Terminé
- `FAILED` : Échec
- `CANCELLED` : Annulé
- `QUEUED` : En file d'attente

#### `virus_scan_status`
- `PENDING` : En attente
- `SCANNING` : Scan en cours
- `CLEAN` : Propre
- `INFECTED` : Infecté
- `SUSPICIOUS` : Suspect
- `ERROR` : Erreur scan

### Structure JSONB détaillées

#### `dimensions`
```json
{
  "width": 1920,
  "height": 1080,
  "aspect_ratio": "16:9",
  "orientation": "landscape",
  "dpi": 72,
  "color_depth": 24,
  "has_alpha": false
}
```

#### `metadata`
```json
{
  "exif": {
    "camera": "Canon EOS R5",
    "lens": "RF 24-70mm F2.8L IS USM",
    "focal_length": "50mm",
    "aperture": "f/2.8",
    "iso": 400,
    "shutter_speed": "1/125",
    "date_taken": "2024-12-31T15:30:00Z",
    "location": {"lat": 36.8065, "lng": 10.1815}
  },
  "technical": {
    "color_profile": "sRGB",
    "compression": "JPEG",
    "quality": 85,
    "progressive": true
  },
  "processing": {
    "resized": true,
    "compressed": true,
    "watermarked": false,
    "optimization_level": "medium"
  }
}
```

#### `usage_rights`
```json
{
  "commercial_use": true,
  "modification_allowed": true,
  "redistribution_allowed": false,
  "attribution_required": true,
  "share_alike": false,
  "geographic_restrictions": [],
  "time_limitations": null,
  "usage_count_limit": null,
  "exclusive_license": false
}
```

---

## 🎨 Table `media_variants` - Variantes de fichiers

**Description** : Versions alternatives des fichiers (différentes tailles, formats, qualités).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `parent_media_id` | UUID | NOT NULL, FK | - | Fichier parent |
| `variant_type` | ENUM | NOT NULL | - | Type variante |
| `variant_name` | VARCHAR(100) | NOT NULL | - | Nom variante |
| `purpose` | ENUM | NOT NULL | - | Usage prévu |
| `file_hash` | VARCHAR(64) | NOT NULL | - | Hash fichier variante |
| `filename` | VARCHAR(500) | NOT NULL | - | Nom fichier |
| `mime_type` | VARCHAR(100) | NOT NULL | - | Type MIME |
| `file_size` | BIGINT | NOT NULL | - | Taille bytes |
| `storage_path` | TEXT | NOT NULL | - | Chemin stockage |
| `cdn_url` | TEXT | NULL | - | URL CDN |
| `public_url` | TEXT | NULL | - | URL publique |
| `dimensions` | JSONB | NULL | - | Dimensions |
| `quality` | INTEGER | NULL | - | Qualité (0-100) |
| `compression_ratio` | DECIMAL(5,2) | NULL | - | Ratio compression |
| `processing_params` | JSONB | NULL | - | Paramètres traitement |
| `generation_status` | ENUM | NOT NULL | 'PENDING' | Statut génération |
| `generation_error` | TEXT | NULL | - | Erreur génération |
| `auto_generated` | BOOLEAN | NOT NULL | TRUE | Généré automatiquement |
| `usage_count` | INTEGER | DEFAULT 0 | 0 | Nombre utilisations |
| `last_used` | TIMESTAMPTZ | NULL | - | Dernière utilisation |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `variant_type`
- `THUMBNAIL` : Miniature
- `SMALL` : Petite taille
- `MEDIUM` : Taille moyenne
- `LARGE` : Grande taille
- `XLARGE` : Très grande taille
- `COMPRESSED` : Version compressée
- `OPTIMIZED` : Version optimisée
- `WATERMARKED` : Avec filigrane
- `CROPPED` : Recadrée
- `FILTERED` : Avec filtres

#### `purpose`
- `DISPLAY` : Affichage
- `THUMBNAIL` : Miniature
- `SOCIAL_MEDIA` : Réseaux sociaux
- `EMAIL` : Email
- `PRINT` : Impression
- `MOBILE` : Mobile
- `TABLET` : Tablette
- `DESKTOP` : Bureau
- `RETINA` : Écrans haute densité
- `ARCHIVE` : Archivage

#### `generation_status`
- `PENDING` : En attente
- `PROCESSING` : En cours
- `COMPLETED` : Terminé
- `FAILED` : Échec
- `CANCELLED` : Annulé

---

## 📁 Table `media_collections` - Collections de médias

**Description** : Regroupements organisés de fichiers multimédias (albums, galeries, portfolios).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom collection |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | - | Slug URL |
| `description` | TEXT | NULL | - | Description |
| `collection_type` | ENUM | NOT NULL | - | Type collection |
| `owner_type` | ENUM | NOT NULL | - | Type propriétaire |
| `owner_id` | UUID | NOT NULL | - | ID propriétaire |
| `created_by` | UUID | NULL, FK | - | Créé par |
| `cover_media_id` | UUID | NULL, FK | - | Média couverture |
| `visibility` | ENUM | NOT NULL | 'PRIVATE' | Visibilité |
| `access_password` | VARCHAR(255) | NULL | - | Mot de passe accès |
| `download_enabled` | BOOLEAN | NOT NULL | FALSE | Téléchargement activé |
| `comments_enabled` | BOOLEAN | NOT NULL | FALSE | Commentaires activés |
| `likes_enabled` | BOOLEAN | NOT NULL | FALSE | Likes activés |
| `share_enabled` | BOOLEAN | NOT NULL | TRUE | Partage activé |
| `slideshow_enabled` | BOOLEAN | NOT NULL | TRUE | Diaporama activé |
| `auto_play` | BOOLEAN | NOT NULL | FALSE | Lecture automatique |
| `loop_playback` | BOOLEAN | NOT NULL | FALSE | Lecture en boucle |
| `sort_order` | ENUM | NOT NULL | 'MANUAL' | Ordre tri |
| `media_count` | INTEGER | DEFAULT 0 | 0 | Nombre médias |
| `total_size` | BIGINT | DEFAULT 0 | 0 | Taille totale |
| `view_count` | INTEGER | DEFAULT 0 | 0 | Nombre vues |
| `download_count` | INTEGER | DEFAULT 0 | 0 | Nombre téléchargements |
| `like_count` | INTEGER | DEFAULT 0 | 0 | Nombre likes |
| `share_count` | INTEGER | DEFAULT 0 | 0 | Nombre partages |
| `tags` | TEXT[] | NULL | - | Tags |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `seo_title` | VARCHAR(200) | NULL | - | Titre SEO |
| `seo_description` | VARCHAR(500) | NULL | - | Description SEO |
| `expires_at` | TIMESTAMPTZ | NULL | - | Date expiration |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Collection active |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Collection vedette |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `collection_type`
- `GALLERY` : Galerie
- `ALBUM` : Album
- `PORTFOLIO` : Portfolio
- `EVENT_PHOTOS` : Photos événement
- `VENUE_GALLERY` : Galerie lieu
- `PRESS_KIT` : Kit presse
- `MARKETING_ASSETS` : Assets marketing
- `DOCUMENTATION` : Documentation
- `ARCHIVE` : Archive
- `PLAYLIST` : Playlist
- `SLIDESHOW` : Diaporama

#### `sort_order`
- `MANUAL` : Manuel
- `NAME_ASC` : Nom croissant
- `NAME_DESC` : Nom décroissant
- `DATE_ASC` : Date croissante
- `DATE_DESC` : Date décroissante
- `SIZE_ASC` : Taille croissante
- `SIZE_DESC` : Taille décroissante
- `VIEWS_DESC` : Vues décroissantes
- `RANDOM` : Aléatoire

---

## 🔗 Table `media_collection_items` - Items de collections

**Description** : Liaison entre collections et fichiers multimédias avec métadonnées.

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `collection_id` | UUID | NOT NULL, FK | - | Collection |
| `media_id` | UUID | NOT NULL, FK | - | Fichier média |
| `display_order` | INTEGER | NOT NULL | 0 | Ordre affichage |
| `title` | VARCHAR(300) | NULL | - | Titre spécifique |
| `caption` | TEXT | NULL | - | Légende |
| `description` | TEXT | NULL | - | Description |
| `tags` | TEXT[] | NULL | - | Tags spécifiques |
| `metadata` | JSONB | NULL | - | Métadonnées item |
| `is_cover` | BOOLEAN | NOT NULL | FALSE | Image couverture |
| `is_featured` | BOOLEAN | NOT NULL | FALSE | Item vedette |
| `is_hidden` | BOOLEAN | NOT NULL | FALSE | Item masqué |
| `view_count` | INTEGER | DEFAULT 0 | 0 | Vues item |
| `like_count` | INTEGER | DEFAULT 0 | 0 | Likes item |
| `comment_count` | INTEGER | DEFAULT 0 | 0 | Commentaires item |
| `added_by` | UUID | NULL, FK | - | Ajouté par |
| `added_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date ajout |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

---

## 🎵 Table `media_streams` - Streams multimédias

**Description** : Configuration et gestion des flux de diffusion en temps réel (livestream, audio).

### Structure détaillée

| Champ | Type | Contrainte | Valeur par défaut | Description |
|-------|------|------------|-------------------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identifiant unique |
| `stream_key` | VARCHAR(255) | UNIQUE, NOT NULL | - | Clé stream unique |
| `name` | VARCHAR(200) | NOT NULL | - | Nom stream |
| `description` | TEXT | NULL | - | Description |
| `stream_type` | ENUM | NOT NULL | - | Type stream |
| `protocol` | ENUM | NOT NULL | 'RTMP' | Protocole |
| `quality` | ENUM | NOT NULL | 'HD' | Qualité |
| `bitrate` | INTEGER | NULL | - | Débit (kbps) |
| `resolution` | VARCHAR(20) | NULL | - | Résolution |
| `frame_rate` | INTEGER | NULL | - | FPS |
| `audio_bitrate` | INTEGER | NULL | - | Débit audio |
| `audio_sample_rate` | INTEGER | NULL | - | Échantillonnage audio |
| `owner_type` | ENUM | NOT NULL | - | Type propriétaire |
| `owner_id` | UUID | NOT NULL | - | ID propriétaire |
| `event_id` | UUID | NULL, FK | - | Événement associé |
| `status` | ENUM | NOT NULL | 'INACTIVE' | Statut stream |
| `visibility` | ENUM | NOT NULL | 'PRIVATE' | Visibilité |
| `access_control` | JSONB | NULL | - | Contrôle accès |
| `geographic_restrictions` | VARCHAR(2)[] | NULL | - | Restrictions géo |
| `age_restrictions` | INTEGER | NULL | - | Restrictions âge |
| `viewer_limit` | INTEGER | NULL | - | Limite spectateurs |
| `chat_enabled` | BOOLEAN | NOT NULL | FALSE | Chat activé |
| `recording_enabled` | BOOLEAN | NOT NULL | FALSE | Enregistrement activé |
| `dvr_enabled` | BOOLEAN | NOT NULL | FALSE | DVR activé |
| `auto_start` | BOOLEAN | NOT NULL | FALSE | Démarrage auto |
| `auto_stop` | BOOLEAN | NOT NULL | FALSE | Arrêt auto |
| `scheduled_start` | TIMESTAMPTZ | NULL | - | Début programmé |
| `scheduled_end` | TIMESTAMPTZ | NULL | - | Fin programmée |
| `actual_start` | TIMESTAMPTZ | NULL | - | Début réel |
| `actual_end` | TIMESTAMPTZ | NULL | - | Fin réelle |
| `ingest_url` | TEXT | NULL | - | URL ingestion |
| `playback_url` | TEXT | NULL | - | URL lecture |
| `embed_code` | TEXT | NULL | - | Code intégration |
| `thumbnail_url` | TEXT | NULL | - | URL miniature |
| `preview_url` | TEXT | NULL | - | URL aperçu |
| `recording_url` | TEXT | NULL | - | URL enregistrement |
| `analytics_data` | JSONB | NULL | - | Données analytics |
| `current_viewers` | INTEGER | DEFAULT 0 | 0 | Spectateurs actuels |
| `peak_viewers` | INTEGER | DEFAULT 0 | 0 | Pic spectateurs |
| `total_views` | INTEGER | DEFAULT 0 | 0 | Vues totales |
| `total_duration` | INTEGER | DEFAULT 0 | 0 | Durée totale (sec) |
| `error_count` | INTEGER | DEFAULT 0 | 0 | Nombre erreurs |
| `last_error` | TEXT | NULL | - | Dernière erreur |
| `metadata` | JSONB | NULL | - | Métadonnées |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Dernière MAJ |

### Valeurs ENUM

#### `stream_type`
- `LIVE_VIDEO` : Vidéo live
- `LIVE_AUDIO` : Audio live
- `WEBINAR` : Webinaire
- `CONFERENCE` : Conférence
- `CONCERT` : Concert
- `SPORTS` : Sport
- `EVENT` : Événement
- `TUTORIAL` : Tutoriel
- `INTERVIEW` : Interview
- `PODCAST` : Podcast

#### `protocol`
- `RTMP` : RTMP
- `RTMPS` : RTMPS sécurisé
- `HLS` : HTTP Live Streaming
- `DASH` : MPEG-DASH
- `WEBRTC` : WebRTC
- `SRT` : Secure Reliable Transport

#### `quality`
- `SD` : Définition standard
- `HD` : Haute définition
- `FHD` : Full HD
- `4K` : Ultra HD 4K
- `AUTO` : Automatique

#### `status`
- `INACTIVE` : Inactif
- `PREPARING` : Préparation
- `READY` : Prêt
- `LIVE` : En direct
- `PAUSED` : En pause
- `ENDED` : Terminé
- `ERROR` : Erreur
- `RECORDING` : Enregistrement

---

## 🔗 Relations et contraintes

### Relations principales

```sql
-- Médias ↔ Propriétaires (polymorphe)
-- Implémenté via owner_type + owner_id

-- Variantes ↔ Médias parents
ALTER TABLE media_variants 
ADD CONSTRAINT fk_variants_parent 
FOREIGN KEY (parent_media_id) REFERENCES media_files(id) ON DELETE CASCADE;

-- Collections ↔ Propriétaires (polymorphe)
-- Implémenté via owner_type + owner_id

-- Collections ↔ Média couverture
ALTER TABLE media_collections 
ADD CONSTRAINT fk_collections_cover 
FOREIGN KEY (cover_media_id) REFERENCES media_files(id) ON DELETE SET NULL;

-- Items collections ↔ Collections
ALTER TABLE media_collection_items 
ADD CONSTRAINT fk_items_collection 
FOREIGN KEY (collection_id) REFERENCES media_collections(id) ON DELETE CASCADE;

-- Items collections ↔ Médias
ALTER TABLE media_collection_items 
ADD CONSTRAINT fk_items_media 
FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE;

-- Streams ↔ Événements
ALTER TABLE media_streams 
ADD CONSTRAINT fk_streams_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
```

### Contraintes de validation

```sql
-- Taille fichier positive
ALTER TABLE media_files ADD CONSTRAINT chk_file_size_positive 
CHECK (file_size > 0);

-- Hash SHA-256 format valide
ALTER TABLE media_files ADD CONSTRAINT chk_hash_format 
CHECK (LENGTH(file_hash) = 64 AND file_hash ~ '^[a-f0-9]+$');

-- Durée positive pour audio/vidéo
ALTER TABLE media_files ADD CONSTRAINT chk_duration_positive 
CHECK (duration IS NULL OR duration > 0);

-- Dimensions cohérentes
ALTER TABLE media_files ADD CONSTRAINT chk_dimensions_logical 
CHECK (
    dimensions IS NULL OR (
        (dimensions->>'width')::integer > 0 AND 
        (dimensions->>'height')::integer > 0
    )
);

-- Ordre affichage unique par collection
ALTER TABLE media_collection_items ADD CONSTRAINT uk_collection_order 
UNIQUE (collection_id, display_order);

-- Bitrate stream positif
ALTER TABLE media_streams ADD CONSTRAINT chk_bitrate_positive 
CHECK (bitrate IS NULL OR bitrate > 0);
```

### Index de performance

```sql
-- Recherche par hash pour déduplication
CREATE INDEX idx_media_hash ON media_files(file_hash);

-- Recherche par propriétaire
CREATE INDEX idx_media_owner ON media_files(owner_type, owner_id, is_active);

-- Recherche par type et catégorie
CREATE INDEX idx_media_type_category ON media_files(
    file_type, media_category, created_at DESC
);

-- Performance collections
CREATE INDEX idx_collections_owner ON media_collections(
    owner_type, owner_id, visibility
);

-- Recherche variantes par parent
CREATE INDEX idx_variants_parent ON media_variants(
    parent_media_id, variant_type
);

-- Streams actifs
CREATE INDEX idx_streams_active ON media_streams(
    status, scheduled_start
) WHERE status IN ('READY', 'LIVE');
```

---

## 📊 Métriques et KPIs

### Indicateurs de stockage
- **Volume total** : Espace utilisé par type de fichier
- **Croissance stockage** : Évolution mensuelle du volume
- **Ratio compression** : Efficacité optimisation
- **Déduplication** : % fichiers dupliqués évités

### Indicateurs de performance
- **Temps de traitement** : Délai moyen upload → disponibilité
- **Débit CDN** : Performance diffusion contenus
- **Taux succès upload** : % uploads réussis
- **Temps réponse** : Latence accès fichiers

### Indicateurs d'usage
- **Fichiers populaires** : Médias les plus consultés
- **Types préférés** : Répartition par format
- **Engagement collections** : Vues, likes, partages
- **Performance streams** : Audience, qualité, durée

Cette documentation couvre l'écosystème complet de gestion des médias et fichiers dans Entrix V3.0, assurant performance, sécurité et expérience utilisateur optimales pour tous les contenus multimédias de la plateforme.