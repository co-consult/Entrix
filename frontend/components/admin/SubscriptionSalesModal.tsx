"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { 
  User, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Users,
  QrCode, 
  Calendar,
  Star,
  Crown,
  Zap,
  Plus,
  Copy,
  Eye,
  EyeOff,
  ShoppingCart,
  MapPin,
  UserCheck,
  UserX,
  Search,
  Trash2,
  X,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Receipt,
  Check,
  AlertCircle
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_days?: number;
  zones?: Array<{
  id: string;
  name: string;
  code: string;
  capacity: number;
  hasSeats: boolean;
  availableSeatsCount: number;
    zoneType: string;
  }>;
}

interface SubscriptionItem {
  planId: string;
  plan: Plan;
  quantity: number;
  qrCodes: string[];
  qrCodesInfo: QRCodeInfo[];
}

interface QRCodeInfo {
  qr_code: string;
  onboarding_key: string;
  serial_number: string;
  card_batch?: string;
  card_type?: string;
  status: string;
  seat_number?: string; // For seat assignment
  row_number?: string; // Row number for seat
  zone_name?: string; // Zone name for seat
  seat_code?: string; // Seat code/identifier
  planId?: string; // Track which plan this QR code belongs to
}

interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string; // Made optional
  socios_number?: string; // Renamed from fan_id
  css_mobile?: string; // CSS Mobile metadata
  noPrice?: boolean; // Flag for sponsor/partner (0 fees)
  sponsorType?: 'SPONSOR' | 'PARTNER'; // Type of sponsor/partner
}

interface PaymentDetails {
  method: 'CASH' | 'CARD' | 'FLOUCI' | 'BANK_TRANSFER' | 'SOCIOS' | 'CHEQUE' | 'NO_FEE';
  transactionNumber?: string;
  checkNumber?: string;
  sociosNote?: string;
  sociosNumber?: string;
  note?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function SubscriptionSalesModal({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<number>(1);
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItem[]>([]);
  const [userMode, setUserMode] = useState<'IDENTIFIED' | 'ANONYMOUS'>('IDENTIFIED');
  const [qrCodesInput, setQrCodesInput] = useState<string>("");
  const [qrCodesInfo, setQrCodesInfo] = useState<QRCodeInfo[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    socios_number: '',
    css_mobile: '',
    noPrice: false,
    sponsorType: undefined
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [noPriceOverride, setNoPriceOverride] = useState<boolean>(false);
  const [sponsorTypeOverride, setSponsorTypeOverride] = useState<'SPONSOR' | 'PARTNER'>('SPONSOR');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'CASH'
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPlanValue, setSelectedPlanValue] = useState<string>("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  // Check if current user is a sponsor/partner
  const isSponsorPartner = () => {
    if (selectedUser) {
      return selectedUser.metadata?.isNoPriceUser || noPriceOverride;
    } else {
      return customerInfo.noPrice;
    }
  };

  // Automatically update payment method when selected user changes
  useEffect(() => {
    if (selectedUser && selectedUser.metadata?.isNoPriceUser) {
      setPaymentDetails(prev => ({ ...prev, method: 'NO_FEE' }));
    }
  }, [selectedUser]);

  // Check if user is valid for step 2
  const isUserValid = () => {
    if (userMode === 'ANONYMOUS') {
      return true; // Anonymous mode doesn't require user info
    }
    
    // Check if user is selected or customer info is filled
    const hasSelectedUser = selectedUser !== null;
    const hasCustomerInfo = customerInfo.first_name.trim() && 
                           customerInfo.last_name.trim() && 
                           customerInfo.email.trim();
    
    if (!hasSelectedUser && !hasCustomerInfo) {
      return false;
    }
    
    // If creating new user, validate all required fields
    if (!hasSelectedUser && hasCustomerInfo) {
      if (!customerInfo.first_name.trim() || 
          !customerInfo.last_name.trim() || 
          !customerInfo.email.trim()) {
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        return false;
      }
    }
    
    return true;
  };

  const steps = [
    { id: 1, title: "Types & Quantités", icon: Crown },
    { id: 2, title: "Mode Utilisateur", icon: UserCheck },
    { id: 3, title: "Codes QR", icon: QrCode },
    { id: 4, title: "Paiement", icon: CreditCard },
    { id: 5, title: "Résumé", icon: CheckCircle }
  ];

  // Handle QR code search by serial number
  const handleQRCodeSearch = async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir un numéro de série", variant: "destructive" });
      return;
    }

    // Check if any plans are selected
    if (subscriptionItems.length === 0) {
      toast({ 
        title: "Aucun plan sélectionné", 
        description: "Veuillez d'abord sélectionner un plan d'abonnement", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // Get all plan IDs for validation
      const planIds = subscriptionItems.map(item => item.plan.id);
      const planNames = subscriptionItems.map(item => item.plan.name);
      
      // Check which plans still need QR codes
      const plansNeedingQRCodes = subscriptionItems.filter(item => {
        const existingQRCodesForPlan = qrCodesInfo.filter(qr => qr.planId === item.plan.id).length;
        return existingQRCodesForPlan < item.quantity;
      });
      
      if (plansNeedingQRCodes.length === 0) {
        toast({
          title: "Tous les plans sont complets", 
          description: "Vous avez déjà tous les QR codes nécessaires pour tous les plans sélectionnés.", 
          variant: "default" 
        });
        setSearchTerm("");
        return;
      }
      
      // Try to find QR code that matches any of the plans that still need QR codes
      let foundQRCode = null;
      let errorMessage = null;
      let foundPlanName = null;
      let foundPlanId = null;

      for (let i = 0; i < planIds.length; i++) {
        const planId = planIds[i];
        const planName = planNames[i];
        
        // Skip plans that already have enough QR codes
        const existingQRCodesForPlan = qrCodesInfo.filter(qr => qr.planId === planId).length;
        const planItem = subscriptionItems.find(item => item.plan.id === planId);
        if (!planItem || existingQRCodesForPlan >= planItem.quantity) {
          continue;
        }
        
        try {
          const response = await apiClient.getQRCodeBySerialNumber(searchTerm, planId);
          if (response && response.qr_code) {
            foundQRCode = response;
            foundPlanName = planName;
            foundPlanId = planId;
            break;
          }
        } catch (error: any) {
          if (error.response?.status === 400) {
            // QR code found but doesn't belong to this plan
            errorMessage = error.message || "QR code n'appartient pas au plan sélectionné";
          } else if (error.response?.status === 404) {
            // QR code not found, continue to next plan
            continue;
          } else {
            // Other error, stop searching
            throw error;
          }
        }
      }

      if (foundQRCode) {
        // Find which plan this QR code belongs to
        const matchingPlan = subscriptionItems.find(item => item.plan.id === foundPlanId);
        
        if (!matchingPlan) {
          toast({
            title: "Plan non correspondant", 
            description: `Ce QR code n'appartient à aucun des plans sélectionnés.`, 
            variant: "destructive" 
          });
          setSearchTerm(""); // Clear search term
          return;
        }
        
        // Count how many QR codes we already have for this specific plan
        const existingQRCodesForPlan = qrCodesInfo.filter(qr => qr.planId === matchingPlan.plan.id).length;
        
        // Check if we already have enough QR codes for this specific plan
        if (existingQRCodesForPlan >= matchingPlan.quantity) {
          toast({
            title: "Limite atteinte pour ce plan", 
            description: `Vous avez déjà ${existingQRCodesForPlan}/${matchingPlan.quantity} QR codes pour le plan "${matchingPlan.plan.name}". Supprimez un QR code existant pour ce plan pour en ajouter un nouveau.`, 
            variant: "destructive" 
          });
          setSearchTerm(""); // Clear search term
          return;
        }
        
        // Directly process and add the QR code to qrCodesInfo
        const newQRInfo: QRCodeInfo = {
          qr_code: foundQRCode.qr_code,
          onboarding_key: foundQRCode.onboarding_key,
          serial_number: foundQRCode.serial_number,
          card_batch: foundQRCode.card_batch,
          card_type: foundQRCode.card_type,
          status: foundQRCode.status,
          seat_number: foundQRCode.seat_number || '',
          row_number: foundQRCode.row_number || '',
          zone_name: foundQRCode.zone_name || '',
          seat_code: foundQRCode.seat_code || '',
          planId: matchingPlan.plan.id
        };
        
        // Check if QR code is already in the list
        const isAlreadyAdded = qrCodesInfo.some(qr => qr.qr_code === foundQRCode.qr_code);
        
        if (!isAlreadyAdded) {
          setQrCodesInfo(prev => [...prev, newQRInfo]);
          
          // Also add to text area for consistency
          setQrCodesInput(prev => {
            const existingCodes = prev.trim() ? prev.split('\n').filter(code => code.trim()) : [];
            if (!existingCodes.includes(foundQRCode.qr_code)) {
              return prev + (prev.trim() ? '\n' : '') + foundQRCode.qr_code;
            }
            return prev;
          });
          
          toast({
            title: "Code QR trouvé", 
            description: `Le code QR ${foundQRCode.qr_code} (Plan: ${foundPlanName}) a été ajouté (${existingQRCodesForPlan + 1}/${matchingPlan.quantity} pour ce plan)`, 
            variant: "default" 
          });
        } else {
          toast({
            title: "Code QR déjà ajouté", 
            description: `Le code QR ${foundQRCode.qr_code} est déjà dans la liste`, 
            variant: "default" 
          });
        }
        
        setSearchTerm(""); // Clear search term
      } else {
        // No QR code found, but check if we have a specific error message
        if (errorMessage) {
          toast({ 
            title: "Code QR non compatible", 
            description: errorMessage, 
            variant: "destructive"
          });
        } else {
          // Show which plans still need QR codes
          const plansNeedingQRCodesNames = plansNeedingQRCodes.map(item => item.plan.name).join(', ');
          toast({ 
            title: "Code QR non trouvé", 
            description: `Aucun code QR trouvé avec le numéro de série ${searchTerm} pour les plans qui ont encore besoin de QR codes: ${plansNeedingQRCodesNames}`, 
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erreur de recherche", 
        description: error.message || "Erreur lors de la recherche", 
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user search
  const handleUserSearch = async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir un terme de recherche", variant: "destructive" });
      return;
    }

    setUserSearchLoading(true);
    try {
      // Use the API client with automatic token refresh
      const response = await apiClient.searchUsers(searchTerm, 10);
      
      if (response && Array.isArray(response)) {
        setUserSearchResults(response);
        if (response.length === 0) {
          toast({
            title: "Aucun utilisateur trouvé", 
            description: "Aucun utilisateur ne correspond à votre recherche", 
            variant: "default" 
          });
        }
      } else {
        toast({ 
          title: "Erreur de recherche", 
          description: "Erreur lors de la recherche d'utilisateurs", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error('User search error:', error);
      toast({ 
        title: "Erreur de recherche", 
        description: error.message || "Erreur lors de la recherche d'utilisateurs", 
        variant: "destructive" 
      });
    } finally {
      setUserSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    async function loadData() {
      setLoading(true);
      try {
        const plansRes = await apiClient.getAvailablePlansForSales();
        console.log('Plans response:', plansRes);
        if (plansRes && Array.isArray(plansRes)) {
          setPlans(plansRes);
    } else {
          console.warn('No plans data or invalid format:', plansRes);
          setPlans([]);
        }
      } catch (e) {
        toast({ title: "Erreur", description: "Impossible de charger les plans d'abonnement", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // Reset state on open
    setStep(1);
    setSubscriptionItems([]);
    setUserMode('IDENTIFIED');
    setPaymentDetails({ method: 'CASH' });
    setQrCodesInput("");
    setQrCodesInfo([]);
    setSelectedPlanValue("");
    setSelectedUser(null);
    setCustomerInfo({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      socios_number: ''
    });
    setNoPriceOverride(false);
    setSponsorTypeOverride('SPONSOR');
  }, [open]);

  // Adjust steps based on user type - skip payment step for sponsor/partner users
  const adjustedSteps = isSponsorPartner() 
    ? steps.filter(step => step.id !== 4) // Remove payment step for sponsor/partner
    : steps;

  const extractQRCodeInfo = async (): Promise<QRCodeInfo[]> => {
    if (!qrCodesInput.trim()) return [];
    
    const qrCodes = qrCodesInput.split('\n').map(qr => qr.trim()).filter(qr => qr);
    

    
    setLoading(true);
    const qrInfo: QRCodeInfo[] = [];
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Timeout", 
        description: "Le traitement des codes QR a pris trop de temps. Veuillez réessayer.", 
        variant: "destructive"
      });
    }, 30000); // 30 seconds timeout
    
    try {
      // Get all plan IDs for validation
      const planIds = subscriptionItems.map(item => item.plan.id);
      
      for (const qrCode of qrCodes) {
        try {
          // Get the QR code information using getQRCodeInfo
          const response = await apiClient.getQRCodeInfo(qrCode);
          
          // Check if QR code is already assigned
          if (response.isAlreadyAssigned) {
            const errorMsg = response.existingAccessRight?.subscription?.user 
              ? `QR code déjà assigné à ${response.existingAccessRight.subscription.user.first_name} ${response.existingAccessRight.subscription.user.last_name}`
              : 'QR code déjà assigné à un abonnement existant';
            
            toast({ 
              title: "QR Code non disponible", 
              description: errorMsg, 
              variant: "destructive" 
            });
            setLoading(false);
            return [];
          }

          // Since QR codes are now validated during search, we can trust they belong to selected plans
          const qrCodeData = response;
          
          qrInfo.push({
            ...qrCodeData,
            seat_number: '' // Initialize empty seat number
          });
        } catch (error: any) {
          console.error('Error processing QR code:', qrCode, error);
          const errorMessage = error.message || 'Erreur inconnue';
          toast({ 
            title: "Erreur QR Code", 
            description: `QR Code ${qrCode}: ${errorMessage}`, 
            variant: "destructive" 
          });
          // Don't return here, continue with other QR codes
          continue;
        }
      }
      

      
      // Check if we have the right number of QR codes
      if (qrInfo.length !== qrCodes.length) {
        toast({ 
          title: "Attention", 
          description: `${qrInfo.length} sur ${qrCodes.length} codes QR ont été traités avec succès. Vérifiez les codes QR invalides.`, 
          variant: "default" 
        });
      }
      
      setQrCodesInfo(qrInfo);
      return qrInfo;
    } catch (error: any) {
      console.error('Error in extractQRCodeInfo:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement des codes QR", 
        variant: "destructive"
      });
      return [];
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (subscriptionItems.length === 0) {
        toast({ title: "Erreur", description: "Veuillez ajouter au moins un type d'abonnement", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate user selection for IDENTIFIED mode
      if (userMode === 'IDENTIFIED') {
        // Check if user is selected or customer info is filled
        const hasSelectedUser = selectedUser !== null;
        const hasCustomerInfo = customerInfo.first_name.trim() && 
                               customerInfo.last_name.trim() && 
                               customerInfo.email.trim();
        
        if (!hasSelectedUser && !hasCustomerInfo) {
          toast({ 
                    title: "Supporteur requis", 
        description: "Veuillez sélectionner un supporteur existant ou créer un nouveau supporteur", 
            variant: "destructive" 
          });
          return;
        }
        
        // If creating new user, validate all required fields
        if (!hasSelectedUser && hasCustomerInfo) {
          if (!customerInfo.first_name.trim() || 
              !customerInfo.last_name.trim() || 
              !customerInfo.email.trim()) {
            return false;
          }
          
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customerInfo.email)) {
            return false;
          }
        }
      }
      
      setStep(3);
    } else if (step === 3) {
      if (!qrCodesInput.trim()) {
        toast({ title: "Erreur", description: "Veuillez saisir les codes QR", variant: "destructive" });
        return;
      }

      console.log('Step 3 - Before extractQRCodeInfo');
      console.log('QR Codes Input:', qrCodesInput);
      console.log('Current qrCodesInfo length:', qrCodesInfo.length);

      // Extract QR code info and wait for completion
      const processedQRCodes = await extractQRCodeInfo();
      
      console.log('Step 3 - After extractQRCodeInfo');
      console.log('Processed QR codes:', processedQRCodes);
      console.log('Updated qrCodesInfo length:', qrCodesInfo.length);
      
      // Check if we have valid QR codes after extraction
      if (processedQRCodes && processedQRCodes.length > 0) {
        // Validate that we have enough QR codes for all subscription items
        const totalQRCodesNeeded = subscriptionItems.reduce((sum, item) => sum + item.quantity, 0);
        if (processedQRCodes.length < totalQRCodesNeeded) {
          toast({ 
            title: "QR codes insuffisants", 
            description: `Vous avez besoin de ${totalQRCodesNeeded} QR codes mais seulement ${processedQRCodes.length} sont valides`, 
            variant: "destructive" 
          });
          return;
        }
        
        // For sponsor/partner users, skip payment step and go directly to confirmation
        if (isSponsorPartner()) {
          setStep(5);
        } else {
          setStep(4);
        }
      } else {
        // If no QR codes were successfully processed, don't proceed
        toast({ 
          title: "Erreur", 
          description: "Aucun QR code valide n'a été traité. Veuillez vérifier vos codes QR.", 
          variant: "destructive" 
        });
        console.log('No valid QR codes processed, staying on step 3');
      }
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      // If going back to step 1, clear QR codes to avoid conflicts
      if (step - 1 === 1) {
        setQrCodesInfo([]);
        setQrCodesInput("");
      }
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      // Validate that we have QR codes
      if (!qrCodesInfo || qrCodesInfo.length === 0) {
        toast({ 
          title: "Erreur", 
          description: "Au moins un QR code doit être fourni", 
          variant: "destructive" 
        });
        setProcessing(false);
        return;
      }

      // Calculate total amount and prepare sale data for each subscription type
      const totalAmount = subscriptionItems.reduce((sum, item) => {
        const itemPrice = parseFloat(String(item.plan?.price || 0));
        return sum + (itemPrice * item.quantity);
      }, 0);

      // Group QR codes by their subscription plan and distribute them properly
      const qrCodesByPlan: { [planId: string]: QRCodeInfo[] } = {};
      
      // Initialize empty arrays for each plan
      subscriptionItems.forEach(item => {
        qrCodesByPlan[item.plan.id] = [];
      });
      
      // Group QR codes by their subscription plan
      for (const qrCode of qrCodesInfo) {
        // Find which plan this QR code belongs to
        for (const item of subscriptionItems) {
          try {
            // Try to validate this QR code against this plan
            const response = await apiClient.getQRCodeBySerialNumber(qrCode.serial_number, item.plan.id);
            if (response && response.qr_code === qrCode.qr_code) {
              qrCodesByPlan[item.plan.id].push(qrCode);
              break;
            }
          } catch (error: any) {
            // QR code doesn't belong to this plan, continue to next plan
            continue;
          }
        }
      }
      
      // Validate that we have enough QR codes for each plan
      for (const item of subscriptionItems) {
        const planQRCodes = qrCodesByPlan[item.plan.id];
        if (!planQRCodes || planQRCodes.length < item.quantity) {
          toast({ 
            title: "QR codes insuffisants", 
            description: `Plan ${item.plan.name}: vous avez besoin de ${item.quantity} QR codes mais seulement ${planQRCodes?.length || 0} sont disponibles pour ce plan`, 
            variant: "destructive" 
          });
          setProcessing(false);
          return;
        }
      }

      // Create separate sales for each subscription type
      for (const item of subscriptionItems) {
        // Get QR codes for this subscription item (only the ones that belong to this plan)
        const itemQRCodes = qrCodesByPlan[item.plan.id].slice(0, item.quantity);

        // Calculate amount - 0 for no-price users, otherwise use the plan price
        const itemPrice = parseFloat(String(item.plan?.price || 0));
        const isNoPriceUser = userMode === 'IDENTIFIED' && (
          (selectedUser && selectedUser.metadata?.isNoPriceUser) || 
          (customerInfo.noPrice)
        );
        const itemAmount = isNoPriceUser ? 0 : (itemPrice * item.quantity);

        const saleData = {
          planId: item.plan.id,
          quantity: item.quantity,
          qrCodes: itemQRCodes.map(qr => qr.qr_code),
          saleMode: userMode,
          saleChannel: 'PHYSICAL' as const,
          paymentMethod: paymentDetails.method,
          amount: itemAmount,
          currency: item.plan?.currency || 'TND',
          customerInfo: userMode === 'IDENTIFIED' ? (selectedUser ? {
            firstName: selectedUser.first_name || selectedUser.firstName,
            lastName: selectedUser.last_name || selectedUser.lastName,
            email: selectedUser.email,
            ...(selectedUser.phone && selectedUser.phone.trim() ? { phone: selectedUser.phone.trim() } : {}),
            ...(selectedUser.socios_number || selectedUser.fan_id ? { fanId: selectedUser.socios_number || selectedUser.fan_id } : {}),
            ...(selectedUser.css_mobile || selectedUser.cssMobile ? { cssMobile: selectedUser.css_mobile || selectedUser.cssMobile } : {}),
            // Include sponsor/partner information from selected user metadata or override
            ...((selectedUser.metadata?.isNoPriceUser || noPriceOverride || selectedUser.metadata?.sponsorType || sponsorTypeOverride) ? { noPrice: true } : {}),
            ...((selectedUser.metadata?.sponsorType || sponsorTypeOverride) ? { 
              sponsorType: selectedUser.metadata?.sponsorType || sponsorTypeOverride 
            } : {})
          } : {
            firstName: customerInfo.first_name,
            lastName: customerInfo.last_name,
            email: customerInfo.email,
            ...(customerInfo.phone && customerInfo.phone.trim() ? { phone: customerInfo.phone.trim() } : {}),
            ...(customerInfo.socios_number ? { fanId: customerInfo.socios_number } : {}),
            ...(customerInfo.css_mobile ? { cssMobile: customerInfo.css_mobile } : {}),
            // Include sponsor/partner information from form
            ...(customerInfo.noPrice ? { noPrice: true } : {}),
            ...(customerInfo.sponsorType ? { sponsorType: customerInfo.sponsorType } : {})
          }) : undefined,
          sellerId: session?.user?.id || 'unknown',
          sellerEmail: session?.user?.email || 'unknown',
          sellerName: session?.user?.name || 'unknown',
          paymentDetails: Object.keys(paymentDetails).length > 1 || paymentDetails.note?.trim() ? paymentDetails : undefined,
          note: paymentDetails.note && paymentDetails.note.trim() ? paymentDetails.note.trim() : undefined,
          metadata: {
            soldVia: 'admin_panel',
            createdBy: session?.user?.id || session?.user?.email || 'unknown',
            createdAt: new Date().toISOString(),
            timestamp: new Date().toISOString()
          }
        };

        console.log('Sending sale data to backend:', JSON.stringify(saleData, null, 2));
        console.log('Debug - customerInfo state:', customerInfo);
        console.log('Debug - selectedUser:', selectedUser);
        console.log('Debug - noPrice flag:', customerInfo.noPrice);
        console.log('Debug - sponsorType:', customerInfo.sponsorType);
        console.log('Debug - noPriceOverride:', noPriceOverride);
        console.log('Debug - sponsorTypeOverride:', sponsorTypeOverride);

        await apiClient.createDirectSale(saleData);
      }
      
      const totalQuantity = subscriptionItems.reduce((sum, item) => sum + item.quantity, 0);
      toast({
        title: "Vente réussie", 
        description: `${totalQuantity} abonnement(s) créé(s) avec succès`, 
        variant: "default"
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Sale error details:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la vente", 
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 bg-white overflow-hidden">
        <DialogHeader className="bg-white p-4 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-3 text-black">
            <ShoppingCart className="h-6 w-6" />
            Vente d'Abonnements
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
        {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Étape {step} sur {adjustedSteps.length}
                </h3>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {adjustedSteps[step - 1]?.title}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              {adjustedSteps.map((stepItem, index) => {
                const StepIcon = stepItem.icon;
                const isActive = step === stepItem.id;
                const isCompleted = step > stepItem.id;
                
                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      isActive 
                        ? "bg-black border-black text-white shadow-lg" 
                        : isCompleted 
                        ? "bg-gray-800 border-gray-800 text-white" 
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                </div>
                    {index < adjustedSteps.length - 1 && (
                      <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                        step > stepItem.id ? "bg-gray-800" : "bg-gray-200"
                  }`} />
                )}
              </div>
                );
              })}
          </div>
        </div>

        {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-500">Traitement des codes QR...</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLoading(false)}
                className="mt-2"
              >
                Annuler
              </Button>
          </div>
        )}

          {/* Step 1: Plan & Quantity */}
        {!loading && step === 1 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Crown className="h-6 w-6 text-blue-600" />
                  Sélectionner les types d'abonnement
                    </CardTitle>
                  </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Add Subscription Type */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Plus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">Ajouter un type d'abonnement</h4>
                        <p className="text-sm text-gray-600">
                          Sélectionnez un type d'abonnement pour l'ajouter à votre vente
                        </p>
                      </div>
                    </div>
                    
                    {subscriptionItems.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Crown className="h-4 w-4" />
                            <span>
                              <strong>{subscriptionItems.length}</strong> type(s) d'abonnement ajouté(s)
                        </span>
                      </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscriptionItems([])}
                            className="text-xs h-7 px-3 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            Tout effacer
                          </Button>
            </div>
          </div>
        )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Crown className="h-4 w-4 text-blue-600" />
                          Type d'abonnement
                        </Label>
                        <Select 
                          value={selectedPlanValue}
                          onValueChange={(value) => {
                            const selected = plans.find(p => p.id === value) || null;
                            if (selected) {
                              setSubscriptionItems(prev => [...prev, {
                                planId: selected.id,
                                plan: selected,
                                quantity: 1,
                                qrCodes: [],
                                qrCodesInfo: []
                              }]);
                              // Reset the select value so user can add more plans
                              setSelectedPlanValue("");
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white shadow-sm">
                            <SelectValue placeholder="Sélectionner un type d'abonnement" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {plans
                              .filter(plan => !subscriptionItems.some(item => item.planId === plan.id))
                              .map(p => (
                              <SelectItem key={p.id} value={p.id} className="py-3 cursor-pointer hover:bg-blue-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Crown className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{p.name}</div>
                                    <div className="text-sm text-gray-500">{p.description}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-blue-600">{p.price} {p.currency}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
            </div>
          </div>
                  </div>

                  {/* Selected Subscription Types */}
                  {subscriptionItems.length > 0 && (
          <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Crown className="h-4 w-4 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg">Types d'abonnement sélectionnés</h4>
                      </div>
                      {subscriptionItems.map((item, index) => (
                        <div key={index} className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                          {/* Light blue vertical accent bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                          
                          <div className="p-4 pl-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Crown className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-blue-900 text-lg">{item.plan.name}</h5>
                                  <p className="text-sm text-blue-700">{item.plan.name}</p>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-blue-600">
                                    <span>Prix: {item.plan.price} {item.plan.currency}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSubscriptionItems(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Quantity Control Section */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                                Quantité d'abonnements
                              </Label>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: Math.max(1, subItem.quantity - 1) } : subItem
                                    ));
                                  }}
                                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                                >
                                  <span className="text-lg font-bold">-</span>
                                </Button>
                                
                                <div className="flex-1 flex flex-col items-center gap-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1;
                                      const clampedValue = Math.max(1, Math.min(1000, value));
                                      setSubscriptionItems(prev => prev.map((subItem, i) => 
                                        i === index ? { ...subItem, quantity: clampedValue } : subItem
                                      ));
                                    }}
                                    className="w-16 h-10 text-center text-lg font-bold border-2 border-blue-200 focus:border-blue-500 bg-white shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <div className="text-xs text-gray-500">abonnement(s)</div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: Math.min(1000, subItem.quantity + 1) } : subItem
                                    ));
                                  }}
                                  className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                                >
                                  <span className="text-lg font-bold">+</span>
                                </Button>
                              </div>
                              
                              {/* Quick Quantity Buttons */}
                              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: 5 } : subItem
                                    ));
                                  }}
                                  className="text-xs px-3 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                >
                                  5
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: 10 } : subItem
                                    ));
                                  }}
                                  className="text-xs px-3 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                >
                                  10
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: 25 } : subItem
                                    ));
                                  }}
                                  className="text-xs px-3 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                >
                                  25
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: 50 } : subItem
                                    ));
                                  }}
                                  className="text-xs px-3 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                >
                                  50
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSubscriptionItems(prev => prev.map((subItem, i) => 
                                      i === index ? { ...subItem, quantity: 100 } : subItem
                                    ));
                                  }}
                                  className="text-xs px-3 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                >
                                  100
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Subtotal Display - Light purple bar */}
                          <div className="bg-purple-50 border-t border-purple-200 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-xs">€</span>
                              </div>
                              <div>
                                <div className="font-semibold text-purple-900 text-sm">
                                  {item.quantity} abonnement(s) × {item.plan.price} {item.plan.currency}
                                </div>
                                <div className="text-xs text-purple-700 font-bold">
                                  Total: {(parseFloat(String(item.plan?.price || 0)) * item.quantity).toFixed(2)} {item.plan.currency}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Summary */}
                  {subscriptionItems.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                      </div>
                        <div>
                          <h4 className="font-semibold text-purple-900 text-lg">Résumé total de la vente</h4>
                          <p className="text-sm text-purple-700">
                            Aperçu de tous les abonnements sélectionnés
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-white rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-gray-700">Types d'abonnement</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {subscriptionItems.length}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscriptionItems.length === 1 ? 'type sélectionné' : 'types sélectionnés'}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-gray-700">Total abonnements</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            abonnement(s) au total
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-sm">€</span>
                            </div>
                            <div>
                              <div className="font-semibold text-purple-900 text-lg">
                                Prix total de la vente
                              </div>
                              <div className="text-sm text-purple-700">
                                {subscriptionItems.length} type(s) × {subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)} abonnement(s)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-purple-900">
                              {subscriptionItems.reduce((sum, item) => sum + (parseFloat(String(item.plan?.price || 0)) * item.quantity), 0).toFixed(2)} TND
                            </div>
                            <div className="text-sm text-gray-500">
                              Montant total
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </CardContent>
                </Card>
          )}

          {/* Step 2: User Mode */}
          {!loading && step === 2 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                  Mode de vente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">
                      Choisissez le mode de vente
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          userMode === 'IDENTIFIED' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setUserMode('IDENTIFIED')}
                      >
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-6 w-6 text-blue-600" />
              <div>
                            <h4 className="font-semibold text-gray-900">Vente Identifiée</h4>
                            <p className="text-sm text-gray-600">Client avec informations complètes</p>
                </div>
              </div>
            </div>

                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          userMode === 'ANONYMOUS' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setUserMode('ANONYMOUS')}
                      >
                        <div className="flex items-center gap-3">
                          <UserX className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Vente Anonyme</h4>
                            <p className="text-sm text-gray-600">Client sans informations personnelles</p>
                          </div>
                        </div>
                      </div>
                    </div>
            </div>

                  {userMode === 'IDENTIFIED' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Informations client requises</h4>
                      
                      {/* Search Existing User */}
                      <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Rechercher un supporteur existant
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="text"
                              placeholder="Rechercher par nom, email ou numéro Socios..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                              className="pl-10"
                            />
                          </div>
            <Button 
                            size="sm"
                            onClick={handleUserSearch}
                            disabled={userSearchLoading || !searchTerm.trim()}
                            className="px-4"
                          >
                            {userSearchLoading ? <LoadingSpinner size="sm" /> : 'Rechercher'}
            </Button>
                          {(searchTerm || userSearchResults.length > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSearchTerm("");
                                setUserSearchResults([]);
                              }}
                              className="px-3"
                            >
                              Effacer
                            </Button>
                          )}
          </div>
                        {searchTerm && (
                          <p className="text-xs text-gray-500 mt-1">
                            Recherche en cours pour: {searchTerm}
                          </p>
                        )}
                      </div>
                      
                      {/* Search Results */}
                      {userSearchResults.length > 0 && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Utilisateurs trouvés ({userSearchResults.length})
                          </Label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {userSearchResults.map((user, index) => (
                              <div 
                                key={user.id} 
                                className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserSearchResults([]);
                                  setSearchTerm("");
                                  // Reset override values when selecting a user
                                  setNoPriceOverride(false);
                                  setSponsorTypeOverride('SPONSOR');
                                  
                                  // Automatically set payment method to NO_FEE if user is sponsor/partner
                                  if (user.metadata?.isNoPriceUser) {
                                    setPaymentDetails(prev => ({ ...prev, method: 'NO_FEE' }));
                                  }
                                  
                                  toast({ 
                                    title: "Utilisateur sélectionné", 
                                    description: `${user.first_name || user.firstName} ${user.last_name || user.lastName} a été sélectionné`, 
                                    variant: "default" 
                                  });
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {user.first_name || user.firstName} {user.last_name || user.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.email} • {user.phone}
                                    </div>
                                    {user.socios_number && (
                                      <div className="text-xs text-blue-600">
                                        Socios: {user.socios_number}
                                      </div>
                                    )}
                                    {/* Show sponsor/partner badge if user has no-price metadata */}
                                    {user.metadata?.isNoPriceUser && (
                                      <div className="mt-1">
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                          {user.metadata?.sponsorType === 'SPONSOR' ? 'Sponsor' : 'Partenaire'} - 0 frais
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    Sélectionner
              </Button>
            </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected User Indicator */}
                      {selectedUser && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-green-900">
                                Utilisateur sélectionné
                              </div>
                              <div className="text-sm text-green-700">
                                {selectedUser.first_name || selectedUser.firstName} {selectedUser.last_name || selectedUser.lastName} • {selectedUser.email}
                              </div>
                              {/* Show sponsor/partner badge if user has no-price metadata */}
                              {selectedUser.metadata?.isNoPriceUser && (
                                <div className="mt-1">
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                    {selectedUser.metadata?.sponsorType === 'SPONSOR' ? 'Sponsor' : 'Partenaire'} - 0 frais
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(null);
                                // Reset override values when deselecting a user
                                setNoPriceOverride(false);
                                setSponsorTypeOverride('SPONSOR');
                              }}
                              className="text-xs h-7 px-2"
                            >
                              Changer
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedUser ? (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">Utilisateur existant sélectionné</h4>
                              <p className="text-sm text-blue-700">
                                Les informations du client sont déjà enregistrées. Vous pouvez passer à l'étape suivante.
                              </p>
                            </div>
                          </div>
                          

                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Prénom</Label>
                            <Input
                              value={customerInfo.first_name}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="Prénom du client"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Nom</Label>
                            <Input
                              value={customerInfo.last_name}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="Nom du client"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Email</Label>
                            <Input
                              type="email"
                              value={customerInfo.email}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="email@exemple.com"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Téléphone (optionnel)</Label>
                            <Input
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Numéro de téléphone (optionnel)"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">CSS Mobile (optionnel)</Label>
                            <Input
                              value={customerInfo.css_mobile}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, css_mobile: e.target.value }))}
                              placeholder="CSS Mobile"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Numéro Socios (optionnel)</Label>
                            <Input
                              value={customerInfo.socios_number}
                              onChange={(e) => setCustomerInfo(prev => ({ ...prev, socios_number: e.target.value }))}
                              placeholder="123456789"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* No Price Section - Always visible */}
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <h4 className="text-sm font-semibold text-yellow-900">Utilisateur Sponsor/Partenaire</h4>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="noPrice"
                            checked={selectedUser 
                              ? (selectedUser.metadata?.isNoPriceUser || noPriceOverride)
                              : customerInfo.noPrice
                            }
                            onCheckedChange={(checked) => {
                              if (selectedUser) {
                                // For existing users, allow override
                                setNoPriceOverride(checked as boolean);
                                if (checked) {
                                  setSponsorTypeOverride('SPONSOR');
                                                                  // Automatically set payment method to NO_FEE for sponsor/partner
                                setPaymentDetails(prev => ({ ...prev, method: 'NO_FEE' }));
                                }
                              } else {
                                setCustomerInfo(prev => ({ 
                                  ...prev, 
                                  noPrice: checked as boolean,
                                  sponsorType: checked ? prev.sponsorType || 'SPONSOR' : undefined
                                }));
                                // Automatically set payment method to NO_FEE for sponsor/partner
                                if (checked) {
                                  setPaymentDetails(prev => ({ ...prev, method: 'NO_FEE' }));
                                }
                              }
                            }}
                          />
                          <Label 
                            htmlFor="noPrice" 
                            className="text-sm font-medium text-yellow-900 cursor-pointer"
                          >
                            Sponsor/Partenaire (0 frais)
                          </Label>
                          
                          {/* Show sponsor type selection for new users */}
                          {!selectedUser && customerInfo.noPrice && (
                            <div className="flex items-center space-x-2 ml-4">
                              <Label className="text-xs text-yellow-700">Type:</Label>
                              <Select
                                value={customerInfo.sponsorType || 'SPONSOR'}
                                onValueChange={(value: 'SPONSOR' | 'PARTNER') => 
                                  setCustomerInfo(prev => ({ ...prev, sponsorType: value }))
                                }
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SPONSOR">Sponsor</SelectItem>
                                  <SelectItem value="PARTNER">Partenaire</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {/* Show sponsor type selection for existing users with override */}
                          {selectedUser && (selectedUser.metadata?.isNoPriceUser || noPriceOverride) && (
                            <div className="flex items-center space-x-2 ml-4">
                              <Label className="text-xs text-yellow-700">Type:</Label>
                              <Select
                                value={selectedUser.metadata?.sponsorType || sponsorTypeOverride}
                                onValueChange={(value: 'SPONSOR' | 'PARTNER') => 
                                  setSponsorTypeOverride(value)
                                }
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SPONSOR">Sponsor</SelectItem>
                                  <SelectItem value="PARTNER">Partenaire</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-yellow-700 mt-2">
                          {selectedUser 
                            ? (selectedUser.metadata?.isNoPriceUser || noPriceOverride
                                ? 'Cet utilisateur sera traité comme sponsor/Partenaire pour cette vente'
                                : 'Cochez cette option pour traiter cet utilisateur comme sponsor/Partenaire (0 frais)')
                            : 'Cochez cette option pour les sponsors et partenaires (0 frais)'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anonymous mode info */}
          {userMode === 'ANONYMOUS' && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <UserX className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900">Vente anonyme</h4>
                  <p className="text-sm text-green-700">
                    Aucune information personnelle requise. Les abonnements seront créés avec des clés d'onboarding.
                  </p>
                </div>
              </div>
            </div>
          )}
                  
          {/* Validation message for step 2 */}
          {step === 2 && userMode === 'IDENTIFIED' && !isUserValid() && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm text-red-700">
                  {!selectedUser && !customerInfo.first_name.trim() && !customerInfo.last_name.trim() && !customerInfo.email.trim() ? (
                    "Veuillez sélectionner un supporteur existant ou remplir les informations du nouveau supporteur"
                  ) : (
                    "Veuillez remplir tous les champs requis (prénom, nom, email) avec un format d'email valide"
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: QR Codes */}
          {!loading && step === 3 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <QrCode className="h-6 w-6 text-purple-600" />
                  Scanner les codes QR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Selected Plans Summary */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Plans sélectionnés
                    </h4>
                    <div className="space-y-1">
                      {subscriptionItems.map((item) => (
                        <div key={item.plan.id} className="flex justify-between items-center text-sm">
                          <span className="text-blue-800">{item.plan.name}</span>
                          <span className="font-medium text-blue-900">
                            {item.quantity} × {parseFloat(String(item.plan?.price || 0)).toFixed(2)} TND
                          </span>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-blue-200 mt-2">
                        <div className="flex justify-between items-center font-semibold text-blue-900">
                          <span>Total QR codes requis:</span>
                          <span>{subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Codes QR des cartes physiques ({subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)} requis)
                    </Label>
                    
                    {/* Search by Serial Number */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Rechercher par numéro de série..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleQRCodeSearch()}
                          className="pl-10 pr-20"
                        />
                        <Button
                          size="sm"
                          onClick={handleQRCodeSearch}
                          disabled={loading || !searchTerm.trim() || subscriptionItems.every(item => 
                            qrCodesInfo.filter(qr => qr.planId === item.plan.id).length >= item.quantity
                          )}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3"
                        >
                          {loading ? <LoadingSpinner size="sm" /> : 'Rechercher'}
                        </Button>
                      </div>
                      {searchTerm && (
                        <p className="text-xs text-gray-500 mt-1">
                          Recherche en cours pour: {searchTerm}
                        </p>
                      )}
                    </div>
                    
                    <Textarea
                      value={qrCodesInput}
                      onChange={(e) => setQrCodesInput(e.target.value)}
                      placeholder="Saisissez ou scannez les codes QR (un par ligne)"
                      className="min-h-[120px]"
                      rows={5}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Saisissez {subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)} code(s) QR, un par ligne. Les informations seront automatiquement extraites.
                    </p>
                  </div>

                  {qrCodesInfo.length > 0 && (
                    <div className={`p-4 rounded-lg border ${
                      subscriptionItems.every(item => 
                        qrCodesInfo.filter(qr => qr.planId === item.plan.id).length >= item.quantity
                      )
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-purple-50 border-purple-200'
                    }`}>
                      <h4 className={`font-semibold mb-3 ${
                        subscriptionItems.every(item => 
                          qrCodesInfo.filter(qr => qr.planId === item.plan.id).length >= item.quantity
                        )
                          ? 'text-green-900'
                          : 'text-purple-900'
                      }`}>
                        Codes QR détectés ({qrCodesInfo.length}/{subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)})
                        {qrCodesInfo.length >= subscriptionItems.reduce((sum, item) => sum + item.quantity, 0) && (
                          <span className="ml-2 text-sm font-normal text-green-700">✓ Tous les plans complétés</span>
                        )}
                      </h4>
                      <div className="mb-3 p-2 bg-white rounded border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium mb-1">Plans sélectionnés:</div>
                        <div className="text-xs text-purple-600 space-y-1">
                          {subscriptionItems.map((item) => {
                            const qrCodesForPlan = qrCodesInfo.filter(qr => qr.planId === item.plan.id).length;
                            const isComplete = qrCodesForPlan >= item.quantity;
                            return (
                              <div key={item.plan.id} className={`flex justify-between items-center ${
                                isComplete ? 'text-green-700' : 'text-purple-600'
                              }`}>
                                <span>{item.plan.name}</span>
                                <span className={`font-medium ${
                                  isComplete ? 'text-green-800' : 'text-purple-700'
                                }`}>
                                  {qrCodesForPlan}/{item.quantity}
                                  {isComplete && <span className="ml-1">✓</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {qrCodesInfo.map((qr, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                            <QrCode className="h-4 w-4 text-purple-600" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                <span className="text-blue-600 font-semibold">#{qr.serial_number}</span> - {qr.qr_code}
                              </div>
                              <div className="text-xs text-gray-500">
                                Lot: {qr.card_batch || 'N/A'} | Type: {qr.card_type || 'STANDARD'}
                                {(qr.seat_number || qr.row_number || qr.zone_name) && (
                                  <span className="ml-2 text-blue-600">
                                    | 🪑 {qr.zone_name || 'Zone'} {qr.row_number ? `R${qr.row_number}` : ''} {qr.seat_number ? `S${qr.seat_number}` : ''} {qr.seat_code ? `(${qr.seat_code})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={qr.status === 'AVAILABLE' ? 'default' : 'destructive'}
                                className={qr.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              >
                                {qr.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setQrCodesInfo(prev => prev.filter((_, i) => i !== index));
                                  setQrCodesInput(prev => {
                                    const lines = prev.split('\n').filter(line => line.trim() !== qr.qr_code);
                                    return lines.join('\n');
                                  });
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Payment Method - Only show for non-sponsor/partner users */}
          {!loading && step === 4 && !isSponsorPartner() && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                  Méthode de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Special message for sponsor/partner users */}
                  {isSponsorPartner() && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-yellow-900">Utilisateur Sponsor/Partenaire détecté</h4>
                          <p className="text-sm text-yellow-700">
                            Le paiement a été automatiquement défini sur "Aucun frais" pour cet utilisateur sponsor/Partenaire.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">
                      Choisissez la méthode de paiement
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'CASH' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'CASH' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">€</span>
                </div>
                <div>
                            <h4 className="font-semibold text-gray-900">Espèces</h4>
                            <p className="text-sm text-gray-600">Paiement en espèces</p>
                  </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'CARD' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'CARD' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Carte bancaire</h4>
                            <p className="text-sm text-gray-600">Paiement par carte</p>
                </div>
              </div>
            </div>

                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'FLOUCI' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'FLOUCI' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-sm">F</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Flouci</h4>
                            <p className="text-sm text-gray-600">Paiement mobile</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'BANK_TRANSFER' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'BANK_TRANSFER' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">B</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Virement bancaire</h4>
                            <p className="text-sm text-gray-600">Transfert bancaire</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'SOCIOS' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'SOCIOS' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold text-sm">S</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Socios</h4>
                            <p className="text-sm text-gray-600">Paiement Socios</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'CHEQUE' 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'CHEQUE' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">C</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Chèque</h4>
                            <p className="text-sm text-gray-600">Paiement par chèque</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* NO_FEE option for sponsor/partner users */}
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentDetails.method === 'NO_FEE' 
                            ? 'border-yellow-500 bg-yellow-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setPaymentDetails(prev => ({ ...prev, method: 'NO_FEE' }))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Star className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Sponsor/Partenaire</h4>
                            <p className="text-sm text-gray-600">Aucun frais - 0 TND</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Specific Fields */}
                  {(paymentDetails.method === 'FLOUCI' || paymentDetails.method === 'BANK_TRANSFER') && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Détails de transaction</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Numéro de transaction {paymentDetails.method === 'FLOUCI' ? 'Flouci' : 'bancaire'}
                          </Label>
                          <Input 
                            value={paymentDetails.transactionNumber || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionNumber: e.target.value }))}
                            placeholder={paymentDetails.method === 'FLOUCI' ? 'TRX_FL_123456789' : 'TRX_BK_987654321'}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Note (optionnel)</Label>
                          <Textarea 
                            value={paymentDetails.note || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Détails supplémentaires sur la transaction..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentDetails.method === 'SOCIOS' && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-3">Détails Socios</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Note Socios</Label>
                          <Textarea 
                            value={paymentDetails.sociosNote || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, sociosNote: e.target.value }))}
                            placeholder="Détails de la transaction Socios..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        {userMode === 'ANONYMOUS' && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Numéro Socios</Label>
                            <Input 
                              value={paymentDetails.sociosNumber || ''}
                              onChange={(e) => setPaymentDetails(prev => ({ ...prev, sociosNumber: e.target.value }))}
                              placeholder="SOC_2025_001"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentDetails.method === 'NO_FEE' && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Sponsor/Partenaire - Aucun frais
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-yellow-100 rounded-lg">
                          <div className="text-3xl font-bold text-yellow-700">0 TND</div>
                          <div>
                            <p className="font-medium text-yellow-800">Abonnement gratuit</p>
                            <p className="text-sm text-yellow-700">Réservé aux sponsors et partenaires</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Note (optionnel)</Label>
                          <Textarea 
                            value={paymentDetails.note || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Détails sur le partenariat ou le sponsoring..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentDetails.method === 'CHEQUE' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3">Détails Chèque</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Numéro de chèque</Label>
                          <Input 
                            value={paymentDetails.checkNumber || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, checkNumber: e.target.value }))}
                            placeholder="CHQ_2025_001"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Note (optionnel)</Label>
                          <Textarea 
                            value={paymentDetails.note || ''}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Détails supplémentaires sur le chèque..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Note Field for Other Payment Methods */}
                  {(paymentDetails.method === 'CASH' || paymentDetails.method === 'CARD') && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Note de paiement</h4>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Note (optionnel)</Label>
                        <Textarea 
                          value={paymentDetails.note || ''}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, note: e.target.value }))}
                          placeholder="Détails supplémentaires sur le paiement..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h4 className="font-semibold text-indigo-900">Résumé du paiement</h4>
                        <p className="text-sm text-indigo-700">
                          Total à payer: {subscriptionItems.reduce((sum, item) => sum + (parseFloat(String(item.plan?.price || 0)) * item.quantity), 0).toFixed(2)} TND
                        </p>
                        <p className="text-sm text-indigo-600">
                          Méthode sélectionnée: {
                            paymentDetails.method === 'CASH' ? 'Espèces' :
                            paymentDetails.method === 'CARD' ? 'Carte bancaire' :
                            paymentDetails.method === 'FLOUCI' ? 'Flouci' :
                            paymentDetails.method === 'BANK_TRANSFER' ? 'Virement bancaire' :
                            paymentDetails.method === 'SOCIOS' ? 'Socios' :
                            paymentDetails.method === 'CHEQUE' ? 'Chèque' :
                            'Inconnue'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Summary */}
          {!loading && step === 5 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Résumé de la vente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Plan Summary */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Plan d'abonnement</h4>
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{subscriptionItems.map(item => item.plan.name).join(', ')}</div>
                        <div className="text-sm text-blue-700">
                          Prix total: {subscriptionItems.reduce((sum, item) => sum + (parseFloat(String(item.plan?.price || 0)) * item.quantity), 0).toFixed(2)} TND
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">Informations client</h4>
                    <div className="flex items-center gap-3">
                      {userMode === 'IDENTIFIED' ? (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <UserX className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <div className="font-medium">
                          {userMode === 'IDENTIFIED' ? 'Vente identifiée' : 'Vente anonyme'}
                        </div>
                        {userMode === 'IDENTIFIED' && (
                          <div className="text-sm text-green-700">
                            {selectedUser 
                              ? `${selectedUser.first_name || selectedUser.firstName} ${selectedUser.last_name || selectedUser.lastName} - ${selectedUser.email}`
                              : `${customerInfo.first_name} ${customerInfo.last_name} - ${customerInfo.email}`
                            }
                          </div>
                        )}
                        {/* Show sponsor/partner badge */}
                        {userMode === 'IDENTIFIED' && (customerInfo.noPrice || selectedUser?.metadata?.isNoPriceUser) && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              {customerInfo.sponsorType || selectedUser?.metadata?.sponsorType || 'SPONSOR'} - 0 frais
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* QR Codes Summary */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3">Codes QR ({qrCodesInfo.length})</h4>
                    <div className="mb-3 p-2 bg-white rounded border border-purple-200">
                      <div className="text-xs text-purple-700 font-medium mb-1">Plans sélectionnés:</div>
                      <div className="text-xs text-purple-600">
                        {subscriptionItems.map((item, idx) => (
                          <span key={item.plan.id}>
                            {item.plan.name} ({item.quantity})
                            {idx < subscriptionItems.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {qrCodesInfo.map((qr, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <QrCode className="h-4 w-4 text-purple-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              <span className="text-blue-600 font-semibold">#{qr.serial_number}</span> - {qr.qr_code}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Summary */}
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-3">Méthode de paiement</h4>
                    
                    {/* Special message for sponsor/partner users */}
                    {isSponsorPartner() && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800 font-medium">
                            Étape de paiement ignorée - Utilisateur Sponsor/Partenaire (0 frais)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <div>
                        <div className="font-medium">
                          {paymentDetails.method === 'CASH' ? 'Espèces' :
                           paymentDetails.method === 'CARD' ? 'Carte bancaire' :
                           paymentDetails.method === 'FLOUCI' ? 'Flouci' :
                           paymentDetails.method === 'BANK_TRANSFER' ? 'Virement bancaire' :
                           paymentDetails.method === 'SOCIOS' ? 'Socios' :
                           paymentDetails.method === 'CHEQUE' ? 'Chèque' :
                           paymentDetails.method === 'NO_FEE' ? 'Aucun frais' :
                           'Inconnue'}
                        </div>
                        <div className="text-sm text-indigo-700">
                          Paiement sécurisé et tracé
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Résumé total</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                        <span className="font-medium">{subscriptionItems.map(item => item.plan.name).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantité:</span>
                        <span className="font-medium">{subscriptionItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                        <span className="font-medium">{userMode === 'IDENTIFIED' ? 'Identifié' : 'Anonyme'}</span>
                  </div>
                  <div className="flex justify-between">
                        <span>Codes QR:</span>
                        <span className="font-medium">{qrCodesInfo.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Paiement:</span>
                        <span className="font-medium">
                          {paymentDetails.method === 'CASH' ? 'Espèces' :
                           paymentDetails.method === 'CARD' ? 'Carte bancaire' :
                           paymentDetails.method === 'FLOUCI' ? 'Flouci' :
                           paymentDetails.method === 'BANK_TRANSFER' ? 'Virement bancaire' :
                           paymentDetails.method === 'SOCIOS' ? 'Socios' :
                           paymentDetails.method === 'CHEQUE' ? 'Chèque' :
                           paymentDetails.method === 'NO_FEE' ? 'Aucun frais' :
                           'Inconnue'}
                        </span>
                  </div>
                  
                  {/* Show sponsor/partner information */}
                  {isSponsorPartner() && (
                    <div className="flex justify-between">
                      <span>Type client:</span>
                      <span className="font-medium text-yellow-700">
                        {customerInfo.sponsorType || selectedUser?.metadata?.sponsorType || sponsorTypeOverride || 'SPONSOR'} (0 frais)
                      </span>
                    </div>
                  )}
                  
                      <Separator className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                        <span className={isSponsorPartner() ? 'text-yellow-700' : ''}>
                          {isSponsorPartner() 
                            ? '0.00 TND (Sponsor/Partenaire)'
                            : `${subscriptionItems.reduce((sum, item) => sum + (parseFloat(String(item.plan?.price || 0)) * item.quantity), 0).toFixed(2)} TND`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between sticky bottom-0 bg-white pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Précédent
              </Button>
            
            <div className="flex gap-2">
              {step < adjustedSteps.length ? (
                <Button
                  onClick={handleNext}
                  disabled={loading || (step === 2 && !isUserValid())}
                  className="flex items-center gap-2"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4" />
              </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={processing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirmer la vente
                    </>
                  )}
              </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 