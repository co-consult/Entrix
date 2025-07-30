// src/modules/subscription-sales/types/sale-types.ts

/**
 * Types et enums pour le module de vente d'abonnements
 */

// Mode de vente
export enum SaleMode {
  IDENTIFIED = 'IDENTIFIED',     // Client fournit ses informations
  ANONYMOUS = 'ANONYMOUS',       // Client refuse de donner ses infos
}

// Canal de vente
export enum SaleChannel {
  PHYSICAL = 'PHYSICAL',         // Vente au comptoir
  FRONTEND = 'FRONTEND',         // Vente depuis frontend client
}

// Méthode de paiement
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  FLOUCI = 'FLOUCI',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Statut QR code physique
export enum QRCodeStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED', 
  DISABLED = 'DISABLED',
}

// Informations client pour vente identifiée
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fanId?: string;  // Champ optionnel pour fan_id
}

// QR Code physique avec clé onboarding
export interface PhysicalQRCode {
  qrCode: string;
  onboardingKey: string;
  serialNumber: string;
  subscriptionPlanId?: string;
  status: QRCodeStatus;
  cardBatch?: string;
  cardType?: string;
  assignedBy?: string;
}

// Résultat de vente
export interface SaleResult {
  success: boolean;
  subscriptions: {
    id: string;
    qrCode: string;
    onboardingKey: string;
  }[];
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  order: {
    id: string;
    total: number;
    currency: string;
  };
  message: string;
}

// Résultat de conversion anonyme
export interface ConversionResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  subscriptionsMigrated: number;
  incentivesApplied?: {
    type: string;
    value: number;
    description: string;
  };
  message: string;
}