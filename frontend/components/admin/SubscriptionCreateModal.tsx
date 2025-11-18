import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { eventsApi } from "@/lib/api/events";
import { usersApi } from '@/lib/api/users';
import { apiClient } from '@/lib/api-client';
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
  EyeOff
} from "lucide-react";
import UserSearchModal from "@/components/admin/UserSearchModal";

interface UserType {
  id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
interface Plan {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_days?: number;
}
interface Event {
  id: string;
  name: string;
}
interface SubscriptionInput {
  qr_code: string;
  event: Event | null;
}
interface Result {
  subscription?: SubscriptionInput;
  accessRight?: { qr_code: string };
  error?: string;
  success: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}


export default function SubscriptionCreateModal({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState<number>(1);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [qrCodes, setQrCodes] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<SubscriptionInput[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserCIN, setNewUserCIN] = useState("");
  const [newUserPassport, setNewUserPassport] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserError, setNewUserError] = useState("");
  const { toast } = useToast();
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserIdType, setNewUserIdType] = useState<'IDENTITY_CARD' | 'PASSPORT' | 'DRIVING_LICENSE' | ''>('');
  const [newUserIdNumber, setNewUserIdNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    async function loadData() {
      setLoading(true);
      try {
        const plansRes = await subscriptionsApi.getSubscriptionPlans();
        setPlans(plansRes?.data || []);
        const eventsRes = await eventsApi.getEvents(1, 100);
        setEvents(eventsRes.data || []);
      } catch (e) {
        toast({ title: "Error loading data", description: (e as any).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // Reset state on open
    setStep(1);
    setPlan(null);
    setQuantity(1);
    setSelectedUser(null);
    setQrCodes("");
    setSubscriptions([]);
    setResult([]);
    setShowCreateUser(false);
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserPhone("");
    setNewUserIdType('');
    setNewUserIdNumber("");
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    const results: Result[] = [];
    for (const sub of subscriptions) {
      try {
        const res = await subscriptionsApi.createAdminSubscription({
          user_id: selectedUser!.id,
          subscription_plan_id: plan!.id,
          qr_code: sub.qr_code,
        });
        results.push({ ...res, success: true });
        toast({
          title: "Subscription Created",
          description: `User ${selectedUser!.name} with QR ${sub.qr_code}`,
          variant: "default",
        });
      } catch (err: any) {
        // User-friendly error for duplicate QR code
        const msg = err?.response?.data?.message || err?.message || "";
        let userMessage = msg;
        if (msg.includes("already exists and must be unique")) {
          userMessage = "Ce QR code est déjà utilisé. Veuillez en saisir un autre.";
        }
        results.push({ error: userMessage, ...sub, success: false });
        toast({
          title: "Erreur lors de la création de l'abonnement",
          description: userMessage,
          variant: "destructive",
        });
      }
    }
    setResult(results);
    setLoading(false);
    setStep(5); // Show result step
    if (onCreated) onCreated();
  };

  const handleUserSelect = (user: any) => {
    console.log('handleUserSelect called with user:', user);
    const userData = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    console.log('Setting selectedUser to:', userData);
    setSelectedUser(userData);
    console.log('User selected in subscription modal:', userData);
  };

  // Check QR code uniqueness via backend
  const checkQrCodeUnique = async (qr_code: string) => {
    try {
      const response = await apiClient.get(`/access-control/qr-exists`, { params: { qr_code } });
      return !response.data.exists;
    } catch {
      // If the check fails, assume not unique to be safe
      return false;
    }
  };

  const generateQrCodes = async () => {
    const codes = qrCodes.split('\n').filter(code => code.trim() !== '');
    if (codes.length !== quantity) {
      toast({
        title: "Erreur",
        description: `Vous devez entrer exactement ${quantity} codes QR (un par ligne)` ,
        variant: "destructive"
      });
      return;
    }
    // Check for duplicates in the input
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      toast({
        title: "Erreur",
        description: "Les codes QR doivent être uniques",
        variant: "destructive"
      });
      return;
    }
    // Check for duplicates in the database
    for (const code of codes) {
      const isUnique = await checkQrCodeUnique(code.trim());
      if (!isUnique) {
        toast({
          title: "Erreur",
          description: `Le code QR "${code}" est déjà utilisé. Veuillez en saisir un autre.`,
          variant: "destructive"
        });
        return;
      }
    }
    const newSubscriptions = codes.map(code => ({
      qr_code: code.trim(),
      event: null
    }));
    setSubscriptions(newSubscriptions);
    setStep(4); // Go to confirmation step
  };

  // Helper function to get plan coverage details
  const getPlanCoverage = () => {
    if (!plan) return null;
    
    // Cast to any to access the actual backend response structure
    const planData = plan as any;
    const eventGroups = planData.event_groups || [];
    const events = planData.events || [];
    
    // Debug logging
    console.log('Plan data:', planData);
    console.log('Event groups:', eventGroups);
    console.log('Events:', events);
    
    // Handle different possible structures
    const processedEventGroups = eventGroups.map((eg: any) => {
      if (eg.event_group) {
        return eg.event_group;
      } else if (eg.name) {
        return eg; // Direct group object
      } else {
        return { id: eg.id || 'unknown', name: 'Unknown Group' };
      }
    });
    
    const processedEvents = events.map((e: any) => {
      if (e.event) {
        return e.event;
      } else if (e.name) {
        return e; // Direct event object
      } else {
        return { id: e.id || 'unknown', name: 'Unknown Event' };
      }
    });
    
    return {
      eventGroups: processedEventGroups,
      events: processedEvents,
      totalEvents: events.length,
      totalGroups: eventGroups.length
    };
  };

  const planCoverage = getPlanCoverage();
  const allValid = selectedUser && qrCodes.trim() !== "" && subscriptions.length === quantity;

  const steps = [
    { id: 1, title: "Plan", icon: Crown },
    { id: 2, title: "Supporter", icon: User },
    { id: 3, title: "Codes QR", icon: QrCode },
    { id: 4, title: "Confirmation", icon: CheckCircle },
    { id: 5, title: "Résultat", icon: Star }
  ];

  // AJOUTER la fonction de création d'utilisateur inline
  const handleCreateUserInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserLoading(true);
    setNewUserError("");
    try {
      const response = await usersApi.createUser({
        first_name: newUserFirstName,
        last_name: newUserLastName,
        email: newUserEmail,
        password: newUserPassword,
        is_active: true,
        phone: newUserPhone,
        profile: {
          id_type: newUserIdType || undefined,
          id_number: newUserIdNumber || undefined,
        }
      } as any);
      const user = response.data || response;
      setSelectedUser({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      });
      setShowCreateUser(false);
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserPhone("");
      setNewUserIdType('');
      setNewUserIdNumber("");
      toast({ title: "Supporter créé", description: `Le supporter ${user.first_name} ${user.last_name} a été créé et sélectionné.`, variant: "default" });
    } catch (err: any) {
      setNewUserError(err.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setNewUserLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-white">
        <DialogHeader className="bg-white p-6 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-black">
            <Crown className="h-6 w-6" />
            Créer un abonnement
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Étape {step} sur 5
                </h3>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {steps[step - 1]?.title}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              {steps.map((stepItem, index) => {
                const StepIcon = stepItem.icon;
                const isActive = step === stepItem.id;
                const isCompleted = step > stepItem.id;
                
                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isActive 
                        ? "bg-black border-black text-white shadow-lg" 
                        : isCompleted 
                        ? "bg-gray-800 border-gray-800 text-white" 
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
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
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {!loading && step === 1 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Crown className="h-6 w-6 text-blue-600" />
                  Sélectionner un type d'abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="plan-select" className="text-sm font-medium text-gray-700 mb-2 block">
                      Type d'abonnement
                    </Label>
                    <Select value={plan?.id || ""} onValueChange={(value) => {
                      const selected = plans.find(p => p.id === value) || null;
                      setPlan(selected);
                    }}>
                      <SelectTrigger className="w-full h-12 text-left">
                        <SelectValue placeholder="Sélectionner un type d'abonnement" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.id} className="py-3">
                            <div className="flex items-center gap-3">
                              <Crown className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {plan && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Crown className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-blue-900">{plan.name}</h4>
                          <p className="text-sm text-blue-700">{plan.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                            <span>Prix: {plan.price} {plan.currency}</span>
                            <span>Durée: {plan.duration_days || 365} jours</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Quantity Selector */}
                  {plan && (
                    <div className="mt-6">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Nombre d'abonnements à créer
                      </Label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-12 h-12"
                        >
                          -
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-3xl font-bold text-gray-900">{quantity}</span>
                          <div className="text-sm text-gray-500">abonnement(s)</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-12 h-12"
                        >
                          +
                        </Button>
                      </div>
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="font-semibold text-purple-900">
                              {quantity} abonnement(s) pour le type "{plan?.name}" 
                              ({plan?.price} {plan?.currency} chacun)
                            </h4>
                            <p className="text-sm text-purple-700">
                              Total: {(parseFloat(String(plan?.price || 0)) * quantity).toFixed(2)} {plan?.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8 flex justify-end">
                  <Button 
                    disabled={!plan} 
                    onClick={() => setStep(2)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!loading && step === 2 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                  Sélectionner le supporter
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Supporter pour tous les abonnements
                    </Label>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUserModal(true)}
                      className="w-full justify-start h-12 border-dashed border-2 hover:border-solid"
                    >
                      {selectedUser ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</div>
                            <div className="text-sm text-gray-500">{selectedUser.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-500">Sélectionner un supporter</span>
                        </div>
                      )}
                    </Button>
                    <div className="mt-2 flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => setShowCreateUser(v => !v)}>
                        <Plus className="h-4 w-4 mr-1" /> Créer un nouveau supporter
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const anonUser = await usersApi.getUserByEmail('anonymous@system.local');
                          setSelectedUser({
                            id: anonUser?.id || '',
                            name: 'Supporter anonyme',
                            first_name: 'Supporter',
                            last_name: 'Anonyme',
                            email: 'anonymous@system.local',
                            is_active: true,
                            created_at: '',
                            updated_at: ''
                          });
                        }}
                      >
                        Supporter anonyme
                      </Button>
                    </div>
                  </div>
                  {showCreateUser && (
                    <form onSubmit={handleCreateUserInline} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prénom</Label>
                          <Input type="text" required value={newUserFirstName} onChange={e => setNewUserFirstName(e.target.value)} placeholder="Prénom" />
                        </div>
                        <div>
                          <Label>Nom</Label>
                          <Input type="text" required value={newUserLastName} onChange={e => setNewUserLastName(e.target.value)} placeholder="Nom" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type de pièce d'identité</Label>
                          <select value={newUserIdType} onChange={e => setNewUserIdType(e.target.value as any)} className="w-full border rounded px-3 py-2">
                            <option value="">Choisir...</option>
                            <option value="IDENTITY_CARD">CIN</option>
                            <option value="PASSPORT">Passeport</option>
                            <option value="DRIVING_LICENSE">Permis de conduire</option>
                          </select>
                        </div>
                        <div>
                          <Label>Numéro {newUserIdType === 'PASSPORT' ? 'de passeport' : newUserIdType === 'IDENTITY_CARD' ? 'de CIN' : newUserIdType === 'DRIVING_LICENSE' ? 'de permis de conduire' : ''}</Label>
                          <Input type="text" value={newUserIdNumber} onChange={e => setNewUserIdNumber(e.target.value)} placeholder={newUserIdType === 'PASSPORT' ? 'Numéro de passeport' : newUserIdType === 'IDENTITY_CARD' ? 'Numéro de CIN' : newUserIdType === 'DRIVING_LICENSE' ? 'Numéro de permis de conduire' : ''} disabled={!newUserIdType} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Numéro de portable</Label>
                          <Input type="text" value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} placeholder="Numéro de portable" />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" />
                      </div>
                      <div>
                        <Label>Mot de passe</Label>
                        <div className="relative">
                          <Input 
                            type={showNewUserPassword ? "text" : "password"}
                            required 
                            value={newUserPassword} 
                            onChange={e => setNewUserPassword(e.target.value)} 
                            placeholder="Mot de passe" 
                            className="pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewUserPassword(v => !v)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                            tabIndex={-1}
                            aria-label={showNewUserPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {newUserError && <div className="text-red-600 text-sm">{newUserError}</div>}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)} disabled={newUserLoading}>Annuler</Button>
                        <Button type="submit" disabled={newUserLoading}>
                          {newUserLoading ? 'Création...' : 'Créer'}
                        </Button>
                      </div>
                    </form>
                  )}
                  
                  {selectedUser && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-green-900">
                            {selectedUser?.email === 'anonymous@system.local' ? 'Supporter Anonyme' : `${selectedUser.first_name} ${selectedUser.last_name}`}
                          </h4>
                          <p className="text-sm text-green-700">
                            Supporter sélectionné pour {quantity} abonnement(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {showUserModal && (
                    <UserSearchModal
                      open={showUserModal}
                      onOpenChange={setShowUserModal}
                      onSelect={handleUserSelect}
                      selectedUser={selectedUser}
                    />
                  )}
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button 
                    disabled={!selectedUser} 
                    onClick={() => setStep(3)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!loading && step === 3 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <QrCode className="h-6 w-6 text-purple-600" />
                  Entrer les codes QR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="qr-codes" className="text-sm font-medium text-gray-700 mb-2 block">
                      Codes QR ({quantity} codes requis)
                    </Label>
                    <div className="space-y-2">
                      <textarea
                        id="qr-codes"
                        value={qrCodes}
                        onChange={(e) => setQrCodes(e.target.value)}
                        placeholder={`Entrez ${quantity} codes QR, un par ligne:
QR001
QR002
QR003
...`}
                        className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows={6}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Un code par ligne</span>
                        <span>{qrCodes.split('\n').filter(code => code.trim() !== '').length} / {quantity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Codes QR</h4>
                        <p className="text-sm text-purple-700">
                          Entrez exactement {quantity} codes QR uniques, un par ligne. 
                          Chaque code sera associé à un abonnement pour {selectedUser?.first_name} {selectedUser?.last_name}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button 
                    disabled={!qrCodes.trim()} 
                    onClick={generateQrCodes}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                  >
                    Générer les abonnements
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!loading && step === 4 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                  Révision et confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Résumé de la création</h4>
                    <table className="min-w-full text-sm border rounded bg-white">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="font-semibold px-4 py-2 text-left">Plan sélectionné</th>
                          <th className="font-semibold px-4 py-2 text-left">Supporter</th>
                          <th className="font-semibold px-4 py-2 text-left">Nombre d'abonnements</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2">{plan?.name}</td>
                          <td className="px-4 py-2">{selectedUser?.first_name} {selectedUser?.last_name}</td>
                          <td className="px-4 py-2">{subscriptions.length}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Codes QR à créer:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {subscriptions.map((sub, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              #{idx + 1}
                            </Badge>
                            <span className="font-mono text-sm">{sub.qr_code}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(3)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button 
                    disabled={loading} 
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Créer les abonnements
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!loading && step === 5 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Star className="h-6 w-6 text-green-600" />
                  Résultats de la création
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {result.map((res, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      res.success 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        {res.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          {res.success ? (
                            <div className="text-green-800">
                              <div className="font-medium">
                                Succès: Code QR {res.accessRight?.qr_code}
                              </div>
                              <div className="text-sm">
                                Supporter: {selectedUser?.first_name} {selectedUser?.last_name}
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-800">
                              <div className="font-medium">Erreur lors de la création</div>
                              <div className="text-sm">{res.error}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </Button>
                  <Button 
                    onClick={() => {
                      setStep(1);
                      setPlan(null);
                      setQuantity(1);
                      setSelectedUser(null);
                      setQrCodes("");
                      setSubscriptions([]);
                      setResult([]);
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un autre
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* SUPPRIMER <UserSearchModal ... /> */}
      </DialogContent>
    </Dialog>
  );
}