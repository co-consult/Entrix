"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, User, CreditCard, Package, Receipt } from "lucide-react"
import { OrderStatusBadge } from "./OrderStatusBadge"
import type { Order } from "@/types"

interface OrderDetailsModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const PURCHASE_CHANNEL = {
  WEB: "Web",
  MOBILE: "Mobile",
  POS: "Point de vente",
  API: "API",
  ADMIN: "Administration"
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!order) return null

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Détails de la commande #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-base mt-1 mb-4">
            Commande passée le {formatDate(order.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de commande</label>
                  <p className="text-sm text-gray-900">#{order.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de création</label>
                  <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Canal d'achat</label>
                  <p className="text-sm text-gray-900">
                    {PURCHASE_CHANNEL[order.purchase_channel as keyof typeof PURCHASE_CHANNEL] || order.purchase_channel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="text-sm text-gray-900">
                    {order.user?.first_name && order.user?.last_name 
                      ? `${order.user.first_name} ${order.user.last_name}`
                      : order.guest_name || "N/A"
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{order.user?.email || order.guest_email || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="text-sm text-gray-900">{order.user?.phone || order.guest_phone || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de client</label>
                  <p className="text-sm text-gray-900">{order.user ? "Utilisateur enregistré" : "Invité"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b py-3 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.ticket_type?.name || item.item_name}</div>
                      <div className="text-sm text-gray-500">
                        Quantité: {item.quantity} × {formatCurrency(item.unit_price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(item.total_price)}</div>
                      {item.discount_amount > 0 && (
                        <div className="text-sm text-green-600">
                          Réduction: -{formatCurrency(item.discount_amount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatCurrency(order.subtotal_amount || 0)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de traitement</span>
                  <span>{formatCurrency(order.processing_fee || 0)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informations de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
                          <p className="text-sm text-gray-900">{payment.payment_method?.name || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Montant</label>
                          <p className="text-sm text-gray-900">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Statut</label>
                          <div className="mt-1">
                            <OrderStatusBadge status={payment.status} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
                          <p className="text-sm text-gray-900">
                            {payment.payment_date ? formatDate(payment.payment_date) : "N/A"}
                          </p>
                        </div>
                        {payment.transaction_id && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">ID de transaction</label>
                            <p className="text-sm text-gray-900 font-mono">{payment.transaction_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
