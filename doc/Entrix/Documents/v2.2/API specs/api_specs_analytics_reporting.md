# API Specifications - Module Analytics et Reporting
## Plateforme Entrix V3.0

---

# 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et autorisation](#authentification-et-autorisation)
3. [API Dashboards temps réel](#api-dashboards-temps-réel)
4. [API Analytics comportementaux](#api-analytics-comportementaux)
5. [API IA prédictive et recommandations](#api-ia-prédictive-et-recommandations)
6. [API Reporting et exports](#api-reporting-et-exports)
7. [API Métriques et KPIs](#api-métriques-et-kpis)
8. [API Alertes intelligentes](#api-alertes-intelligentes)
9. [API Self-service BI](#api-self-service-bi)
10. [API Intégrations analytics](#api-intégrations-analytics)
11. [API Administration analytics](#api-administration-analytics)
12. [Codes d'erreur](#codes-derreur)
13. [Exemples d'usage](#exemples-dusage)

---

# Vue d'ensemble

## 🎯 Objectif du module

Le module **Analytics et Reporting** constitue le **cerveau analytique** d'Entrix V3.0, transformant toutes les données de la plateforme en **insights actionnables** et **rapports stratégiques** pour optimiser les performances, prédire les tendances et maximiser les revenus de tous les acteurs de l'écosystème.

## 🏗️ Architecture décisionnelle V3.0

### **Pipeline de données intelligent**
```
Data Sources → Data Lake → Stream Processing → Data Warehouse → ML Pipeline → Visualization
```

### **Innovations révolutionnaires V3.0**
- **🤖 IA prédictive** : Machine learning pour prévisions et recommandations
- **⚡ Analytics temps réel** : Dashboards live avec refresh sub-seconde
- **🎯 Segmentation avancée** : Analyse comportementale granulaire RFM
- **📊 Self-service BI** : Création rapports personnalisés sans technique
- **🔮 Insights prédictifs** : Anticipation tendances et optimisation automatique
- **📈 Forecasting IA** : Prédictions demande et revenus par ML
- **🚨 Alertes intelligentes** : Notifications proactives et recommandations

### **Types d'analytics supportés**
- **📊 Dashboards Executive** : KPIs haute direction organisateurs/venues
- **📈 Analytics Business** : Métriques performance et ROI détaillées
- **👥 Segmentation Client** : RFM, comportemental, prédictif
- **🔮 Prédictions IA** : Demande, revenus, risques, opportunités
- **📱 Analytics Temps Réel** : Monitoring live événements en cours
- **📑 Reporting Avancé** : Rapports automatisés et personnalisables

### **Architecture technique**
- **Data Lake** : Stockage massif structuré et non-structuré
- **Data Warehouse** : OLAP optimisé pour requêtes analytiques complexes
- **Stream Processing** : Traitement temps réel événements (Apache Kafka)
- **ML Pipeline** : Entraînement et déploiement modèles IA (MLflow)
- **Visualization Layer** : Dashboards interactifs multi-device (Chart.js, D3.js)
- **Cache Layer** : Redis pour performance sub-seconde

## 🔗 Relations avec autres modules
- **Événements** : Analytics performance, prédictions demande
- **Commandes** : Revenus, conversion, analytics financières
- **Utilisateurs** : Segmentation, comportement, lifetime value
- **Contrôle Accès** : Métriques opérationnelles, flux visiteurs
- **Venues** : Optimisation capacité, performance lieux
- **Notifications** : Triggers alertes et recommendations

---

# Authentification et autorisation

## 🔐 Niveaux d'accès requis

### Lecture analytics de base
- **Scope** : `analytics:read:basic`
- **Qui** : Organisateurs pour leurs propres données
- **Limitations** : Vue filtrée par organizer_id

### Lecture analytics avancés
- **Scope** : `analytics:read:advanced`
- **Qui** : Organisateurs premium, gestionnaires venues
- **Fonctionnalités** : Prédictions IA, segmentation avancée

### Écriture et configuration
- **Scope** : `analytics:write`
- **Qui** : Admins organisateurs, data analysts
- **Fonctionnalités** : Configuration dashboards, alertes personnalisées

### Administration globale
- **Scope** : `analytics:admin`
- **Qui** : Super admins Entrix, équipe data
- **Fonctionnalités** : Accès plateforme complète, configuration ML

## 🔑 Headers d'authentification

```http
Authorization: Bearer [JWT_TOKEN]
X-Organizer-ID: [ORGANIZER_UUID]  # Pour filtrage données organisateur
X-Venue-ID: [VENUE_UUID]          # Pour analytics spécifiques venue
X-Time-Zone: Africa/Tunis          # Pour ajustement temporel
```

---

# API Dashboards temps réel

## 📊 Dashboard Executive Organisateur

### GET /api/v1/analytics/dashboards/organizer/executive
**Description** : Dashboard executive principal pour organisateurs avec KPIs essentiels

#### Query Parameters
- `period` (string, optional) : Période d'analyse
  - `24h`, `7d`, `30d`, `90d`, `ytd`, `custom`
  - Default: `30d`
- `start_date` (string, optional) : Date début si period=custom (ISO 8601)
- `end_date` (string, optional) : Date fin si period=custom (ISO 8601)
- `compare_previous` (boolean, optional) : Inclure comparaison période précédente
  - Default: `true`
- `include_predictions` (boolean, optional) : Inclure prévisions IA
  - Default: `false`

#### Response 200
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-03-01T00:00:00Z",
      "end": "2024-03-31T23:59:59Z",
      "label": "Mars 2024",
      "days_count": 31
    },
    "summary": {
      "gross_revenue": 45780.50,
      "net_revenue": 41202.45,
      "total_orders": 287,
      "total_tickets_sold": 634,
      "avg_order_value": 159.58,
      "unique_customers": 241,
      "conversion_rate": 4.2,
      "events_count": 8
    },
    "growth_metrics": {
      "revenue_growth_percent": 23.4,
      "orders_growth_percent": 18.7,
      "customers_growth_percent": 31.2,
      "avg_order_value_growth_percent": 4.1
    },
    "channel_performance": {
      "online": {
        "share_percent": 72.4,
        "revenue": 33144.68,
        "orders": 208
      },
      "mobile": {
        "share_percent": 45.3,
        "revenue": 20738.95,
        "orders": 130
      },
      "offline": {
        "share_percent": 27.6,
        "revenue": 12635.82,
        "orders": 79
      }
    },
    "customer_behavior": {
      "anonymous_rate_percent": 34.5,
      "registered_rate_percent": 65.5,
      "conversion_anonymous_to_registered": 18.2,
      "repeat_customers_rate": 42.7
    },
    "top_events": [
      {
        "event_id": "evt_abc123",
        "title": "Concert Hamza Namira",
        "tickets_sold": 245,
        "revenue": 18670.50,
        "fill_rate_percent": 89.1,
        "satisfaction_score": 4.7
      }
    ],
    "alerts_count": {
      "high_priority": 2,
      "medium_priority": 5,
      "low_priority": 12
    },
    "predictions": {
      "next_month_revenue": 52340.00,
      "confidence_interval": [48200.00, 56800.00],
      "peak_sales_period": "2024-04-15 to 2024-04-20",
      "recommended_actions": [
        "Lancer campagne marketing pour événement 'Festival Jazz'",
        "Optimiser prix pour augmenter conversion mobile"
      ]
    }
  },
  "timestamp": "2024-03-31T23:59:59Z",
  "cache_ttl": 300
}
```

### GET /api/v1/analytics/dashboards/organizer/revenue
**Description** : Dashboard détaillé focus revenus et finance

#### Query Parameters
- `period` (string, optional) : Période d'analyse, default: `30d`
- `breakdown_by` (string, optional) : Dimension de breakdown
  - `day`, `week`, `month`, `event`, `category`, `payment_method`
  - Default: `day`
- `include_forecasting` (boolean, optional) : Inclure prévisions ML

#### Response 200
```json
{
  "success": true,
  "data": {
    "revenue_overview": {
      "gross_revenue": 45780.50,
      "platform_fees": 4578.05,
      "payment_fees": 687.71,
      "net_revenue": 40514.74,
      "tax_amount": 7404.09,
      "margin_percent": 88.5
    },
    "revenue_timeline": [
      {
        "date": "2024-03-01",
        "gross_revenue": 1234.50,
        "net_revenue": 1111.05,
        "orders_count": 8,
        "avg_order_value": 154.31
      }
    ],
    "payment_methods": {
      "credit_card": {
        "revenue": 32589.35,
        "share_percent": 71.2,
        "avg_processing_time_seconds": 2.3
      },
      "flouci": {
        "revenue": 8734.20,
        "share_percent": 19.1,
        "avg_processing_time_seconds": 1.8
      },
      "bank_transfer": {
        "revenue": 4456.95,
        "share_percent": 9.7,
        "avg_processing_time_seconds": 45.2
      }
    },
    "revenue_by_event": [
      {
        "event_id": "evt_abc123",
        "event_title": "Concert Hamza Namira",
        "gross_revenue": 18670.50,
        "net_revenue": 16803.45,
        "tickets_sold": 245,
        "capacity_utilized_percent": 89.1,
        "roi_percent": 234.5
      }
    ],
    "forecasting": {
      "next_7_days": {
        "predicted_revenue": 8450.00,
        "confidence": 0.87,
        "factors": ["Weekday effect", "Historical pattern", "Current booking pace"]
      },
      "next_30_days": {
        "predicted_revenue": 52340.00,
        "confidence": 0.73,
        "trend": "GROWING",
        "seasonal_adjustment": 1.15
      }
    },
    "recommendations": [
      {
        "type": "PRICING_OPTIMIZATION",
        "message": "Augmenter prix VIP pour événement 'Festival Jazz' (+15% recommandé)",
        "impact_estimate": "+2340 TND revenus potentiels",
        "confidence": 0.82
      }
    ]
  }
}
```

## 🏟️ Dashboard Venue Manager

### GET /api/v1/analytics/dashboards/venue/operations
**Description** : Dashboard opérationnel pour gestionnaires de venues

#### Query Parameters
- `venue_id` (UUID, required) : ID de la venue
- `period` (string, optional) : Default: `30d`
- `include_realtime` (boolean, optional) : Inclure métriques temps réel

#### Response 200
```json
{
  "success": true,
  "data": {
    "venue_info": {
      "venue_id": "ven_xyz789",
      "name": "Théâtre Municipal Tunis",
      "total_capacity": 850,
      "configuration_count": 3
    },
    "utilization_metrics": {
      "avg_fill_rate_percent": 76.3,
      "total_events_hosted": 24,
      "revenue_generated": 89450.75,
      "avg_event_revenue": 3727.11,
      "peak_utilization_day": "saturday",
      "peak_utilization_time": "20:00"
    },
    "capacity_optimization": {
      "optimal_capacity_events": 18,
      "underutilized_events": 4,
      "overdemand_events": 2,
      "optimization_opportunities": [
        {
          "event_id": "evt_def456",
          "current_capacity": 600,
          "recommended_capacity": 750,
          "potential_additional_revenue": 2450.00
        }
      ]
    },
    "operational_efficiency": {
      "avg_setup_time_minutes": 45,
      "avg_breakdown_time_minutes": 30,
      "incidents_count": 3,
      "maintenance_hours": 12,
      "staff_efficiency_score": 0.87
    },
    "access_control_analytics": {
      "avg_entry_time_seconds": 23.5,
      "peak_entry_load": 245,
      "bottleneck_gates": ["Entrée A", "Entrée C"],
      "smooth_flow_score": 0.82
    },
    "customer_satisfaction": {
      "venue_rating": 4.3,
      "accessibility_score": 4.1,
      "comfort_score": 4.0,
      "facilities_score": 4.2,
      "feedback_count": 187
    },
    "realtime_status": {
      "current_event": {
        "event_id": "evt_current",
        "title": "Concert Live Tonight",
        "current_attendance": 567,
        "expected_peak": 720,
        "entry_rate_per_minute": 12.3
      },
      "system_status": {
        "access_control_operational": true,
        "emergency_systems_ok": true,
        "last_check": "2024-03-31T19:45:00Z"
      }
    }
  }
}
```

## 📈 Dashboard Plateforme Global

### GET /api/v1/analytics/dashboards/platform/executive
**Description** : Dashboard executive global Entrix (Super Admin uniquement)

#### Headers
```http
Authorization: Bearer [SUPER_ADMIN_TOKEN]
X-Access-Level: platform:admin
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "platform_overview": {
      "gmv_total": 2847530.45,
      "gmv_growth_percent": 34.8,
      "active_organizers": 156,
      "total_events_month": 342,
      "total_tickets_sold": 45672,
      "platform_commission": 284753.05,
      "net_promoter_score": 72
    },
    "market_segments": {
      "concerts": {
        "gmv": 1586234.20,
        "market_share_percent": 55.7,
        "growth_rate": 42.3
      },
      "conferences": {
        "gmv": 734521.15,
        "market_share_percent": 25.8,
        "growth_rate": 28.9
      },
      "sports": {
        "gmv": 526775.10,
        "market_share_percent": 18.5,
        "growth_rate": 31.2
      }
    },
    "geographic_distribution": {
      "tunis": {
        "gmv": 1423765.23,
        "organizers": 67,
        "market_share_percent": 50.0
      },
      "sfax": {
        "gmv": 568906.09,
        "organizers": 28,
        "market_share_percent": 20.0
      },
      "sousse": {
        "gmv": 427359.07,
        "organizers": 31,
        "market_share_percent": 15.0
      },
      "other": {
        "gmv": 427500.06,
        "organizers": 30,
        "market_share_percent": 15.0
      }
    },
    "customer_metrics": {
      "total_users": 89453,
      "monthly_active_users": 23678,
      "customer_acquisition_cost": 23.45,
      "customer_lifetime_value": 187.23,
      "retention_rate_percent": 68.9
    },
    "technology_metrics": {
      "api_calls_per_day": 2456789,
      "avg_response_time_ms": 156,
      "uptime_percent": 99.97,
      "error_rate_percent": 0.023
    }
  }
}
```

---

# API Analytics comportementaux

## 👥 Segmentation clients avancée

### GET /api/v1/analytics/customers/segmentation
**Description** : Segmentation RFM et comportementale des clients

#### Query Parameters
- `segment_type` (string, optional) : Type de segmentation
  - `rfm`, `behavioral`, `predictive`, `custom`
  - Default: `rfm`
- `min_orders` (integer, optional) : Minimum de commandes pour inclusion
- `include_predictions` (boolean, optional) : Inclure prédictions de valeur

#### Response 200
```json
{
  "success": true,
  "data": {
    "segmentation_summary": {
      "total_customers": 15672,
      "segmented_customers": 12458,
      "last_updated": "2024-03-31T00:00:00Z",
      "model_accuracy": 0.87
    },
    "segments": {
      "champions": {
        "count": 1247,
        "percentage": 10.0,
        "avg_lifetime_value": 456.78,
        "avg_recency_days": 12,
        "avg_order_frequency": 2.3,
        "characteristics": {
          "rfm_score_range": "13-15",
          "preferred_categories": ["concerts", "festivals"],
          "avg_session_duration": 780,
          "mobile_usage_percent": 68.5
        },
        "recommendations": [
          "VIP programs",
          "Early access tickets",
          "Exclusive content"
        ]
      },
      "loyal_customers": {
        "count": 2494,
        "percentage": 20.0,
        "avg_lifetime_value": 287.45,
        "avg_recency_days": 23,
        "avg_order_frequency": 1.8,
        "characteristics": {
          "rfm_score_range": "10-12",
          "preferred_categories": ["concerts", "conferences"],
          "avg_session_duration": 650,
          "mobile_usage_percent": 72.1
        },
        "recommendations": [
          "Loyalty rewards",
          "Personalized offers",
          "Cross-selling"
        ]
      },
      "new_customers": {
        "count": 1870,
        "percentage": 15.0,
        "avg_lifetime_value": 89.23,
        "avg_recency_days": 8,
        "avg_order_frequency": 0.3,
        "characteristics": {
          "rfm_score_range": "6-9",
          "preferred_categories": ["varied"],
          "avg_session_duration": 420,
          "mobile_usage_percent": 78.9
        },
        "recommendations": [
          "Welcome campaigns",
          "Educational content",
          "First purchase incentives"
        ]
      },
      "at_risk_high_value": {
        "count": 623,
        "percentage": 5.0,
        "avg_lifetime_value": 378.92,
        "avg_recency_days": 89,
        "avg_order_frequency": 2.1,
        "characteristics": {
          "rfm_score_range": "7-10",
          "preferred_categories": ["concerts", "sports"],
          "avg_session_duration": 340,
          "mobile_usage_percent": 65.2
        },
        "recommendations": [
          "Win-back campaigns",
          "Special discounts",
          "Re-engagement content"
        ]
      }
    },
    "behavioral_insights": {
      "peak_activity_hours": ["19:00-21:00", "14:00-16:00"],
      "seasonal_patterns": {
        "high_season": ["June", "July", "December"],
        "low_season": ["February", "August"]
      },
      "conversion_patterns": {
        "anonymous_to_registered": 18.4,
        "first_to_repeat_purchase": 42.7,
        "cross_category_adoption": 23.8
      }
    }
  }
}
```

### GET /api/v1/analytics/customers/journey
**Description** : Analyse parcours client et funnel de conversion

#### Query Parameters
- `journey_type` (string, optional) : Type de parcours
  - `acquisition`, `conversion`, `retention`, `full`
  - Default: `full`
- `cohort_period` (string, optional) : Période cohorte, default: `monthly`

#### Response 200
```json
{
  "success": true,
  "data": {
    "conversion_funnel": {
      "anonymous_visitors": {
        "count": 45672,
        "percentage": 100.0
      },
      "event_page_views": {
        "count": 18934,
        "percentage": 41.4,
        "conversion_rate": 41.4
      },
      "cart_additions": {
        "count": 8567,
        "percentage": 18.8,
        "conversion_rate": 45.2
      },
      "checkout_initiated": {
        "count": 6234,
        "percentage": 13.6,
        "conversion_rate": 72.8
      },
      "payment_completed": {
        "count": 5123,
        "percentage": 11.2,
        "conversion_rate": 82.2
      },
      "account_created": {
        "count": 2876,
        "percentage": 6.3,
        "conversion_rate": 56.1
      }
    },
    "cohort_analysis": {
      "acquisition_cohorts": [
        {
          "cohort": "2024-01",
          "initial_size": 1234,
          "retention_periods": {
            "month_1": 0.68,
            "month_2": 0.45,
            "month_3": 0.32,
            "month_6": 0.23
          },
          "ltv_progression": [89.50, 156.78, 234.45, 345.67]
        }
      ]
    },
    "drop_off_analysis": {
      "cart_abandonment": {
        "rate_percent": 27.2,
        "primary_reasons": [
          "Payment method issues",
          "Unexpected fees",
          "Site performance"
        ],
        "recovery_potential": 1890
      },
      "checkout_abandonment": {
        "rate_percent": 17.8,
        "primary_reasons": [
          "Payment failed",
          "Site crashed",
          "Changed mind"
        ],
        "recovery_potential": 856
      }
    },
    "customer_lifetime_patterns": {
      "avg_time_to_second_purchase": 23.5,
      "avg_time_between_purchases": 45.2,
      "churn_prediction_accuracy": 0.84,
      "high_value_customer_traits": [
        "Multiple event categories",
        "Mobile app usage",
        "Social sharing"
      ]
    }
  }
}
```

---

# API IA prédictive et recommandations

## 🔮 Prédictions demande événements

### POST /api/v1/analytics/predictions/event-demand
**Description** : Prédiction demande pour un événement spécifique

#### Request Body
```json
{
  "event_id": "evt_abc123",
  "prediction_horizon_days": 30,
  "include_external_factors": true,
  "confidence_level": 0.85
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_details": {
      "event_id": "evt_abc123",
      "title": "Festival Jazz de Tabarka 2024",
      "category": "FESTIVAL",
      "venue_capacity": 2500,
      "current_sales": 456,
      "days_until_event": 45
    },
    "demand_prediction": {
      "predicted_sales": 2187,
      "confidence_interval": {
        "lower": 1945,
        "upper": 2429,
        "confidence": 0.85
      },
      "peak_sales_periods": [
        {
          "start": "2024-05-15",
          "end": "2024-05-20",
          "expected_sales": 456,
          "reasons": ["Payday period", "Marketing campaign launch"]
        }
      ],
      "sales_curve_prediction": [
        {
          "date": "2024-04-01",
          "cumulative_sales": 500,
          "daily_sales": 12
        }
      ]
    },
    "external_factors": {
      "weather_impact": {
        "forecast_quality": "GOOD",
        "impact_score": 0.15,
        "description": "Weather favorable for outdoor festival"
      },
      "competition_analysis": {
        "competing_events": 2,
        "impact_score": -0.08,
        "description": "2 events similar period, impact modéré"
      },
      "economic_context": {
        "consumer_confidence": 0.72,
        "disposable_income_trend": "STABLE",
        "impact_score": 0.05
      },
      "social_buzz": {
        "social_mentions": 2456,
        "sentiment_score": 0.78,
        "influence_score": 0.23
      }
    },
    "recommendations": [
      {
        "type": "PRICING_STRATEGY",
        "action": "Maintenir prix actuels jusqu'au 15 Mai, puis augmenter VIP 10%",
        "expected_impact": "+5.2% revenus",
        "confidence": 0.79
      },
      {
        "type": "MARKETING_TIMING",
        "action": "Lancer campagne intensive du 10-15 Mai",
        "expected_impact": "+12% conversions",
        "confidence": 0.84
      }
    ],
    "risk_factors": [
      {
        "risk": "Météo défavorable",
        "probability": 0.15,
        "impact": "Réduction 15-20% attendance"
      }
    ],
    "model_metadata": {
      "model_version": "v2.3.1",
      "training_data_points": 45672,
      "accuracy_on_similar_events": 0.87,
      "last_retrained": "2024-03-15T00:00:00Z"
    }
  }
}
```

### GET /api/v1/analytics/predictions/revenue-forecast
**Description** : Prévisions revenus organisateur avec IA

#### Query Parameters
- `forecast_period` (string, optional) : Période prévision
  - `week`, `month`, `quarter`, `year`
  - Default: `month`
- `include_scenarios` (boolean, optional) : Inclure scénarios optimiste/pessimiste

#### Response 200
```json
{
  "success": true,
  "data": {
    "base_forecast": {
      "period": "next_month",
      "predicted_revenue": 52340.50,
      "confidence": 0.73,
      "growth_rate_percent": 14.8
    },
    "scenarios": {
      "optimistic": {
        "revenue": 61450.75,
        "probability": 0.25,
        "key_factors": [
          "All events reach capacity",
          "No competitor events",
          "Favorable weather"
        ]
      },
      "realistic": {
        "revenue": 52340.50,
        "probability": 0.50,
        "key_factors": [
          "Normal market conditions",
          "Expected competition",
          "Average weather"
        ]
      },
      "pessimistic": {
        "revenue": 43890.25,
        "probability": 0.25,
        "key_factors": [
          "Economic downturn",
          "Strong competition",
          "Bad weather impact"
        ]
      }
    },
    "revenue_drivers": [
      {
        "factor": "Upcoming Festival Jazz",
        "impact_percent": 35.7,
        "confidence": 0.89
      },
      {
        "factor": "Seasonal demand increase",
        "impact_percent": 18.3,
        "confidence": 0.72
      },
      {
        "factor": "Improved conversion rate",
        "impact_percent": 12.1,
        "confidence": 0.68
      }
    ],
    "recommendations": [
      {
        "category": "CAPACITY_OPTIMIZATION",
        "suggestion": "Ajouter session supplémentaire pour 'Concert Classics'",
        "expected_additional_revenue": 8750.00,
        "effort_level": "MEDIUM"
      }
    ]
  }
}
```

## 🎯 Système de recommandations IA

### GET /api/v1/analytics/recommendations/personalized
**Description** : Recommandations personnalisées pour organisateur

#### Query Parameters
- `recommendation_types` (array, optional) : Types de recommandations
  - `pricing`, `marketing`, `capacity`, `timing`, `content`
- `priority_level` (string, optional) : Niveau priorité, default: `high`

#### Response 200
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec_001",
        "type": "PRICING_OPTIMIZATION",
        "priority": "HIGH",
        "title": "Optimiser prix événement 'Concert Jazz'",
        "description": "IA recommande augmentation 15% prix VIP basée sur demande observée",
        "expected_impact": {
          "revenue_increase": 3420.50,
          "confidence": 0.84,
          "time_to_implement": "1 day"
        },
        "implementation": {
          "difficulty": "EASY",
          "required_actions": [
            "Mettre à jour prix tier VIP",
            "Notifier clients en wishlist",
            "Ajuster messages marketing"
          ]
        },
        "urgency_score": 0.87,
        "expires_at": "2024-04-15T00:00:00Z"
      },
      {
        "id": "rec_002",
        "type": "MARKETING_TIMING",
        "priority": "MEDIUM",
        "title": "Lancer campagne Facebook pour 'Festival Électro'",
        "description": "Timing optimal détecté pour campagne basé sur audience behavior",
        "expected_impact": {
          "conversion_increase": 23.4,
          "reach_estimate": 15670,
          "confidence": 0.76
        },
        "implementation": {
          "difficulty": "MEDIUM",
          "budget_required": 450.00,
          "duration_days": 7
        },
        "urgency_score": 0.64
      },
      {
        "id": "rec_003",
        "type": "CAPACITY_ADJUSTMENT",
        "priority": "LOW",
        "title": "Réduire capacité pour améliorer expérience",
        "description": "Événement 'Théâtre Intimiste' performerait mieux avec moins de places",
        "expected_impact": {
          "satisfaction_increase": 0.8,
          "premium_pricing_opportunity": 1250.00,
          "confidence": 0.69
        }
      }
    ],
    "implementation_roadmap": {
      "immediate": ["rec_001"],
      "this_week": ["rec_002"],
      "this_month": ["rec_003"]
    },
    "ai_insights": {
      "model_confidence": 0.82,
      "recommendations_based_on": [
        "Historical performance data",
        "Market trends analysis",
        "Competitor benchmarking",
        "Customer behavior patterns"
      ],
      "next_update": "2024-04-02T00:00:00Z"
    }
  }
}
```

---

# API Reporting et exports

## 📑 Rapports automatisés

### GET /api/v1/analytics/reports/revenue
**Description** : Rapport détaillé revenus avec drill-down

#### Query Parameters
- `start_date` (string, required) : Date début (ISO 8601)
- `end_date` (string, required) : Date fin (ISO 8601)
- `breakdown_by` (string, optional) : Dimension breakdown
  - `day`, `week`, `month`, `event`, `category`, `venue`
- `format` (string, optional) : Format export
  - `json`, `csv`, `xlsx`, `pdf`
  - Default: `json`
- `include_comparisons` (boolean, optional) : Inclure comparaisons périodes

#### Response 200
```json
{
  "success": true,
  "data": {
    "report_metadata": {
      "title": "Rapport Revenus - Mars 2024",
      "period": {
        "start": "2024-03-01T00:00:00Z",
        "end": "2024-03-31T23:59:59Z"
      },
      "generated_at": "2024-04-01T09:00:00Z",
      "organizer_id": "org_xyz789"
    },
    "executive_summary": {
      "total_gross_revenue": 45780.50,
      "total_net_revenue": 41202.45,
      "platform_fees": 4578.05,
      "payment_processing_fees": 687.71,
      "total_orders": 287,
      "average_order_value": 159.58,
      "growth_vs_previous_period": 23.4
    },
    "revenue_breakdown": [
      {
        "period": "2024-03-01",
        "gross_revenue": 1834.50,
        "net_revenue": 1651.05,
        "orders": 12,
        "avg_order_value": 152.88,
        "events_active": 3
      }
    ],
    "payment_analysis": {
      "by_method": {
        "credit_card": {
          "revenue": 32589.35,
          "percentage": 71.2,
          "avg_transaction_value": 167.34,
          "success_rate": 97.8
        },
        "flouci": {
          "revenue": 8734.20,
          "percentage": 19.1,
          "avg_transaction_value": 142.89,
          "success_rate": 99.2
        },
        "bank_transfer": {
          "revenue": 4456.95,
          "percentage": 9.7,
          "avg_transaction_value": 445.70,
          "success_rate": 95.4
        }
      }
    },
    "event_performance": [
      {
        "event_id": "evt_abc123",
        "event_title": "Concert Hamza Namira",
        "gross_revenue": 18670.50,
        "net_revenue": 16803.45,
        "tickets_sold": 245,
        "capacity_utilization": 89.1,
        "roi_percent": 234.5,
        "profit_margin": 78.9
      }
    ],
    "geographic_analysis": {
      "by_customer_location": {
        "tunis": {
          "revenue": 22890.25,
          "percentage": 50.0,
          "customers": 143
        },
        "sfax": {
          "revenue": 9156.10,
          "percentage": 20.0,
          "customers": 57
        },
        "other": {
          "revenue": 13734.15,
          "percentage": 30.0,
          "customers": 87
        }
      }
    },
    "trends_analysis": {
      "growth_trajectory": "POSITIVE",
      "seasonal_factors": {
        "month_index": 1.15,
        "seasonal_adjustment": "Spring boost expected"
      },
      "forecast_next_month": {
        "predicted_revenue": 52340.00,
        "confidence_interval": [48200.00, 56800.00]
      }
    }
  }
}
```

### GET /api/v1/analytics/reports/customer-analytics
**Description** : Rapport analytics clients et segmentation

#### Response 200
```json
{
  "success": true,
  "data": {
    "customer_overview": {
      "total_customers": 1247,
      "new_customers_period": 89,
      "returning_customers": 156,
      "churn_rate_percent": 8.7,
      "avg_customer_lifetime_value": 234.67
    },
    "segmentation_analysis": {
      "rfm_distribution": {
        "champions": {"count": 125, "percentage": 10.0},
        "loyal_customers": {"count": 249, "percentage": 20.0},
        "potential_loyalists": {"count": 187, "percentage": 15.0},
        "new_customers": {"count": 162, "percentage": 13.0},
        "promising": {"count": 137, "percentage": 11.0},
        "need_attention": {"count": 125, "percentage": 10.0},
        "about_to_sleep": {"count": 100, "percentage": 8.0},
        "at_risk": {"count": 87, "percentage": 7.0},
        "cannot_lose_them": {"count": 50, "percentage": 4.0},
        "hibernating": {"count": 25, "percentage": 2.0}
      }
    },
    "behavioral_insights": {
      "preferred_categories": [
        {"category": "CONCERTS", "percentage": 45.7},
        {"category": "FESTIVALS", "percentage": 28.3},
        {"category": "CONFERENCES", "percentage": 26.0}
      ],
      "purchasing_patterns": {
        "avg_time_between_purchases": 34.5,
        "preferred_purchase_time": "19:00-21:00",
        "mobile_vs_desktop": {"mobile": 67.8, "desktop": 32.2}
      }
    },
    "retention_metrics": {
      "first_month_retention": 68.4,
      "three_month_retention": 42.7,
      "six_month_retention": 31.8,
      "twelve_month_retention": 23.5
    }
  }
}
```

### POST /api/v1/analytics/reports/custom
**Description** : Génération rapport personnalisé

#### Request Body
```json
{
  "report_name": "Performance Q1 2024",
  "metrics": [
    "revenue",
    "attendance",
    "conversion_rate",
    "customer_satisfaction"
  ],
  "dimensions": [
    "event_category",
    "venue",
    "payment_method"
  ],
  "filters": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "event_categories": ["CONCERTS", "FESTIVALS"],
    "min_revenue": 1000
  },
  "format": "xlsx",
  "delivery": {
    "email": "manager@organizer.com",
    "schedule": "weekly"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "report_id": "rep_custom_001",
    "status": "GENERATING",
    "estimated_completion": "2024-04-01T09:05:00Z",
    "download_url": null,
    "email_notification": true
  }
}
```

---

# API Métriques et KPIs

## 📊 KPIs organisateur

### GET /api/v1/analytics/kpis/organizer
**Description** : KPIs essentiels organisateur

#### Query Parameters
- `period` (string, optional) : Default: `30d`
- `compare_to` (string, optional) : Période comparaison
  - `previous_period`, `same_period_last_year`

#### Response 200
```json
{
  "success": true,
  "data": {
    "financial_kpis": {
      "gross_revenue": {
        "value": 45780.50,
        "unit": "TND",
        "change_percent": 23.4,
        "trend": "UP",
        "target": 50000.00,
        "achievement_percent": 91.6
      },
      "net_revenue": {
        "value": 41202.45,
        "unit": "TND",
        "change_percent": 21.8,
        "trend": "UP"
      },
      "average_order_value": {
        "value": 159.58,
        "unit": "TND",
        "change_percent": 4.1,
        "trend": "UP"
      },
      "profit_margin": {
        "value": 89.9,
        "unit": "PERCENT",
        "change_percent": -1.2,
        "trend": "DOWN"
      }
    },
    "operational_kpis": {
      "conversion_rate": {
        "value": 4.2,
        "unit": "PERCENT",
        "change_percent": 0.8,
        "trend": "UP",
        "benchmark": 3.8
      },
      "event_fill_rate": {
        "value": 76.3,
        "unit": "PERCENT",
        "change_percent": 12.1,
        "trend": "UP"
      },
      "customer_acquisition_cost": {
        "value": 23.45,
        "unit": "TND",
        "change_percent": -15.3,
        "trend": "UP"
      },
      "customer_lifetime_value": {
        "value": 187.23,
        "unit": "TND",
        "change_percent": 28.7,
        "trend": "UP"
      }
    },
    "engagement_kpis": {
      "nps_score": {
        "value": 72,
        "unit": "SCORE",
        "change_percent": 8.2,
        "trend": "UP",
        "category": "EXCELLENT"
      },
      "repeat_customer_rate": {
        "value": 42.7,
        "unit": "PERCENT",
        "change_percent": 5.4,
        "trend": "UP"
      },
      "social_engagement": {
        "value": 1847,
        "unit": "INTERACTIONS",
        "change_percent": 67.3,
        "trend": "UP"
      }
    },
    "alerts": [
      {
        "kpi": "profit_margin",
        "type": "WARNING",
        "message": "Marge bénéficiaire en légère baisse (-1.2%)",
        "recommendation": "Réviser structure de coûts"
      }
    ]
  }
}
```

### GET /api/v1/analytics/kpis/realtime
**Description** : Métriques temps réel événement en cours

#### Query Parameters
- `event_id` (UUID, required) : ID événement actif

#### Response 200
```json
{
  "success": true,
  "data": {
    "event_info": {
      "event_id": "evt_live_001",
      "title": "Concert Live Tonight",
      "status": "IN_PROGRESS",
      "start_time": "2024-03-31T20:00:00Z",
      "current_time": "2024-03-31T20:45:00Z"
    },
    "attendance_metrics": {
      "current_attendance": 1247,
      "capacity": 1500,
      "fill_rate_percent": 83.1,
      "entry_rate_last_15min": 23,
      "estimated_final_attendance": 1380
    },
    "access_control_metrics": {
      "entries_per_minute": 12.3,
      "avg_entry_time_seconds": 8.7,
      "queue_length": 45,
      "gates_operational": 4,
      "incidents_count": 0
    },
    "revenue_tracking": {
      "doors_sales": 2340.50,
      "merchandise_sales": 890.25,
      "food_beverage_sales": 1567.80,
      "total_onsite_revenue": 4798.55
    },
    "engagement_metrics": {
      "social_mentions_last_hour": 156,
      "sentiment_score": 0.87,
      "live_stream_viewers": 2341,
      "photo_uploads": 89
    },
    "operational_alerts": [
      {
        "type": "INFO",
        "message": "Pic d'affluence détecté - Entrée B",
        "timestamp": "2024-03-31T20:42:00Z"
      }
    ]
  }
}
```

---

# API Alertes intelligentes

## 🚨 Système d'alertes proactives

### GET /api/v1/analytics/alerts
**Description** : Liste des alertes intelligentes actives

#### Query Parameters
- `severity` (string, optional) : Niveau sévérité
  - `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `category` (string, optional) : Catégorie alerte
  - `PERFORMANCE`, `REVENUE`, `CUSTOMER`, `OPERATIONAL`, `PREDICTIVE`
- `status` (string, optional) : Statut, default: `ACTIVE`

#### Response 200
```json
{
  "success": true,
  "data": {
    "alerts_summary": {
      "total_active": 19,
      "by_severity": {
        "CRITICAL": 2,
        "HIGH": 5,
        "MEDIUM": 7,
        "LOW": 5
      },
      "new_since_last_check": 3
    },
    "alerts": [
      {
        "id": "alert_001",
        "title": "Ventes faibles - Concert Jazz Festival",
        "description": "Seulement 23% de billets vendus à 2 semaines de l'événement",
        "severity": "HIGH",
        "category": "PERFORMANCE",
        "created_at": "2024-03-31T14:30:00Z",
        "target": {
          "type": "EVENT",
          "id": "evt_jazz_001",
          "name": "Jazz Festival 2024"
        },
        "metrics": {
          "current_sales": 287,
          "expected_sales": 1250,
          "completion_percent": 22.9,
          "days_remaining": 14
        },
        "recommendations": [
          {
            "action": "Lancer campagne marketing urgente",
            "impact_estimate": "+300 billets potentiels",
            "effort": "MEDIUM",
            "cost_estimate": 850.00
          },
          {
            "action": "Activer promotion 'Early Bird Extended'",
            "impact_estimate": "+25% conversions",
            "effort": "LOW",
            "cost_estimate": 0
          }
        ],
        "auto_actions_available": true,
        "dismissed": false
      },
      {
        "id": "alert_002",
        "title": "Pic de trafic anormal détecté",
        "description": "Trafic web 400% au-dessus de la normale - possible attaque",
        "severity": "CRITICAL",
        "category": "OPERATIONAL",
        "created_at": "2024-03-31T19:45:00Z",
        "metrics": {
          "current_requests_per_minute": 12450,
          "normal_baseline": 2890,
          "anomaly_score": 0.97
        },
        "auto_actions_taken": [
          "Rate limiting activated",
          "CDN cache increased",
          "Security team notified"
        ],
        "status": "MONITORING"
      },
      {
        "id": "alert_003",
        "title": "Opportunité prix VIP - Festival Électro",
        "description": "IA détecte demande forte pour upgrade prix VIP recommandé",
        "severity": "MEDIUM",
        "category": "REVENUE",
        "created_at": "2024-03-31T16:20:00Z",
        "predictions": {
          "revenue_opportunity": 4567.80,
          "confidence": 0.84,
          "optimal_price_increase": 15.0
        },
        "recommendations": [
          {
            "action": "Augmenter prix VIP de 15%",
            "impact_estimate": "+4567 TND revenus",
            "risk_level": "LOW"
          }
        ]
      }
    ]
  }
}
```

### POST /api/v1/analytics/alerts/configure
**Description** : Configuration alertes personnalisées

#### Request Body
```json
{
  "alert_name": "Low Sales Warning Custom",
  "category": "PERFORMANCE",
  "conditions": {
    "metric": "sales_completion_percent",
    "operator": "LESS_THAN",
    "threshold": 30.0,
    "time_condition": {
      "days_before_event": 14
    }
  },
  "severity": "HIGH",
  "notification_channels": ["EMAIL", "IN_APP", "SMS"],
  "auto_actions": {
    "enabled": true,
    "actions": [
      "TRIGGER_MARKETING_CAMPAIGN",
      "NOTIFY_SALES_TEAM"
    ]
  },
  "schedule": {
    "check_frequency": "HOURLY",
    "active_hours": "09:00-21:00"
  }
}
```

#### Response 201
```json
{
  "success": true,
  "data": {
    "alert_config_id": "config_001",
    "status": "ACTIVE",
    "next_check": "2024-04-01T10:00:00Z"
  }
}
```

---

# API Self-service BI

## 📊 Création rapports personnalisés

### POST /api/v1/analytics/bi/queries
**Description** : Exécution requête analytics personnalisée

#### Request Body
```json
{
  "query_name": "Revenue by Category Analysis",
  "data_sources": [
    "orders",
    "events",
    "customers"
  ],
  "metrics": [
    {
      "name": "total_revenue",
      "aggregation": "SUM",
      "field": "orders.total_amount"
    },
    {
      "name": "avg_order_value",
      "aggregation": "AVG",
      "field": "orders.total_amount"
    }
  ],
  "dimensions": [
    "events.category",
    "DATE_TRUNC('month', orders.created_at)"
  ],
  "filters": {
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-03-31"
    },
    "event_categories": ["CONCERTS", "FESTIVALS"],
    "order_status": "COMPLETED"
  },
  "order_by": [
    {"field": "total_revenue", "direction": "DESC"}
  ],
  "limit": 100
}
```

#### Response 200
```json
{
  "success": true,
  "data": {
    "query_id": "query_001",
    "execution_time_ms": 234,
    "row_count": 24,
    "results": [
      {
        "category": "CONCERTS",
        "month": "2024-03",
        "total_revenue": 32450.75,
        "avg_order_value": 167.34
      },
      {
        "category": "FESTIVALS",
        "month": "2024-03",
        "total_revenue": 18670.50,
        "avg_order_value": 145.67
      }
    ],
    "metadata": {
      "columns": [
        {"name": "category", "type": "string"},
        {"name": "month", "type": "date"},
        {"name": "total_revenue", "type": "decimal"},
        {"name": "avg_order_value", "type": "decimal"}
      ]
    }
  }
}
```

### GET /api/v1/analytics/bi/templates
**Description** : Templates prédéfinis pour analyses communes

#### Response 200
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_revenue_analysis",
        "name": "Analyse Revenus Détaillée",
        "description": "Breakdown revenus par période, catégorie et canal",
        "category": "FINANCE",
        "metrics": ["revenue", "orders", "aov"],
        "dimensions": ["time", "category", "channel"],
        "complexity": "MEDIUM",
        "estimated_execution_time": "15s"
      },
      {
        "id": "template_customer_segmentation",
        "name": "Segmentation Clients RFM",
        "description": "Analyse comportementale et segmentation RFM",
        "category": "CUSTOMER",
        "metrics": ["rfm_score", "ltv", "retention"],
        "dimensions": ["segment", "acquisition_channel"],
        "complexity": "HIGH",
        "estimated_execution_time": "45s"
      }
    ]
  }
}
```

---

# API Intégrations analytics

## 🔗 Webhooks événements analytics

### POST /api/v1/analytics/webhooks
**Description** : Configuration webhooks pour événements analytics

#### Request Body
```json
{
  "webhook_name": "Revenue Alerts",
  "endpoint_url": "https://organizer.com/webhooks/analytics",
  "events": [
    "ALERT_CREATED",
    "KPI_THRESHOLD_REACHED",
    "REPORT_GENERATED",
    "PREDICTION_UPDATED"
  ],
  "filters": {
    "severity_levels": ["HIGH", "CRITICAL"],
    "categories": ["REVENUE", "PERFORMANCE"]
  },
  "authentication": {
    "type": "HMAC",
    "secret": "webhook_secret_key"
  }
}
```

### GET /api/v1/analytics/integrations/export
**Description** : Export données vers systèmes externes

#### Query Parameters
- `destination` (string, required) : Destination export
  - `google_analytics`, `facebook_pixel`, `mixpanel`, `custom_api`
- `data_type` (string, required) : Type données à exporter

#### Response 200
```json
{
  "success": true,
  "data": {
    "export_id": "exp_001",
    "status": "PROCESSING",
    "destination": "google_analytics",
    "records_count": 15672,
    "estimated_completion": "2024-04-01T09:15:00Z"
  }
}
```

---

# API Administration analytics

## ⚙️ Configuration et gestion

### GET /api/v1/analytics/admin/data-sources
**Description** : Gestion sources de données (Admin uniquement)

#### Response 200
```json
{
  "success": true,
  "data": {
    "data_sources": [
      {
        "name": "events_warehouse",
        "type": "POSTGRESQL",
        "status": "HEALTHY",
        "last_sync": "2024-03-31T23:55:00Z",
        "record_count": 156789,
        "size_mb": 2340
      },
      {
        "name": "user_analytics_stream",
        "type": "KAFKA_STREAM",
        "status": "HEALTHY",
        "events_per_minute": 1247,
        "lag_seconds": 2.3
      }
    ],
    "ml_models": [
      {
        "model_name": "demand_prediction_v2",
        "version": "2.3.1",
        "accuracy": 0.87,
        "last_trained": "2024-03-28T00:00:00Z",
        "status": "ACTIVE"
      }
    ]
  }
}
```

### POST /api/v1/analytics/admin/ml-models/retrain
**Description** : Reentraînement modèles ML

#### Request Body
```json
{
  "model_name": "demand_prediction_v2",
  "training_data_period": {
    "start": "2023-01-01",
    "end": "2024-03-31"
  },
  "hyperparameters": {
    "learning_rate": 0.001,
    "epochs": 100
  }
}
```

---

# Codes d'erreur

## 📋 Codes d'erreur spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `A001` | Insufficient permissions for analytics access | Droits insuffisants pour analytics |
| `A002` | Invalid date range specified | Plage de dates invalide |
| `A003` | Query timeout - reduce complexity | Requête trop complexe |
| `A004` | ML model not available | Modèle ML indisponible |
| `A005` | Export limit exceeded | Limite d'export dépassée |
| `A006` | Invalid metric combination | Combinaison métriques invalide |
| `A007` | Prediction confidence too low | Confiance prédiction trop faible |
| `A008` | Alert configuration invalid | Configuration alerte invalide |
| `A009` | Report generation failed | Échec génération rapport |
| `A010` | BI query syntax error | Erreur syntaxe requête BI |

---

# Exemples d'usage

## 📊 Cas d'usage typiques

### 1. Monitoring performance organisateur

```bash
# Dashboard executive quotidien
curl -G "https://api.entrix.tn/v1/analytics/dashboards/organizer/executive" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "period=30d" \
  -d "compare_previous=true" \
  -d "include_predictions=true"

# KPIs temps réel
curl -G "https://api.entrix.tn/v1/analytics/kpis/organizer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "period=7d"
```

### 2. Optimisation événement avec IA

```bash
# Prédiction demande événement spécifique
curl -X POST "https://api.entrix.tn/v1/analytics/predictions/event-demand" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "evt_festival_2024",
    "prediction_horizon_days": 45,
    "include_external_factors": true,
    "confidence_level": 0.85
  }'

# Recommandations personnalisées
curl -G "https://api.entrix.tn/v1/analytics/recommendations/personalized" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organizer-ID: $ORGANIZER_ID" \
  -d "recommendation_types=pricing,marketing,capacity" \
  -d "priority_level=high"
```

### 3. Reporting avancé et exports

```bash
# Rapport revenus détaillé
curl -G "https://api.entrix.tn/v1/analytics/reports/revenue" \
  -H "Authorization: Bearer $TOKEN" \
  -d "start_date=2024-01-01" \
  -d "end_date=2024-03-31" \
  -d "breakdown_by=week" \
  -d "format=xlsx" \
  -d "include_comparisons=true"

# Segmentation clients
curl -G "https://api.entrix.tn/v1/analytics/customers/segmentation" \
  -H "Authorization: Bearer $TOKEN" \
  -d "segment_type=rfm" \
  -d "include_predictions=true"
```

### 4. Self-service BI

```bash
# Requête analytics personnalisée
curl -X POST "https://api.entrix.tn/v1/analytics/bi/queries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query_name": "Monthly Revenue Trends",
    "data_sources": ["orders", "events"],
    "metrics": [
      {"name": "total_revenue", "aggregation": "SUM", "field": "orders.total_amount"}
    ],
    "dimensions": ["events.category", "DATE_TRUNC('\''month'\'', orders.created_at)"],
    "filters": {
      "date_range": {"start": "2024-01-01", "end": "2024-03-31"},
      "order_status": "COMPLETED"
    }
  }'
```

### 5. Gestion alertes intelligentes

```bash
# Configuration alerte personnalisée
curl -X POST "https://api.entrix.tn/v1/analytics/alerts/configure" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "Revenue Drop Warning",
    "category": "REVENUE",
    "conditions": {
      "metric": "daily_revenue",
      "operator": "LESS_THAN",
      "threshold": 500.0
    },
    "severity": "HIGH",
    "notification_channels": ["EMAIL", "IN_APP"]
  }'

# Consultation alertes actives
curl -G "https://api.entrix.tn/v1/analytics/alerts" \
  -H "Authorization: Bearer $TOKEN" \
  -d "severity=HIGH,CRITICAL" \
  -d "status=ACTIVE"
```

### 6. Analytics venue en temps réel

```bash
# Dashboard opérationnel venue
curl -G "https://api.entrix.tn/v1/analytics/dashboards/venue/operations" \
  -H "Authorization: Bearer $TOKEN" \
  -d "venue_id=ven_theater_tunis" \
  -d "period=30d" \
  -d "include_realtime=true"

# Métriques événement live
curl -G "https://api.entrix.tn/v1/analytics/kpis/realtime" \
  -H "Authorization: Bearer $TOKEN" \
  -d "event_id=evt_concert_tonight"
```

---

## 🎯 Notes d'implémentation

### Performance et cache
- **Cache Redis** : TTL adaptatif selon fréquence données (5min-24h)
- **Pagination** : Limite 1000 enregistrements par défaut
- **Rate limiting** : 1000 requêtes/heure par organisateur
- **Optimisation requêtes** : Index sur colonnes analytiques fréquentes

### Sécurité
- **Filtrage automatique** : Données limitées selon droits utilisateur
- **Audit trail** : Traçabilité accès données sensibles
- **Anonymisation** : PII masquée dans exports tiers
- **Chiffrement** : Données analytics chiffrées au repos

### ML et IA
- **Mise à jour modèles** : Reentraînement mensuel automatique
- **Monitoring drift** : Détection dérive performance modèles
- **Explainabilité** : Justification recommendations IA
- **Fallback** : Analytics traditionnels si ML indisponible