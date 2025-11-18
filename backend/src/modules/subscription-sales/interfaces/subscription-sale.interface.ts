// src/modules/subscription-sales/interfaces/subscription-sale.interface.ts

import { 
  SaleMode, 
  SaleChannel, 
  PaymentMethod, 
  CustomerInfo, 
  PhysicalQRCode,
  SaleResult,
  ConversionResult 
} from '../types/sale-types';

/**
 * Interface pour les données de vente d'abonnement
 */
export interface ISubscriptionSaleData {
  planId: string;
  quantity: number;
  qrCodes: string[];  // QR codes des cartes physiques à assigner
  saleMode: SaleMode;
  saleChannel: SaleChannel;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  customerInfo?: CustomerInfo;  // Requis si saleMode = IDENTIFIED
  sellerId?: string;  // ID du vendeur (pour vente physique)
  sellerEmail?: string;  // Email du vendeur
  sellerName?: string;  // Nom du vendeur
  paymentDetails?: Record<string, any>;  // Détails du paiement (note, etc.)
  note?: string;  // Note optionnelle
  metadata?: Record<string, any>;
}

/**
 * Interface pour les données de conversion anonyme
 */
export interface IAnonymousConversionData {
  onboardingKey: string;
  customerInfo: CustomerInfo;
  password?: string;  // Optionnel, généré automatiquement si non fourni
}

/**
 * Interface pour validation QR codes disponibles
 */
export interface IQRCodeValidation {
  qrCode: string;
  isAvailable: boolean;
  status: string;
  assignedAt?: Date;
  errorMessage?: string;
}

/**
 * Interface du service principal
 */
export interface ISubscriptionSalesService {
  // Vente d'abonnements
  createSubscriptionSale(saleData: ISubscriptionSaleData): Promise<SaleResult>;
  
  // Conversion anonyme → client enregistré
  convertAnonymousSubscription(conversionData: IAnonymousConversionData): Promise<ConversionResult>;
  
  // Validation et gestion QR codes
  validateQRCodesAvailability(qrCodes: string[], planId?: string): Promise<IQRCodeValidation[]>;
  getAvailableQRCodes(planId: string, quantity: number): Promise<PhysicalQRCode[]>;
  
  // Consultation
  getSaleDetails(saleId: string): Promise<any>;
  getSubscriptionsByOnboardingKey(onboardingKey: string): Promise<any[]>;
}