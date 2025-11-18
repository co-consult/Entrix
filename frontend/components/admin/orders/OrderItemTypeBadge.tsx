"use client"

import { Badge } from "@/components/ui/badge"

const ITEM_TYPES = {
  TICKET: "Billet",
  SUBSCRIPTION: "Abonnement",
  MERCHANDISE: "Marchandise",
  SERVICE: "Service",
  OTHER: "Autre"
}

const ITEM_TYPE_COLORS = {
  TICKET: "bg-blue-100 text-blue-800",
  SUBSCRIPTION: "bg-green-100 text-green-800",
  MERCHANDISE: "bg-purple-100 text-purple-800",
  SERVICE: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800"
}

interface OrderItemTypeBadgeProps {
  type: string
  className?: string
}

export function OrderItemTypeBadge({ type, className }: OrderItemTypeBadgeProps) {
  const color = ITEM_TYPE_COLORS[type as keyof typeof ITEM_TYPE_COLORS] || "bg-gray-100 text-gray-800"
  const label = ITEM_TYPES[type as keyof typeof ITEM_TYPES] || type
  
  return (
    <Badge className={`${color} ${className || ''}`}>
      {label}
    </Badge>
  )
}
