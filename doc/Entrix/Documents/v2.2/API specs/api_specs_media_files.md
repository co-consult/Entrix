# API Specifications - Module Médias et Fichiers
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Upload et gestion de fichiers](#api-upload-et-gestion-de-fichiers)
4. [API Optimisation et variantes](#api-optimisation-et-variantes)
5. [API Collections et galeries](#api-collections-et-galeries)
6. [API Streaming et diffusion](#api-streaming-et-diffusion)
7. [API Sécurité et permissions](#api-sécurité-et-permissions)
8. [API CDN et distribution](#api-cdn-et-distribution)
9. [API Recherche et métadonnées](#api-recherche-et-métadonnées)
10. [API Analytics et monitoring](#api-analytics-et-monitoring)
11. [API Administration](#api-administration)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Médias et Fichiers** constitue l'infrastructure de contenu digital d'Entrix V3.0. Il gère l'écosystème complet des ressources numériques : upload, optimisation, distribution, sécurité et analytics de tous les fichiers multimédias de la plateforme.

## 🏗️ Architecture innovante V3.0

### **Pipeline de traitement intelligent**
```
Upload → Validation → Traitement IA → Optimisation → CDN → Distribution
```

### **Types de médias supportés**
- **🖼️ Images** : JPEG, PNG, WebP, SVG, AVIF, HEIC (max 50MB, 8K)
- **🎥 Vidéos** : MP4, WebM, MOV, AVI (max 2GB, 4K/60fps)
- **🎵 Audio** : MP3, AAC, WAV, FLAC, OGG (max 500MB, 24bit/192kHz)
- **📄 Documents** : PDF, DOCX, XLSX, PPTX, TXT (max 100MB)
- **🎮 Autres** : ZIP, 3D models, fonts, vectors

### **Innovations révolutionnaires V3.0**
- **🤖 IA d'optimisation** : Compression et variantes intelligentes
- **⚡ Déduplication instantanée** : Détection par hash SHA-256
- **🎬 Streaming adaptatif** : Multi-bitrate en temps réel
- **🔐 Sécurité granulaire** : DRM, watermarking, permissions contextuelles
- **☁️ Multi-cloud hybrid** : Redondance et performance globale
- **📱 Responsive delivery** : Adaptation automatique par appareil

### **Architecture technique**
- **Stockage** : S3/Azure/GCS avec redondance géographique
- **CDN** : Distribution mondiale avec edge caching
- **Processing** : Workers asynchrones avec retry automatique
- **Streaming** : Infrastructure RTMP/HLS/DASH avec ABR
- **Sécurité** : DRM Widevine/FairPlay, watermarking invisible

## 🔗 Relations avec autres modules
- **Événements** : Médias promotionnels et documentation
- **Lieux** : Galeries, plans 3D, visites virtuelles
- **Organisateurs** : Assets branding et contenus marketing
- **Utilisateurs** : Photos profil, contenus générés
- **Notifications** : Assets pour templates emails

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Upload et gestion
- **Utilisateur** : Upload dans ses espaces personnels
- **Organisateur** : Gestion médias de ses événements/lieux
- **Marketing** : Assets globaux et campagnes
- **Super Admin** : Accès complet système

### Consultation et téléchargement
- **Public** : Médias publics (logos, images marketing)
- **Utilisateur** : Médias selon permissions et abonnements
- **Premium** : Contenus exclusifs haute résolution
- **Staff** : Médias techniques et opérationnels

### Administration avancée
- **Organisateur** : Analytics et gestion de ses médias
- **Marketing** : Performance contenus marketing
- **Tech Admin** : Configuration CDN et optimisation
- **Super Admin** : Monitoring global et sécurité

## 🛡️ Headers requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data (pour uploads)
X-Organizer-ID: <ORGANIZER_UUID> (pour organisateurs)
X-Upload-Context: <CONTEXT> (event, venue, profile, marketing)
X-Access-Level: <PUBLIC|PRIVATE|PREMIUM> (pour permissions)
X-Processing-Priority: <LOW|NORMAL|HIGH|URGENT> (pour traitement)
```

---

# API Upload et gestion de fichiers

## 📁 Ressource : `/api/v1/media`

### POST /api/v1/media/upload
**Description** : Upload de fichier avec traitement automatique

#### Request (Multipart Form Data)
```bash
# Upload simple
curl -X POST https://api.entrix.tn/v1/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@event-poster.jpg" \
  -F "metadata={
    \"display_name\": \"Affiche Derby CA vs EST\",
    \"category\": \"EVENT_PHOTO\",
    \"context\": \"event\",
    \"context_id\": \"evt_derby_2025\",
    \"access_level\": \"PUBLIC\",
    \"tags\": [\"derby\", \"football\", \"2025\"],
    \"alt_text\": \"Affiche officielle du derby CA vs EST 2025\"
  }"

# Upload avec optimisation personnalisée
curl -X POST https://api.entrix.tn/v1/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@concert-video.mp4" \
  -F "metadata={
    \"display_name\": \"Concert Latifa - Tunis 2025\",
    \"category\": \"PROMO_VIDEO\",
    \"context\": \"event\",
    \"context_id\": \"evt_concert_latifa\",
    \"access_level\": \"PREMIUM\",
    \"processing_options\": {
      \"generate_variants\": true,
      \"video_qualities\": [\"480p\", \"720p\", \"1080p\"],
      \"generate_thumbnails\": true,
      \"enable_streaming\": true,
      \"watermark\": {
        \"enabled\": true,
        \"text\": \"© Entrix 2025\",
        \"position\": \"bottom_right\"
      }
    }
  }"
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "file_hash": "sha256:a1b2c3d4e5f6789...",
      "filename": "event-poster.jpg",
      "display_name": "Affiche Derby CA vs EST",
      "file_type": "IMAGE",
      "media_category": "EVENT_PHOTO",
      "mime_type": "image/jpeg",
      "file_size": 2456789,
      "file_size_formatted": "2.35 MB",
      
      // URLs d'accès
      "urls": {
        "original": "https://cdn.entrix.tn/media/original/a1b2c3d4e5f6789.jpg",
        "public": "https://entrix.tn/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "thumbnail": "https://cdn.entrix.tn/media/thumb/a1b2c3d4e5f6789_thumb.jpg",
        "preview": "https://cdn.entrix.tn/media/preview/a1b2c3d4e5f6789_prev.jpg"
      },
      
      // Informations techniques
      "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9"
      },
      
      // Métadonnées
      "metadata": {
        "camera": "Canon EOS R5",
        "focal_length": "85mm", 
        "aperture": "f/2.8",
        "iso": 400,
        "taken_at": "2025-01-15T14:30:00Z",
        "gps_location": {
          "latitude": 36.8065,
          "longitude": 10.1815,
          "city": "Tunis"
        }
      },
      
      // Statut processing
      "processing": {
        "status": "PROCESSING",
        "progress": 15,
        "estimated_completion": "2025-01-15T14:32:00Z",
        "tasks": [
          {
            "name": "variant_generation",
            "status": "IN_PROGRESS",
            "progress": 30
          },
          {
            "name": "thumbnail_generation", 
            "status": "COMPLETED",
            "progress": 100
          },
          {
            "name": "metadata_extraction",
            "status": "PENDING",
            "progress": 0
          }
        ]
      },
      
      // Sécurité et permissions
      "access_control": {
        "level": "PUBLIC",
        "owner_type": "ORGANIZER",
        "owner_id": "org_club_africain",
        "permissions": {
          "can_view": true,
          "can_download": true,
          "can_share": true,
          "can_embed": true
        }
      },
      
      "created_at": "2025-01-15T14:30:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    },
    
    // Job de traitement
    "processing_job": {
      "id": "job_media_01H8X9Y2Z3A4B5C6D7E8F9G1",
      "priority": "NORMAL",
      "estimated_duration": 120,
      "status_url": "https://api.entrix.tn/v1/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0/status"
    }
  },
  "message": "File uploaded successfully and processing started"
}
```

### POST /api/v1/media/upload/multipart/init
**Description** : Initialisation upload multipart pour gros fichiers

#### Request Body
```json
{
  "filename": "concert-4k-video.mp4",
  "file_size": 1073741824,
  "mime_type": "video/mp4",
  "chunk_size": 10485760,
  "metadata": {
    "display_name": "Concert 4K - Ennejma Ezzahra",
    "category": "PROMO_VIDEO",
    "context": "event",
    "context_id": "evt_concert_ennejma",
    "access_level": "PREMIUM"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "upload_session": {
      "id": "upload_01H8X9Y2Z3A4B5C6D7E8F9G2",
      "total_chunks": 102,
      "chunk_size": 10485760,
      "expires_at": "2025-01-15T18:30:00Z",
      
      "upload_urls": [
        {
          "chunk_number": 1,
          "url": "https://upload.entrix.tn/chunk/upload_01H8X9Y2Z3A4B5C6D7E8F9G2/1",
          "expires_at": "2025-01-15T15:30:00Z"
        }
        // ... URLs pour tous les chunks
      ]
    }
  },
  "message": "Multipart upload session initialized"
}
```

### PUT /api/v1/media/upload/multipart/{sessionId}/chunk/{chunkNumber}
**Description** : Upload d'un chunk spécifique

#### Request (Binary Data)
```bash
curl -X PUT "https://upload.entrix.tn/chunk/upload_01H8X9Y2Z3A4B5C6D7E8F9G2/1" \
  -H "Content-Type: application/octet-stream" \
  -H "Content-MD5: d41d8cd98f00b204e9800998ecf8427e" \
  --data-binary @chunk-001.bin
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "chunk_number": 1,
    "chunk_size": 10485760,
    "checksum": "d41d8cd98f00b204e9800998ecf8427e",
    "uploaded_at": "2025-01-15T14:31:00Z",
    "next_chunk_url": "https://upload.entrix.tn/chunk/upload_01H8X9Y2Z3A4B5C6D7E8F9G2/2"
  }
}
```

### POST /api/v1/media/upload/multipart/{sessionId}/complete
**Description** : Finalisation upload multipart

#### Request Body
```json
{
  "chunks": [
    {
      "chunk_number": 1,
      "checksum": "d41d8cd98f00b204e9800998ecf8427e"
    },
    {
      "chunk_number": 2,
      "checksum": "e8f4275d89cd00e3b9024900cc18a1af"
    }
    // ... tous les chunks
  ]
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "media": {
      // Informations complètes du média créé
    },
    "processing_started": true,
    "estimated_completion": "2025-01-15T14:45:00Z"
  },
  "message": "Upload completed successfully, processing started"
}
```

### GET /api/v1/media
**Description** : Liste des fichiers multimédias avec filtres

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page (max 100) |
| `owner_type` | enum | - | Type propriétaire |
| `owner_id` | uuid | - | ID propriétaire |
| `file_type` | enum | - | Type fichier |
| `category` | enum | - | Catégorie média |
| `access_level` | enum | - | Niveau d'accès |
| `tags` | string | - | Tags (séparés par virgule) |
| `search` | string | - | Recherche textuelle |
| `date_from` | date | - | Date début |
| `date_to` | date | - | Date fin |
| `size_min` | integer | - | Taille minimum (bytes) |
| `size_max` | integer | - | Taille maximum (bytes) |
| `sort` | string | created_at | Tri (created_at, file_size, view_count) |
| `order` | string | desc | Ordre (asc, desc) |
| `include_variants` | boolean | false | Inclure variantes |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "display_name": "Affiche Derby CA vs EST",
        "file_type": "IMAGE",
        "media_category": "EVENT_PHOTO",
        "file_size": 2456789,
        "file_size_formatted": "2.35 MB",
        "dimensions": {"width": 1920, "height": 1080},
        "urls": {
          "thumbnail": "https://cdn.entrix.tn/media/thumb/a1b2c3d4e5f6789_thumb.jpg",
          "preview": "https://cdn.entrix.tn/media/preview/a1b2c3d4e5f6789_prev.jpg"
        },
        "access_control": {
          "level": "PUBLIC",
          "can_view": true,
          "can_download": true
        },
        "stats": {
          "view_count": 1547,
          "download_count": 89,
          "last_accessed": "2025-01-15T13:45:00Z"
        },
        "created_at": "2025-01-15T14:30:00Z"
      }
    ],
    
    "filters_applied": {
      "file_type": "IMAGE",
      "access_level": "PUBLIC",
      "date_range": "last_30_days"
    },
    
    "summary": {
      "total_files": 1547,
      "total_size": 15673892456,
      "total_size_formatted": "14.6 GB",
      "by_type": {
        "IMAGE": 892,
        "VIDEO": 234,
        "AUDIO": 156,
        "DOCUMENT": 265
      }
    },
    
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 1547,
      "last_page": 78,
      "has_more": true
    }
  }
}
```

### GET /api/v1/media/{mediaId}
**Description** : Détails complets d'un fichier multimédia

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `include_variants` | boolean | false | Inclure toutes les variantes |
| `include_metadata` | boolean | false | Métadonnées techniques détaillées |
| `include_analytics` | boolean | false | Statistiques d'usage |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "file_hash": "sha256:a1b2c3d4e5f6789...",
      "filename": "event-poster.jpg",
      "display_name": "Affiche Derby CA vs EST",
      "slug": "affiche-derby-ca-vs-est-2025",
      "file_type": "IMAGE",
      "media_category": "EVENT_PHOTO",
      "mime_type": "image/jpeg",
      "file_extension": "jpg",
      "file_size": 2456789,
      "file_size_formatted": "2.35 MB",
      
      // URLs complètes
      "urls": {
        "original": "https://cdn.entrix.tn/media/original/a1b2c3d4e5f6789.jpg",
        "secure": "https://secure.entrix.tn/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0?token=temp_token_123",
        "public": "https://entrix.tn/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "thumbnail": "https://cdn.entrix.tn/media/thumb/a1b2c3d4e5f6789_thumb.jpg",
        "preview": "https://cdn.entrix.tn/media/preview/a1b2c3d4e5f6789_prev.jpg",
        "embed": "https://entrix.tn/embed/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0"
      },
      
      // Informations techniques
      "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9"
      },
      "color_space": "sRGB",
      "compression_ratio": 15.2,
      "quality_score": 95,
      
      // Métadonnées
      "alt_text": "Affiche officielle du derby CA vs EST 2025",
      "caption": "Match du siècle au Stade Radès",
      "description": "Affiche promotionnelle pour le derby historique...",
      "tags": ["derby", "football", "2025", "ca", "est"],
      
      // Contexte
      "context": {
        "type": "EVENT",
        "id": "evt_derby_2025",
        "name": "Derby CA vs EST 2025"
      },
      
      // Propriétaire et permissions
      "owner": {
        "type": "ORGANIZER",
        "id": "org_club_africain",
        "name": "Club Africain"
      },
      
      "access_control": {
        "level": "PUBLIC",
        "geographic_restrictions": [],
        "time_restrictions": null,
        "device_restrictions": {
          "allow_download": true,
          "allow_sharing": true,
          "max_concurrent_views": null
        },
        "permissions": {
          "can_view": true,
          "can_download": true,
          "can_share": true,
          "can_embed": true,
          "can_modify": false,
          "can_delete": false
        }
      },
      
      // Licence et copyright
      "license": {
        "type": "COPYRIGHT",
        "owner": "Club Africain",
        "notice": "© 2025 Club Africain. Tous droits réservés.",
        "restrictions": "Usage commercial interdit sans autorisation"
      },
      
      // Variantes disponibles (si demandées)
      "variants": [
        {
          "id": "var_thumbnail",
          "type": "THUMBNAIL",
          "purpose": "DISPLAY",
          "dimensions": {"width": 300, "height": 169},
          "file_size": 15678,
          "url": "https://cdn.entrix.tn/media/thumb/a1b2c3d4e5f6789_thumb.jpg"
        },
        {
          "id": "var_medium",
          "type": "MEDIUM",
          "purpose": "SOCIAL_MEDIA",
          "dimensions": {"width": 800, "height": 450},
          "file_size": 89456,
          "url": "https://cdn.entrix.tn/media/medium/a1b2c3d4e5f6789_med.jpg"
        }
      ],
      
      // Analytics (si demandées)
      "analytics": {
        "view_count": 1547,
        "unique_viewers": 1204,
        "download_count": 89,
        "share_count": 156,
        "embed_count": 23,
        "last_accessed": "2025-01-15T13:45:00Z",
        "top_referrers": [
          "facebook.com",
          "instagram.com", 
          "entrix.tn"
        ],
        "geographic_distribution": {
          "TN": 67.2,
          "FR": 18.5,
          "MA": 8.1,
          "DZ": 6.2
        }
      },
      
      // Historique
      "processing_history": [
        {
          "operation": "upload",
          "status": "COMPLETED",
          "duration": 15.2,
          "completed_at": "2025-01-15T14:30:15Z"
        },
        {
          "operation": "variant_generation",
          "status": "COMPLETED", 
          "variants_created": 6,
          "duration": 45.8,
          "completed_at": "2025-01-15T14:31:00Z"
        }
      ],
      
      "created_at": "2025-01-15T14:30:00Z",
      "updated_at": "2025-01-15T14:31:00Z",
      "last_accessed": "2025-01-15T13:45:00Z"
    }
  }
}
```

### PUT /api/v1/media/{mediaId}
**Description** : Mise à jour des métadonnées d'un fichier

#### Request Body
```json
{
  "display_name": "Affiche Derby CA vs EST - Version Finale",
  "alt_text": "Affiche officielle mise à jour du derby CA vs EST 2025",
  "caption": "Match du siècle au Stade Radès - Billetterie ouverte",
  "description": "Affiche promotionnelle finale pour le derby historique entre le Club Africain et l'Espérance Sportive de Tunis",
  "tags": ["derby", "football", "2025", "ca", "est", "final"],
  "access_control": {
    "level": "PUBLIC",
    "device_restrictions": {
      "allow_download": true,
      "allow_sharing": true
    }
  },
  "license": {
    "type": "CC_BY_NC",
    "notice": "Creative Commons - Usage non commercial autorisé avec attribution"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "media": {
      // Fichier mis à jour avec nouvelles métadonnées
    },
    "changes_applied": [
      "display_name_updated",
      "alt_text_updated", 
      "caption_updated",
      "description_updated",
      "tags_updated",
      "access_control_updated",
      "license_updated"
    ]
  },
  "message": "Media metadata updated successfully"
}
```

### DELETE /api/v1/media/{mediaId}
**Description** : Suppression d'un fichier multimédia

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `force` | boolean | false | Suppression forcée même si utilisé |
| `delete_variants` | boolean | true | Supprimer aussi les variantes |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
    "deletion_summary": {
      "main_file_deleted": true,
      "variants_deleted": 6,
      "storage_freed": "2.8 MB",
      "cdn_cache_purged": true
    },
    "references_found": [
      {
        "type": "EVENT",
        "id": "evt_derby_2025",
        "usage": "main_image",
        "action": "reference_removed"
      }
    ]
  },
  "message": "Media file deleted successfully"
}
```

---

# API Optimisation et variantes

## 🎨 Ressource : `/api/v1/media/{mediaId}/variants`

### GET /api/v1/media/{mediaId}/variants
**Description** : Liste des variantes d'un fichier

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "parent_media": {
      "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "display_name": "Concert Video 4K",
      "file_type": "VIDEO",
      "original_size": 1073741824,
      "original_dimensions": {"width": 3840, "height": 2160}
    },
    
    "variants": [
      {
        "id": "var_01H8X9Y2Z3A4B5C6D7E8F9G3",
        "variant_type": "COMPRESSED",
        "variant_name": "mobile_optimized",
        "purpose": "MOBILE",
        "file_size": 89456123,
        "dimensions": {"width": 854, "height": 480},
        "quality": 75,
        "compression_ratio": 12.0,
        "bitrate": 500000,
        "urls": {
          "cdn": "https://cdn.entrix.tn/media/variants/var_01H8X9Y2Z3A4B5C6D7E8F9G3.mp4",
          "streaming": "https://stream.entrix.tn/video/var_01H8X9Y2Z3A4B5C6D7E8F9G3/playlist.m3u8"
        },
        "generation_status": "COMPLETED",
        "auto_generated": true,
        "usage_count": 1247,
        "last_used": "2025-01-15T13:30:00Z",
        "created_at": "2025-01-15T14:31:30Z"
      },
      {
        "id": "var_01H8X9Y2Z3A4B5C6D7E8F9G4",
        "variant_type": "THUMBNAIL",
        "variant_name": "preview_thumbnail",
        "purpose": "THUMBNAIL",
        "file_size": 45123,
        "dimensions": {"width": 300, "height": 169},
        "quality": 85,
        "urls": {
          "cdn": "https://cdn.entrix.tn/media/variants/var_01H8X9Y2Z3A4B5C6D7E8F9G4.jpg"
        },
        "generation_status": "COMPLETED",
        "auto_generated": true,
        "usage_count": 5678,
        "created_at": "2025-01-15T14:31:15Z"
      }
    ],
    
    "summary": {
      "total_variants": 8,
      "total_size": 245896123,
      "storage_saved": "75.2%",
      "by_purpose": {
        "MOBILE": 3,
        "TABLET": 2,
        "THUMBNAIL": 2,
        "SOCIAL_MEDIA": 1
      }
    }
  }
}
```

### POST /api/v1/media/{mediaId}/variants
**Description** : Génération de nouvelles variantes

#### Request Body
```json
{
  "variants": [
    {
      "variant_type": "COMPRESSED",
      "variant_name": "instagram_story",
      "purpose": "SOCIAL_MEDIA",
      "target_dimensions": {"width": 1080, "height": 1920},
      "quality": 80,
      "format": "mp4",
      "processing_options": {
        "crop_mode": "smart_crop",
        "background_color": "#000000",
        "add_watermark": false
      }
    },
    {
      "variant_type": "THUMBNAIL",
      "variant_name": "large_thumbnail",
      "purpose": "DISPLAY",
      "target_dimensions": {"width": 600, "height": 338},
      "quality": 90,
      "format": "webp"
    }
  ],
  "priority": "NORMAL",
  "notify_on_completion": true
}
```

#### Success Response (202)
```json
{
  "success": true,
  "data": {
    "generation_job": {
      "id": "job_variants_01H8X9Y2Z3A4B5C6D7E8F9G5",
      "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "variants_requested": 2,
      "estimated_duration": 180,
      "priority": "NORMAL",
      "status": "QUEUED",
      "progress": 0
    },
    "status_url": "https://api.entrix.tn/v1/media/media_01H8X9Y2Z3A4B5C6D7E8F9G0/variants/job/job_variants_01H8X9Y2Z3A4B5C6D7E8F9G5"
  },
  "message": "Variant generation job created successfully"
}
```

### GET /api/v1/media/{mediaId}/variants/job/{jobId}
**Description** : Statut de génération de variantes

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_variants_01H8X9Y2Z3A4B5C6D7E8F9G5",
      "status": "IN_PROGRESS",
      "progress": 65,
      "started_at": "2025-01-15T14:35:00Z",
      "estimated_completion": "2025-01-15T14:37:30Z",
      
      "tasks": [
        {
          "variant_name": "instagram_story",
          "status": "COMPLETED",
          "progress": 100,
          "variant_id": "var_01H8X9Y2Z3A4B5C6D7E8F9G6",
          "completed_at": "2025-01-15T14:36:15Z"
        },
        {
          "variant_name": "large_thumbnail",
          "status": "IN_PROGRESS",
          "progress": 30,
          "estimated_completion": "2025-01-15T14:37:00Z"
        }
      ]
    }
  }
}
```

### POST /api/v1/media/optimize
**Description** : Optimisation automatique par IA

#### Request Body
```json
{
  "media_ids": [
    "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
    "media_01H8X9Y2Z3A4B5C6D7E8F9G1"
  ],
  "optimization_profile": "EVENT_MARKETING",
  "target_usage": {
    "platforms": ["web", "mobile", "social_media"],
    "quality_preference": "balanced",
    "bandwidth_consideration": "medium",
    "storage_optimization": true
  },
  "ai_preferences": {
    "smart_cropping": true,
    "auto_enhancement": true,
    "format_optimization": true,
    "compression_intelligence": true
  }
}
```

#### Success Response (202)
```json
{
  "success": true,
  "data": {
    "optimization_job": {
      "id": "job_ai_opt_01H8X9Y2Z3A4B5C6D7E8F9G7",
      "media_count": 2,
      "profile": "EVENT_MARKETING",
      "estimated_variants": 14,
      "estimated_duration": 300,
      "storage_savings_expected": "60-80%",
      "status": "ANALYZING"
    },
    "analysis_results": [
      {
        "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "current_size": "2.35 MB",
        "recommended_variants": 7,
        "potential_savings": "78%",
        "quality_improvements": [
          "Auto color correction",
          "Smart sharpening",
          "Noise reduction"
        ]
      }
    ]
  },
  "message": "AI optimization analysis started"
}
```

---

# API Collections et galeries

## 🖼️ Ressource : `/api/v1/media/collections`

### GET /api/v1/media/collections
**Description** : Liste des collections de médias

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 20 | Éléments par page |
| `owner_type` | enum | - | Type propriétaire |
| `owner_id` | uuid | - | ID propriétaire |
| `collection_type` | enum | - | Type collection |
| `visibility` | enum | - | Visibilité |
| `featured_only` | boolean | false | Collections vedettes uniquement |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "coll_01H8X9Y2Z3A4B5C6D7E8F9G8",
        "name": "Derby CA vs EST 2025 - Photos officielles",
        "slug": "derby-ca-est-2025-photos",
        "collection_type": "EVENT_PHOTOS",
        "description": "Collection complète des photos officielles du derby historique",
        "visibility": "PUBLIC",
        
        // Statistiques
        "stats": {
          "total_items": 47,
          "total_size": "156.8 MB",
          "item_types": {
            "IMAGE": 42,
            "VIDEO": 5
          }
        },
        
        // Aperçu
        "preview": {
          "cover_image": {
            "url": "https://cdn.entrix.tn/collections/coll_01H8X9Y2Z3A4B5C6D7E8F9G8/cover.jpg",
            "thumbnail": "https://cdn.entrix.tn/collections/coll_01H8X9Y2Z3A4B5C6D7E8F9G8/cover_thumb.jpg"
          },
          "sample_items": [
            {
              "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
              "thumbnail": "https://cdn.entrix.tn/media/thumb/sample1.jpg"
            },
            {
              "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G1", 
              "thumbnail": "https://cdn.entrix.tn/media/thumb/sample2.jpg"
            }
          ]
        },
        
        // Propriétaire
        "owner": {
          "type": "ORGANIZER",
          "id": "org_club_africain",
          "name": "Club Africain"
        },
        
        "settings": {
          "sort_order": "DATE_DESC",
          "allow_comments": true,
          "allow_downloads": true,
          "watermark_enabled": false
        },
        
        "is_featured": true,
        "view_count": 15674,
        "created_at": "2025-01-15T14:30:00Z",
        "updated_at": "2025-01-15T16:45:00Z"
      }
    ],
    
    "featured_collections": [
      {
        "id": "coll_featured_1",
        "name": "Meilleures photos 2025",
        "cover_url": "https://cdn.entrix.tn/collections/featured/best-2025.jpg"
      }
    ],
    
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 89,
      "last_page": 5
    }
  }
}
```

### POST /api/v1/media/collections
**Description** : Création d'une nouvelle collection

#### Request Body
```json
{
  "name": "Concert Latifa 2025 - Backstage",
  "slug": "concert-latifa-2025-backstage",
  "collection_type": "GALLERY",
  "description": "Photos exclusives des coulisses du concert de Latifa à l'Opéra de Tunis",
  "visibility": "PRIVATE",
  
  "settings": {
    "sort_order": "MANUAL",
    "allow_comments": false,
    "allow_downloads": false,
    "watermark_enabled": true,
    "password_protected": true,
    "password": "backstage2025"
  },
  
  "access_control": {
    "allowed_users": ["usr_photographer_1", "usr_manager_2"],
    "allowed_roles": ["STAFF", "MEDIA"],
    "expires_at": "2025-02-15T23:59:59Z"
  },
  
  "metadata": {
    "event_id": "evt_concert_latifa",
    "venue_id": "venue_opera_tunis",
    "photographer": "Ahmed Ben Salah",
    "shoot_date": "2025-01-20"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "coll_01H8X9Y2Z3A4B5C6D7E8F9G9",
      "name": "Concert Latifa 2025 - Backstage",
      "slug": "concert-latifa-2025-backstage",
      "collection_type": "GALLERY",
      "visibility": "PRIVATE",
      
      "access_urls": {
        "public": "https://entrix.tn/gallery/concert-latifa-2025-backstage",
        "private": "https://entrix.tn/gallery/concert-latifa-2025-backstage?token=priv_token_123",
        "embed": "https://entrix.tn/embed/gallery/coll_01H8X9Y2Z3A4B5C6D7E8F9G9"
      },
      
      "stats": {
        "total_items": 0,
        "total_size": "0 B"
      },
      
      "created_at": "2025-01-15T14:45:00Z"
    }
  },
  "message": "Collection created successfully"
}
```

### GET /api/v1/media/collections/{collectionId}
**Description** : Détails d'une collection avec ses éléments

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Page des éléments |
| `limit` | integer | 50 | Éléments par page |
| `sort` | string | display_order | Tri des éléments |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "coll_01H8X9Y2Z3A4B5C6D7E8F9G8",
      "name": "Derby CA vs EST 2025 - Photos officielles",
      "description": "Collection complète des photos officielles du derby historique",
      "collection_type": "EVENT_PHOTOS",
      "visibility": "PUBLIC",
      
      // Éléments de la collection
      "items": [
        {
          "id": "item_01H8X9Y2Z3A4B5C6D7E8FA0",
          "media": {
            "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
            "display_name": "Entrée des joueurs",
            "file_type": "IMAGE",
            "urls": {
              "thumbnail": "https://cdn.entrix.tn/media/thumb/entrance.jpg",
              "preview": "https://cdn.entrix.tn/media/preview/entrance.jpg",
              "full": "https://cdn.entrix.tn/media/full/entrance.jpg"
            },
            "dimensions": {"width": 1920, "height": 1080}
          },
          "display_order": 1,
          "title": "L'entrée spectaculaire des équipes",
          "caption": "Les joueurs du CA et de l'EST font leur entrée sous les ovations",
          "is_cover": true,
          "is_featured": true,
          "view_count": 3456,
          "like_count": 234,
          "added_at": "2025-01-15T14:30:00Z"
        },
        {
          "id": "item_01H8X9Y2Z3A4B5C6D7E8FA1",
          "media": {
            "id": "media_01H8X9Y2Z3A4B5C6D7E8F9G1",
            "display_name": "Premier but CA",
            "file_type": "VIDEO",
            "urls": {
              "thumbnail": "https://cdn.entrix.tn/media/thumb/goal1.jpg",
              "preview": "https://cdn.entrix.tn/media/preview/goal1.mp4",
              "streaming": "https://stream.entrix.tn/video/goal1/playlist.m3u8"
            },
            "duration": 45,
            "dimensions": {"width": 1920, "height": 1080}
          },
          "display_order": 2,
          "title": "Le but libérateur du CA",
          "caption": "Explosion de joie après l'ouverture du score",
          "view_count": 8967,
          "like_count": 567,
          "added_at": "2025-01-15T15:15:00Z"
        }
      ],
      
      "stats": {
        "total_items": 47,
        "total_views": 156789,
        "total_likes": 12456,
        "total_comments": 789,
        "total_shares": 234
      },
      
      "pagination": {
        "current_page": 1,
        "per_page": 50,
        "total": 47,
        "last_page": 1
      }
    }
  }
}
```

### POST /api/v1/media/collections/{collectionId}/items
**Description** : Ajout d'éléments à une collection

#### Request Body
```json
{
  "items": [
    {
      "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
      "display_order": 1,
      "title": "Photo officielle équipe CA",
      "caption": "L'équipe du Club Africain avant le derby",
      "is_featured": true
    },
    {
      "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G1",
      "display_order": 2,
      "title": "Ambiance tribunes",
      "caption": "Les supporters en feu dans les gradins"
    }
  ],
  "auto_order": true
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "items_added": 2,
    "items": [
      {
        "id": "item_01H8X9Y2Z3A4B5C6D7E8FA2",
        "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G0",
        "display_order": 1,
        "added_at": "2025-01-15T14:50:00Z"
      },
      {
        "id": "item_01H8X9Y2Z3A4B5C6D7E8FA3",
        "media_id": "media_01H8X9Y2Z3A4B5C6D7E8F9G1",
        "display_order": 2,
        "added_at": "2025-01-15T14:50:00Z"
      }
    ],
    "collection_updated": {
      "total_items": 49,
      "updated_at": "2025-01-15T14:50:00Z"
    }
  },
  "message": "Items added to collection successfully"
}
```

---

# API Streaming et diffusion

## 📺 Ressource : `/api/v1/media/streaming`

### GET /api/v1/media/streaming/streams
**Description** : Liste des streams actifs et programmés

#### Query Parameters
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `status` | enum | - | Statut stream |
| `stream_type` | enum | - | Type de stream |
| `owner_id` | uuid | - | Propriétaire |
| `scheduled_date` | date | - | Date programmée |

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "streams": [
      {
        "id": "stream_01H8X9Y2Z3A4B5C6D7E8FAA",
        "name": "Derby CA vs EST - Direct",
        "stream_type": "SPORTS",
        "status": "LIVE",
        "protocol": "HLS",
        "quality": "AUTO",
        
        // Planning
        "scheduled_start": "2025-02-01T19:30:00Z",
        "scheduled_end": "2025-02-01T21:30:00Z",
        "actual_start": "2025-02-01T19:28:30Z",
        "duration_live": 3890,
        
        // URLs streaming
        "urls": {
          "ingest": "rtmp://ingest.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAA?key=live_key_123",
          "playback": "https://stream.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAA/playlist.m3u8",
          "embed": "https://entrix.tn/embed/stream/stream_01H8X9Y2Z3A4B5C6D7E8FAA"
        },
        
        // Métriques temps réel
        "metrics": {
          "current_viewers": 15674,
          "peak_viewers": 18923,
          "total_views": 45612,
          "average_view_duration": 2345,
          "engagement_rate": 78.5
        },
        
        // Qualités disponibles
        "qualities": [
          {
            "name": "480p",
            "resolution": "854x480",
            "bitrate": 500000,
            "viewers": 4567
          },
          {
            "name": "720p",
            "resolution": "1280x720",
            "bitrate": 1500000,
            "viewers": 8934
          },
          {
            "name": "1080p",
            "resolution": "1920x1080",
            "bitrate": 3000000,
            "viewers": 2173
          }
        ],
        
        // Propriétaire
        "owner": {
          "type": "ORGANIZER",
          "id": "org_club_africain",
          "name": "Club Africain"
        },
        
        "created_at": "2025-02-01T19:00:00Z",
        "updated_at": "2025-02-01T20:15:30Z"
      }
    ],
    
    "summary": {
      "total_streams": 156,
      "live_streams": 12,
      "scheduled_streams": 23,
      "total_current_viewers": 67890
    }
  }
}
```

### POST /api/v1/media/streaming/streams
**Description** : Création d'un nouveau stream

#### Request Body
```json
{
  "name": "Concert Latifa en Direct",
  "description": "Diffusion en direct du concert de Latifa à l'Opéra de Tunis",
  "stream_type": "CONCERT",
  "protocol": "HLS",
  "quality": "AUTO",
  
  // Programmation
  "scheduled_start": "2025-01-25T20:00:00Z",
  "scheduled_end": "2025-01-25T23:00:00Z",
  "timezone": "Africa/Tunis",
  
  // Configuration technique
  "settings": {
    "auto_record": true,
    "enable_chat": true,
    "enable_analytics": true,
    "adaptive_bitrate": true,
    "max_bitrate": 5000000,
    "latency_mode": "LOW",
    "dvr_enabled": true,
    "dvr_duration": 7200
  },
  
  // Accès et sécurité
  "access_control": {
    "visibility": "PUBLIC",
    "require_auth": false,
    "geographic_restrictions": [],
    "device_limits": null,
    "concurrent_viewers_limit": 50000
  },
  
  // Monétisation
  "monetization": {
    "type": "FREE",
    "premium_quality": false,
    "sponsors": [
      {
        "name": "Sponsor Principal",
        "logo_url": "https://cdn.entrix.tn/sponsors/sponsor1.png",
        "overlay_duration": 10
      }
    ]
  },
  
  // Contexte
  "context": {
    "type": "EVENT",
    "id": "evt_concert_latifa",
    "venue_id": "venue_opera_tunis"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "stream_01H8X9Y2Z3A4B5C6D7E8FAB",
      "name": "Concert Latifa en Direct",
      "stream_type": "CONCERT",
      "status": "PREPARING",
      "protocol": "HLS",
      
      // Clés streaming
      "streaming_keys": {
        "ingest_url": "rtmp://ingest.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAB",
        "stream_key": "live_key_abc123def456",
        "backup_url": "rtmp://backup.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAB"
      },
      
      // URLs publiques
      "playback_urls": {
        "hls": "https://stream.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAB/playlist.m3u8",
        "dash": "https://stream.entrix.tn/live/stream_01H8X9Y2Z3A4B5C6D7E8FAB/manifest.mpd",
        "embed": "https://entrix.tn/embed/stream/stream_01H8X9Y2Z3A4B5C6D7E8FAB"
      },
      
      // Monitoring
      "monitoring": {
        "health_check_url": "https://api.entrix.tn/v1/media/streaming/streams/stream_01H8X9Y2Z3A4B5C6D7E8FAB/health",
        "analytics_url": "https://api.entrix.tn/v1/media/streaming/streams/stream_01H8X9Y2Z3A4B5C6D7E8FAB/analytics"
      }
    }
  },
  "message": "Stream created successfully"
}
```

### POST /api/v1/media/streaming/streams/{streamId}/start
**Description** : Démarrage d'un stream

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "stream": {
      "id": "stream_01H8X9Y2Z3A4B5C6D7E8FAB",
      "status": "LIVE",
      "actual_start": "2025-01-25T20:02:15Z",
      "current_viewers": 1,
      "stream_health": "EXCELLENT"
    }
  },
  "message": "Stream started successfully"
}
```

### GET /api/v1/media/streaming/streams/{streamId}/analytics
**Description** : Analytics temps réel d'un stream

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "stream_id": "stream_01H8X9Y2Z3A4B5C6D7E8FAB",
    "status": "LIVE",
    "duration_live": 3456,
    
    "audience": {
      "current_viewers": 15674,
      "peak_viewers": 18923,
      "total_unique_viewers": 45612,
      "average_view_duration": 2345,
      "concurrent_viewers_history": [
        {
          "timestamp": "2025-01-25T20:00:00Z",
          "viewers": 1234
        },
        {
          "timestamp": "2025-01-25T20:05:00Z", 
          "viewers": 3456
        }
      ]
    },
    
    "engagement": {
      "chat_messages": 12456,
      "active_chatters": 2345,
      "reactions": 8967,
      "shares": 456,
      "engagement_rate": 78.5
    },
    
    "technical": {
      "stream_health": "EXCELLENT",
      "bitrate_current": 2500000,
      "frame_rate": 30,
      "resolution": "1920x1080",
      "latency_avg": 2.3,
      "buffer_ratio": 0.02,
      "error_rate": 0.001
    },
    
    "geographic": {
      "top_countries": [
        {"country": "TN", "viewers": 12456, "percentage": 79.5},
        {"country": "FR", "viewers": 1890, "percentage": 12.1},
        {"country": "MA", "viewers": 876, "percentage": 5.6}
      ]
    },
    
    "devices": {
      "mobile": {"viewers": 9345, "percentage": 59.6},
      "desktop": {"viewers": 4567, "percentage": 29.1},
      "tablet": {"viewers": 1234, "percentage": 7.9},
      "tv": {"viewers": 528, "percentage": 3.4}
    }
  }
}
```

---

# Codes d'erreur

## 🚨 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `MEDIA_001` | File too large | Fichier dépasse la taille limite |
| `MEDIA_002` | Invalid file type | Format de fichier non supporté |
| `MEDIA_003` | Processing failed | Échec du traitement |
| `MEDIA_004` | Virus detected | Virus détecté lors du scan |
| `MEDIA_005` | Duplicate file | Fichier déjà existant |
| `MEDIA_006` | Storage quota exceeded | Quota de stockage dépassé |
| `MEDIA_007` | Invalid dimensions | Dimensions invalides |
| `MEDIA_008` | Corrupted file | Fichier corrompu |
| `MEDIA_009` | Access denied | Accès refusé au fichier |
| `MEDIA_010` | File not found | Fichier introuvable |
| `STREAM_001` | Stream not found | Stream introuvable |
| `STREAM_002` | Stream already live | Stream déjà en direct |
| `STREAM_003` | Invalid stream key | Clé de stream invalide |
| `STREAM_004` | Bandwidth exceeded | Bande passante dépassée |
| `STREAM_005` | Stream limit reached | Limite de streams atteinte |
| `COLLECTION_001` | Collection not found | Collection introuvable |
| `COLLECTION_002` | Access denied | Accès collection refusé |
| `VARIANT_001` | Generation failed | Génération variante échouée |
| `VARIANT_002` | Invalid parameters | Paramètres variante invalides |

---

# Exemples d'usage

## 🎯 Scénarios d'usage complets

### Upload et optimisation automatique
```bash
# Upload avec optimisation IA
curl -X POST https://api.entrix.tn/v1/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@event-video.mp4" \
  -F "metadata={
    \"display_name\": \"Highlights Derby 2025\",
    \"category\": \"PROMO_VIDEO\",
    \"context\": \"event\",
    \"context_id\": \"evt_derby_2025\",
    \"processing_options\": {
      \"ai_optimization\": true,
      \"target_platforms\": [\"web\", \"mobile\", \"social\"],
      \"quality_preference\": \"balanced\"
    }
  }"

# Vérification statut traitement
curl -X GET "https://api.entrix.tn/v1/media/media_123/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Création collection et galerie
```bash
# Création collection
curl -X POST https://api.entrix.tn/v1/media/collections \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "name": "Photos Derby 2025",
    "collection_type": "EVENT_PHOTOS",
    "visibility": "PUBLIC",
    "settings": {
      "allow_downloads": true,
      "watermark_enabled": false
    }
  }'

# Ajout médias à la collection
curl -X POST https://api.entrix.tn/v1/media/collections/coll_123/items \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "items": [
      {"media_id": "media_456", "title": "Entrée équipes"},
      {"media_id": "media_789", "title": "Premier but"}
    ]
  }'
```

### Configuration streaming live
```bash
# Création stream
curl -X POST https://api.entrix.tn/v1/media/streaming/streams \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "name": "Derby Live Stream",
    "stream_type": "SPORTS",
    "scheduled_start": "2025-02-01T19:30:00Z",
    "settings": {
      "auto_record": true,
      "adaptive_bitrate": true,
      "max_bitrate": 5000000
    }
  }'

# Démarrage stream
curl -X POST https://api.entrix.tn/v1/media/streaming/streams/stream_123/start \
  -H "Authorization: Bearer $ORG_TOKEN"

# Analytics temps réel
curl -X GET https://api.entrix.tn/v1/media/streaming/streams/stream_123/analytics \
  -H "Authorization: Bearer $ORG_TOKEN"
```

### Gestion sécurité et permissions
```bash
# Mise à jour permissions fichier
curl -X PUT https://api.entrix.tn/v1/media/media_123 \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{
    "access_control": {
      "level": "PREMIUM",
      "device_restrictions": {
        "allow_download": false,
        "max_concurrent_views": 3
      },
      "watermark_enabled": true
    }
  }'

# Génération lien temporaire sécurisé
curl -X POST https://api.entrix.tn/v1/media/media_123/secure-link \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "expires_in": 3600,
    "allowed_ip": "196.179.123.45",
    "single_use": true
  }'
```

Ce module **Médias et Fichiers** constitue l'infrastructure complète de gestion des contenus digitaux d'Entrix V3.0, offrant performance, sécurité et expérience utilisateur optimales pour tous les types de fichiers multimédias avec des capacités avancées d'optimisation IA, streaming adaptatif et distribution mondiale.