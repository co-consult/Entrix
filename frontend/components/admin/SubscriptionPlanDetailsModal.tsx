"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown, 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Clock,
  Eye
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import type { SubscriptionPlan } from "@/types";

interface SubscriptionPlanDetailsModalProps {
  plan: SubscriptionPlan;
  onClose: () => void;
}

export default function SubscriptionPlanDetailsModal({
  plan,
  onClose
}: SubscriptionPlanDetailsModalProps) {
  const formatPrice = (price: number, currency: string = "EUR") => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (!plan.isActive) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    if (plan.isCurrentlyOnSale) {
      return <Badge variant="default">En vente</Badge>;
    }
    return <Badge variant="outline">Actif</Badge>;
  };

  const getAvailabilityStatus = () => {
    if (!plan.maxSubscribers) {
      return <span className="text-green-600">Illimité</span>;
    }
    
    const available = plan.maxSubscribers - (plan.activeSubscriptions || 0);
    if (available <= 0) {
      return <span className="text-red-600">Complet</span>;
    }
    return <span className="text-blue-600">{available} places disponibles</span>;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Détails du Plan: {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge()}
                    {plan.code && <Badge variant="outline">{plan.code}</Badge>}
                    <Badge variant="secondary">{plan.type}</Badge>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  <div className="text-sm text-gray-500">par abonnement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Abonnés Actifs</p>
                    <p className="text-2xl font-bold">{plan.activeSubscriptions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disponibilité</p>
                    <p className="text-lg font-bold">{getAvailabilityStatus()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CustomCurrencyIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-2xl font-bold">
                      {formatPrice((plan.price || 0) * (plan.activeSubscriptions || 0), plan.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Organisateur:</span>
                    <p>{plan.organizer?.name || "Non spécifié"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Type:</span>
                    <p>{plan.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Prix:</span>
                    <p>{formatPrice(plan.price, plan.currency)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Limite d'abonnés:</span>
                    <p>{plan.maxSubscribers ? `${plan.maxSubscribers} places` : "Illimité"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Fonctionnalités:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.transferable && <Badge variant="outline">Transférable</Badge>}
                    {plan.autoRenew && <Badge variant="outline">Renouvellement Auto</Badge>}
                    {plan.includesPlayoffs && <Badge variant="outline">Inclut Playoffs</Badge>}
                    {plan.priorityBooking && <Badge variant="outline">Réservation Prioritaire</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Périodes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {plan.validFrom && (
                    <div>
                      <span className="font-medium text-gray-600">Validité:</span>
                      <p>{formatDate(plan.validFrom)} - {plan.validUntil ? formatDate(plan.validUntil) : "Indéfinie"}</p>
                    </div>
                  )}
                  
                  {plan.saleStartDate && (
                    <div>
                      <span className="font-medium text-gray-600">Vente:</span>
                      <p>{formatDate(plan.saleStartDate)} - {plan.saleEndDate ? formatDate(plan.saleEndDate) : "Indéfinie"}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-gray-600">Créé le:</span>
                    <p>{formatDateTime(plan.createdAt)}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Dernière modification:</span>
                    <p>{formatDateTime(plan.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zones */}
          {plan.zones && plan.zones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zones Incluses ({plan.zones.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.zones.map((zone) => (
                    <div key={zone.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{zone.name}</h4>
                        <Badge variant="outline">{zone.code}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Capacité: {zone.capacity || "Non spécifiée"}</p>
                        <p>Type: {zone.zoneType}</p>
                        {zone.category && <p>Catégorie: {zone.category}</p>}
                        {zone.hasSeats && (
                          <p>Places disponibles: {zone.availableSeatsCount}</p>
                        )}
                        {zone.priceOverride && (
                          <p className="font-medium text-green-600">
                            Prix spécial: {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(zone.priceOverride)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events */}
          {plan.includedEvents && plan.includedEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Événements Inclus ({plan.includedEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.includedEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(event.scheduledStart)} - {formatDateTime(event.scheduledEnd)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        {event.isPriority && <Badge variant="outline">Prioritaire</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {plan.benefits && plan.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Avantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Restrictions */}
          {plan.restrictions && plan.restrictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.restrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 