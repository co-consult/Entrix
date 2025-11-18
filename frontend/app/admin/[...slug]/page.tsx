"use client"

import { UnderDevelopment } from "@/components/ui/under-development"
import { useParams } from "next/navigation"

// Map of page slugs to their specific under development content
const pageConfigs: Record<string, {
  title: string
  description: string
  estimatedCompletion: string
  features: string[]
}> = {
  organizers: {
    title: "Gestion des Organisateurs",
    description: "Module de gestion des organisateurs d'événements en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Création et validation d'organisateurs",
      "Gestion des commissions et paiements",
      "Statistiques et rapports",
      "Validation des documents légaux",
      "Gestion des équipes organisatrices"
    ]
  },
  "subscriptions/plans": {
    title: "Plans d'Abonnement",
    description: "Module de gestion des plans d'abonnement en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Création de plans d'abonnement",
      "Gestion des tarifs et durées",
      "Configuration des avantages",
      "Suivi des abonnements actifs",
      "Rapports de performance"
    ]
  },
  subscriptions: {
    title: "Gestion des Abonnements",
    description: "Module de gestion des abonnements utilisateurs en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Suivi des abonnements actifs",
      "Gestion des renouvellements",
      "Historique des paiements",
      "Statistiques d'utilisation",
      "Support client"
    ]
  },
  events: {
    title: "Gestion des Événements",
    description: "Module de gestion des événements en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Création et édition d'événements",
      "Gestion des lieux et salles",
      "Configuration des billets",
      "Statistiques de participation",
      "Modération des événements"
    ]
  },
  venues: {
    title: "Gestion des Lieux",
    description: "Module de gestion des lieux et salles en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Création de lieux et salles",
      "Gestion des capacités",
      "Configuration des équipements",
      "Planification des disponibilités",
      "Maintenance et entretien"
    ]
  },
  notifications: {
    title: "Système de Notifications",
    description: "Module de gestion des notifications en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Notifications push et email",
      "Templates personnalisables",
      "Planification des envois",
      "Suivi des ouvertures",
      "Gestion des préférences"
    ]
  },
  "audit-logs": {
    title: "Journaux d'Audit",
    description: "Module de journaux d'audit en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Suivi des actions utilisateurs",
      "Historique des modifications",
      "Export des logs",
      "Alertes de sécurité",
      "Conformité RGPD"
    ]
  },
  webhooks: {
    title: "Gestion des Webhooks",
    description: "Module de gestion des webhooks en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Configuration des endpoints",
      "Gestion des événements",
      "Sécurité et authentification",
      "Monitoring des webhooks",
      "Retry automatique"
    ]
  },
  payments: {
    title: "Gestion des Paiements",
    description: "Module de gestion des paiements en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Intégration des moyens de paiement",
      "Gestion des commissions",
      "Rapports financiers",
      "Remboursements",
      "Conformité fiscale"
    ]
  },
  commissions: {
    title: "Gestion des Commissions",
    description: "Module de gestion des commissions en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Calcul automatique des commissions",
      "Gestion des taux variables",
      "Paiements aux organisateurs",
      "Rapports de performance",
      "Historique des transactions"
    ]
  },
  reports: {
    title: "Rapports et Analyses",
    description: "Module de rapports et analyses en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Tableaux de bord interactifs",
      "Rapports personnalisables",
      "Export en différents formats",
      "Analyses prédictives",
      "Alertes automatiques"
    ]
  },
  security: {
    title: "Sécurité et Conformité",
    description: "Module de sécurité et conformité en cours de développement.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Gestion des accès",
      "Audit de sécurité",
      "Conformité RGPD",
      "Chiffrement des données",
      "Backup et récupération"
    ]
  },
  settings: {
    title: "Paramètres Système",
    description: "Module de paramètres système en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Configuration générale",
      "Gestion des utilisateurs",
      "Paramètres de sécurité",
      "Intégrations tierces",
      "Maintenance système"
    ]
  },
  "users/pending": {
    title: "Comptes en attente",
    description: "Module de gestion des comptes utilisateurs en attente de validation.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Validation des nouveaux comptes",
      "Approbation des documents",
      "Notifications automatiques",
      "Historique des validations",
      "Statistiques d'approbation"
    ]
  },
  "users/suspended": {
    title: "Comptes suspendus",
    description: "Module de gestion des comptes utilisateurs suspendus.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Liste des comptes suspendus",
      "Raisons de suspension",
      "Processus de réactivation",
      "Historique des suspensions",
      "Notifications de suspension"
    ]
  },
  "events/pending": {
    title: "Événements en attente",
    description: "Module de modération des événements en attente de validation.",
    estimatedCompletion: "Q2 2025",
    features: [
      "Validation des événements",
      "Modération du contenu",
      "Approbation des organisateurs",
      "Notifications de décision",
      "Historique des validations"
    ]
  },
  "organizers/pending": {
    title: "Organisateurs à valider",
    description: "Module de validation des organisateurs en attente d'approbation.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Validation des documents",
      "Vérification des informations",
      "Processus d'approbation",
      "Notifications automatiques",
      "Historique des validations"
    ]
  },
  "contact-requests": {
    title: "Demandes de Contact",
    description: "Module de gestion des demandes de contact en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Suivi des demandes",
      "Réponses automatisées",
      "Assignation aux agents",
      "Historique des interactions",
      "Statistiques de support"
    ]
  },
  groups: {
    title: "Gestion des Groupes",
    description: "Module de gestion des groupes utilisateurs en cours de développement.",
    estimatedCompletion: "Q1 2025",
    features: [
      "Création de groupes",
      "Gestion des membres",
      "Permissions par groupe",
      "Statistiques d'activité",
      "Communication de groupe"
    ]
  }
}

export default function AdminCatchAllPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug as string
  
  // Get specific config for this page, or use default
  const config = pageConfigs[slug] || {
    title: "Page en cours de développement",
    description: "Cette fonctionnalité est actuellement en cours de développement et sera bientôt disponible.",
    estimatedCompletion: "Bientôt disponible",
    features: [
      "Interface utilisateur moderne",
      "Fonctionnalités avancées",
      "Intégration complète",
      "Performance optimisée",
      "Sécurité renforcée"
    ]
  }

  return <UnderDevelopment {...config} />
} 