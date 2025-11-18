"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { 
  Crown, 
  Calendar,
  Users,
  Banknote,
  Star,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface SubscriptionPlanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizerId?: string;
}

interface Plan {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: string;
  price: number;
  currency: string;
  isActive: boolean;
  isCurrentlyOnSale: boolean;
  maxSubscribers?: number;
  currentSubscribers: number;
  activeSubscriptions: number;
  availableSlots?: number;
  validFrom: string;
  validUntil: string;
  saleStartDate?: string;
  saleEndDate?: string;
  transferable: boolean;
  maxTransfers: number;
  autoRenew: boolean;
  includesPlayoffs: boolean;
  priorityBooking: boolean;
  benefits?: string[];
  restrictions?: string[];
  organizer?: {
    id: string;
    name: string;
    code: string;
    contactEmail: string;
  };
}

export default function SubscriptionPlanManagementModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizerId 
}: SubscriptionPlanManagementModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    console.log('SubscriptionPlanManagementModal useEffect:', { isOpen, organizerId });
    if (isOpen && organizerId) {
      loadPlans();
    }
  }, [isOpen, organizerId]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      console.log('Loading plans for organizer:', organizerId);
      const response = await subscriptionsApi.getAllPlansByOrganizer(organizerId!);
      console.log('Plans response:', response);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les plans d'abonnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (plan: Plan) => {
    if (!plan.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactif</Badge>;
    }
    if (plan.isCurrentlyOnSale) {
      return <Badge className="bg-green-100 text-green-800">En vente</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 bg-white flex flex-col">
        <DialogHeader className="bg-white p-6 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-black">
            <Crown className="h-6 w-6" />
            Gestion des types d'abonnement
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Types d'Abonnements</h2>
              <p className="text-gray-600 mt-1">Consultez les types d'abonnements disponibles</p>
            </div>
          </div>

          {/* Plans List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun type d'abonnement</h3>
              <p className="text-gray-600">Aucun type d'abonnement n'a été trouvé pour cet organisateur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Crown className="h-5 w-5 text-blue-600" />
                          {plan.name}
                        </CardTitle>
                        {plan.code && (
                          <p className="text-sm text-gray-500 font-mono">{plan.code}</p>
                        )}
                      </div>
                      {getStatusBadge(plan)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Banknote className="h-4 w-4" />
                        <span className="font-semibold">{plan.price} TND</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>{plan.activeSubscriptions}/{plan.maxSubscribers || '∞'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span className="line-clamp-1">Valide du {new Date(plan.validFrom).toLocaleDateString('fr-FR')} au {new Date(plan.validUntil).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 