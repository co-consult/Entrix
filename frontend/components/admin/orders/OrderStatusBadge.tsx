"use client"

import { Badge } from "@/components/ui/badge"

const ORDER_STATUS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En traitement",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  EXPIRED: "Expirée",
  PARTIALLY_FULFILLED: "Partiellement traitée",
  ON_HOLD: "En suspens",
  FAILED: "Échouée"
}

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  EXPIRED: "bg-red-100 text-red-800",
  PARTIALLY_FULFILLED: "bg-yellow-100 text-yellow-800",
  ON_HOLD: "bg-orange-100 text-orange-800",
  FAILED: "bg-red-100 text-red-800"
}

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
  const label = ORDER_STATUS[status as keyof typeof ORDER_STATUS] || status
  
  return (
    <Badge className={`${color} ${className || ''}`}>
      {label}
    </Badge>
  )
}
