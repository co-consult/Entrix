"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ShoppingCart, Calendar, CreditCard, Download, Eye, RefreshCw, Ticket, Receipt } from "lucide-react"
import apiClient from "@/lib/api"
import type { Order } from "@/types"

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const orders = await apiClient.getOrders({
        user_id: session?.user?.id,
        search: searchTerm,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      })
      setOrders(Array.isArray(orders) ? orders : [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Terminée"
      case "CONFIRMED":
        return "Confirmée"
      case "PENDING":
        return "En attente"
      case "CANCELLED":
        return "Annulée"
      default:
        return status
    }
  }

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `facture-${orderId}.pdf`
      a.click()
    } catch (error) {
      console.error("Error downloading invoice:", error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar type="user" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader
              title="Mes Commandes"
              description="Consultez l'historique de vos achats et téléchargez vos factures"
            >
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </PageHeader>

            <div className="mt-6">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">Commande #{order.order_number}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-2">Articles commandés</h4>
                            <div className="space-y-2">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-medium">{item.ticket_type?.name}</span>
                                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                  </div>
                                  <span className="font-medium">{item.total_price} DT</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Order Summary */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Sous-total</span>
                              <span>{order.subtotal_amount} DT</span>
                            </div>
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Réduction</span>
                                <span>-{order.discount_amount} DT</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Frais de service</span>
                              <span>{order.processing_fee} DT</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium text-base">
                              <span>Total</span>
                              <span>{order.total_amount} DT</span>
                            </div>
                          </div>

                          {/* Payment Info */}
                          {order.payments && order.payments.length > 0 && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="flex items-center text-sm">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>
                                  Payé le {new Date(order.payments[0].payment_date || "").toLocaleDateString("fr-FR")}{" "}
                                  via {order.payments[0].payment_method?.name}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <ShoppingCart className="h-6 w-6 text-primary" />
                                    Détails de la commande #{order.order_number}
                                  </DialogTitle>
                                  <DialogDescription className="text-base mt-1 mb-4">
                                    Commande passée le {new Date(order.created_at).toLocaleDateString("fr-FR")}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Section: Articles */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Ticket className="h-5 w-5 text-blue-600" />
                                      <span className="font-semibold text-lg">Articles commandés</span>
                                    </div>
                                    <div className="space-y-2">
                                      {order.items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm border-b py-2 last:border-b-0">
                                          <div>
                                            <span className="font-medium">{item.ticket_type?.name}</span>
                                            <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                          </div>
                                          <span className="font-medium">{item.total_price} DT</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Section: Récapitulatif */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Receipt className="h-5 w-5 text-green-600" />
                                      <span className="font-semibold text-lg">Récapitulatif</span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Sous-total</span>
                                        <span>{order.subtotal_amount} DT</span>
                                      </div>
                                      {order.discount_amount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Réduction</span>
                                          <span>-{order.discount_amount} DT</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>Frais de service</span>
                                        <span>{order.processing_fee} DT</span>
                                      </div>
                                      <div className="flex justify-between font-medium text-base mt-2">
                                        <span>Total</span>
                                        <span>{order.total_amount} DT</span>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Section: Paiement */}
                                  {order.payments && order.payments.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <CreditCard className="h-5 w-5 text-purple-600" />
                                        <span className="font-semibold text-lg">Paiement</span>
                                      </div>
                                      <div className="flex items-center text-sm">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        <span>
                                          Payé le {new Date(order.payments[0].payment_date || "").toLocaleDateString("fr-FR")}{" "}
                                          via {order.payments[0].payment_method?.name}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="w-full text-center text-xs text-muted-foreground mt-2">
                                    Pour toute question sur votre commande, contactez le support client.
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {order.status === "COMPLETED" && (
                              <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Facture
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground text-center mb-4">Vous n'avez pas encore passé de commande.</p>
                    <Button asChild>
                      <a href="/events">Découvrir des événements</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
