"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, MoreVertical, Edit, Trash2, Eye, Calendar, MapPin, Users, CheckCircle, XCircle, AlertTriangle, Plus, Play, EyeOff, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { eventsApi } from "@/lib/api/events"
import { mappingsApi } from "@/lib/api/mappings"
import { venuesApi } from "@/lib/api/venues"

// Format a date string to input[type="datetime-local"] value (YYYY-MM-DDTHH:mm)
function formatForDatetimeLocal(input?: string): string {
  if (!input) return ''
  const date = new Date(input)
  if (isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

const EVENT_STATUS = {
  // Simplified, aligned with backend transitions and soccer flow
  DRAFT: "Brouillon",
  SCHEDULED: "Planifié",
  CONFIRMED: "Confirmé",
  PUBLISHED: "Publié",
  LIVE: "En direct",
  FINISHED: "Terminé",
  CANCELLED: "Annulé",
  POSTPONED: "Reporté",
  RESCHEDULED: "Reprogrammé",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
} as const

// Allowed event types aligned with backend enum
const EVENT_TYPES = [
  'SPORTS_MATCH', 'TOURNAMENT', 'CHAMPIONSHIP', 'CONCERT', 'THEATER', 'EXHIBITION',
  'FESTIVAL', 'CONFERENCE', 'SEMINAR', 'NETWORKING', 'TRADE_SHOW', 'COMMUNITY',
  'CHARITY', 'FAMILY', 'EDUCATIONAL', 'VIRTUAL', 'HYBRID', 'INTERACTIVE'
] as const

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800",
  LIVE: "bg-red-100 text-red-800",
  FINISHED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  POSTPONED: "bg-yellow-100 text-yellow-800",
  RESCHEDULED: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
} as const

// Compute allowed next statuses (must match backend rules)
function getAllowedNextStatuses(current: string): string[] {
  switch (current) {
    case 'DRAFT':
      return ['SCHEDULED', 'CANCELLED']
    case 'SCHEDULED':
      return ['CONFIRMED', 'CANCELLED', 'POSTPONED', 'RESCHEDULED']
    case 'CONFIRMED':
      return ['PUBLISHED', 'CANCELLED', 'POSTPONED', 'RESCHEDULED']
    case 'PUBLISHED':
      return ['LIVE', 'CANCELLED', 'POSTPONED', 'RESCHEDULED']
    case 'LIVE':
      return ['FINISHED', 'SUSPENDED']
    case 'POSTPONED':
      return ['SCHEDULED', 'CONFIRMED', 'CANCELLED']
    case 'SUSPENDED':
      return ['LIVE', 'CANCELLED']
    case 'RESCHEDULED':
      return ['SCHEDULED', 'CONFIRMED', 'CANCELLED']
    default:
      return []
  }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20
  const { toast } = useToast()
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(false)
  const [eventLoading, setEventLoading] = useState(false)
  const [eventCategories, setEventCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [availableMappings, setAvailableMappings] = useState<any[]>([])
  const [availableVenues, setAvailableVenues] = useState<any[]>([])
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    type: 'SPORTS_MATCH', // Keep for backend compatibility but hidden from UI
    category: '',
    venueId: '',
    mappingId: '',
    capacityTotal: '',
    ticketSalesStart: '',
    ticketSalesEnd: '',
    tags: '',
    featuredImageUrl: '',
    metadata: {
      is_public: true,
      requires_approval: false,
      is_featured: false
    }
  })
  const [formError, setFormError] = useState<string | null>(null)
  const { data: session } = useSession()

  // Confirmation dialog state (black & white theme)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDescription, setConfirmDescription] = useState('')
  const [confirmLabel, setConfirmLabel] = useState('Confirmer')
  const [onConfirmAction, setOnConfirmAction] = useState<null | (() => Promise<void>)>(null)

  const openConfirm = (
    title: string,
    description: string,
    label: string,
    action: () => Promise<void>
  ) => {
    setConfirmTitle(title)
    setConfirmDescription(description)
    setConfirmLabel(label)
    setOnConfirmAction(() => action)
    setConfirmOpen(true)
  }

  useEffect(() => {
    fetchEvents()
    fetchEventCategories()
  }, [searchTerm, statusFilter, categoryFilter, page])

  // Auto-detect venue and mapping when category is selected (works for both create and edit)
  useEffect(() => {
    if (form.category) {
      fetchMappingsForCategory(form.category)
    }
  }, [form.category])

  const fetchEventCategories = async () => {
    setLoadingCategories(true)
    try {
      const response = await eventsApi.getEventCategories()
      if (response.success && Array.isArray(response.data)) {
        setEventCategories(response.data)
      } else if (Array.isArray(response)) {
        setEventCategories(response)
      } else if (response.data && Array.isArray(response.data)) {
        setEventCategories(response.data)
      }
    } catch (err: any) {
      console.error('Error fetching event categories:', err)
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories d'événements",
        variant: "destructive"
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchMappingsForCategory = async (categoryId: string) => {
    setLoadingMappings(true)
    try {
      // Fetch all mappings
      const mappingsResponse = await mappingsApi.getAll()
      if (mappingsResponse.success && Array.isArray(mappingsResponse.data)) {
        // Filter mappings that include this category
        const matchingMappings = mappingsResponse.data.filter((mapping: any) => 
          mapping.event_categories && 
          Array.isArray(mapping.event_categories) && 
          mapping.event_categories.includes(categoryId)
        )
        
        setAvailableMappings(matchingMappings)
        
        // If we have matching mappings, auto-select the first one
        if (matchingMappings.length > 0) {
          const firstMapping = matchingMappings[0]
          setForm(prev => ({
            ...prev,
            mappingId: firstMapping.id,
            venueId: firstMapping.venue_id
          }))
          
          // Optionally fetch venue details for display
          if (firstMapping.venue_id) {
            try {
              const venueResponse = await venuesApi.getById(firstMapping.venue_id)
              if (venueResponse.success && venueResponse.data) {
                setAvailableVenues([venueResponse.data])
              }
            } catch (err) {
              console.error('Error fetching venue:', err)
            }
          }
        } else {
          // No matching mappings found by category filtering
          // Try to find mappings by known IDs for specific categories (fallback for when category ID not in mapping array)
          const isFootballCategory = await checkIfFootballCategory(categoryId)
          let fallbackMapping: any = null
          
          if (isFootballCategory) {
            // Try to find the football mapping by its known ID
            const defaultFootballMappingId = '9f33b2cb-4742-4527-aa38-5f49a969f85d'
            fallbackMapping = mappingsResponse.data.find((m: any) => m.id === defaultFootballMappingId)
            
            if (fallbackMapping) {
              // Found the mapping by ID - use it (same behavior as basketball/volleyball)
              setAvailableMappings([fallbackMapping])
              setForm(prev => ({
                ...prev,
                mappingId: fallbackMapping.id,
                venueId: fallbackMapping.venue_id
              }))
              
              // Fetch venue details for display
              if (fallbackMapping.venue_id) {
                try {
                  const venueResponse = await venuesApi.getById(fallbackMapping.venue_id)
                  if (venueResponse.success && venueResponse.data) {
                    setAvailableVenues([venueResponse.data])
                  }
                } catch (err) {
                  console.error('Error fetching football venue:', err)
                }
              }
            } else {
              // Mapping not found - clear form (backend will auto-assign)
          setForm(prev => ({
            ...prev,
            mappingId: '',
            venueId: ''
          }))
          setAvailableMappings([])
          setAvailableVenues([])
            }
          } else {
            // No matching mappings found and not a known category with fallback
            setForm(prev => ({
              ...prev,
              mappingId: '',
              venueId: ''
            }))
            setAvailableMappings([])
            setAvailableVenues([])
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching mappings for category:', err)
      toast({
        title: "Avertissement",
        description: "Impossible de charger les mappings pour cette catégorie",
        variant: "default"
      })
    } finally {
      setLoadingMappings(false)
    }
  }

  // Helper function to check if a category is a football category
  const checkIfFootballCategory = async (categoryId: string): Promise<boolean> => {
    try {
      // Find the category in the loaded categories
      const category = eventCategories.find((cat: any) => cat.id === categoryId)
      if (category) {
        const codeLower = (category.code || '').toLowerCase()
        const nameLower = (category.name || '').toLowerCase()
        return codeLower.includes('foot') || 
               codeLower.includes('football') || 
               nameLower.includes('foot') || 
               nameLower.includes('football')
      }
      return false
    } catch (err) {
      console.error('Error checking if category is football:', err)
      return false
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        limit: 20,
      }
      if (searchTerm) params.search = searchTerm
      if (statusFilter !== "all") params.status = statusFilter
      if (categoryFilter !== "all") params.category = categoryFilter
      
      const response = await eventsApi.getEvents(page, 20, params, true)
      
      // Handle the actual backend response format: { events: [...], total: number }
      const eventList = response.events || []
      console.log('Backend response:', response)
      console.log('Events list:', eventList)
      console.log('Events count:', eventList.length)
      
      setEvents(eventList)
      
      // Handle pagination - backend returns { total: number }
      if (response.total) {
        setTotalCount(response.total)
        setTotalPages(Math.ceil(response.total / 20))
      } else {
        setTotalCount(eventList.length)
      }
    } catch (err: any) {
      console.error("Error fetching events:", err)
      
      // Handle specific API errors
      if (err.response?.status === 400) {
        setError("Erreur de requête API (400). Vérifiez les paramètres de filtrage.")
      } else if (err.response?.status === 404) {
        setError("Endpoint des événements non trouvé (404). Vérifiez que le backend est configuré.")
      } else if (err.response?.status === 401) {
        setError("Vous n'êtes pas autorisé à accéder aux événements.")
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.")
      } else {
        setError("Erreur lors du chargement des événements. Veuillez réessayer.")
      }
      
      setEvents([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (event: any, newStatus: string) => {
    setActionLoading(true)
    try {
      console.log('Updating event status:', event.id, 'to:', newStatus)
      
      // Update local state immediately for instant feedback
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id ? { ...e, status: newStatus } : e
        )
      )
      
      // Use the dedicated status update endpoint
      await eventsApi.updateEventStatus(event.id, newStatus)
      
      // Refresh events list to get the latest data from backend
      setTimeout(() => fetchEvents(), 500)
      
      toast({
        title: "Statut mis à jour",
        description: `L'événement ${event.name} est maintenant ${EVENT_STATUS[newStatus as keyof typeof EVENT_STATUS]?.toLowerCase()}`
      })
    } catch (err: any) {
      console.error("Error updating event status:", err)
      
      // Revert local state change on error
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id ? { ...e, status: event.status } : e
        )
      )
      
      // Friendly error mapping
      const getBackendMessage = (error: any): string => {
        const raw = error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message
        if (Array.isArray(raw)) return raw.join(', ')
        return raw || 'Requête invalide'
      }

      const humanizeStatus = (status: string) => EVENT_STATUS[status as keyof typeof EVENT_STATUS] || status

      const backendMsg = String(getBackendMessage(err)).toLowerCase()
      let friendly = 'Impossible de mettre à jour le statut.'

      const match = backendMsg.match(/cannot change event status from "?(\w+)"? to "?(\w+)"?/)
      if (match) {
        const from = match[1]?.toUpperCase()
        const to = match[2]?.toUpperCase()
        friendly = `Transition non autorisée: ${humanizeStatus(from)} → ${humanizeStatus(to)}.`
        if (backendMsg.includes('already finished')) {
          friendly += ' Cet événement est déjà terminé et ne peut plus être modifié.'
        } else if (backendMsg.includes("while it's live") || backendMsg.includes('while it\'s live')) {
          friendly += ' Depuis LIVE, vous pouvez passer à FINISHED ou SUSPENDED.'
        }
      } else if (err?.response?.status === 401) {
        friendly = "Session expirée ou autorisation manquante. Veuillez vous reconnecter."
      } else if (err?.response?.status === 404) {
        friendly = "Événement introuvable."
      } else if (err?.response?.status === 429) {
        friendly = "Trop de tentatives. Réessayez dans quelques instants."
      }

      toast({
        title: "Erreur",
        description: friendly,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Intercept critical transitions and ask for confirmation
  const onSelectStatus = (event: any, newStatus: string) => {
    const critical = new Set(['CANCELLED', 'ARCHIVED', 'FINISHED', 'SUSPENDED'])
    if (critical.has(newStatus)) {
      const label = EVENT_STATUS[newStatus as keyof typeof EVENT_STATUS] || newStatus
      openConfirm(
        `${label} ?`,
        `Confirmez-vous le statut "${label}" pour l'événement "${event.name}" ? Cette action peut être définitive.`,
        label,
        async () => { setConfirmOpen(false); await handleStatusChange(event, newStatus) }
      )
    } else {
      void handleStatusChange(event, newStatus)
    }
  }

  const handlePublish = async (event: any) => {
    // Check current status and transition to the next allowed status
    const allowedNext = getAllowedNextStatuses(event.status)
    if (allowedNext.includes("PUBLISHED")) {
      await handleStatusChange(event, "PUBLISHED")
    } else if (allowedNext.includes("CONFIRMED")) {
      // If we can't publish directly, go to CONFIRMED first
      await handleStatusChange(event, "CONFIRMED")
    } else if (allowedNext.includes("SCHEDULED")) {
      // For DRAFT, transition to SCHEDULED first
      await handleStatusChange(event, "SCHEDULED")
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de publier cet événement dans son état actuel.",
        variant: "destructive"
      })
    }
  }

  const handleUnpublish = async (event: any) => {
    // PUBLISHED cannot go directly to DRAFT
    // Allowed transitions from PUBLISHED: LIVE, CANCELLED, POSTPONED, RESCHEDULED
    // We'll transition to POSTPONED as a way to "unpublish" temporarily
    const allowedNext = getAllowedNextStatuses(event.status)
    if (allowedNext.includes("POSTPONED")) {
      await handleStatusChange(event, "POSTPONED")
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de dépublier cet événement dans son état actuel.",
        variant: "destructive"
      })
    }
  }

  const handleCancel = async (event: any) => {
    openConfirm(
      "Annuler l'événement ?",
      `Voulez-vous annuler l'événement "${event.name}" ? Cette action est généralement définitive.`,
      'Annuler',
      async () => { setConfirmOpen(false); await handleStatusChange(event, 'CANCELLED') }
    )
  }

  const handleDelete = async (event: any) => {
    openConfirm(
      "Supprimer l'événement ?",
      `Voulez-vous vraiment supprimer l'événement "${event.name}" ? Cette action est irréversible.`,
      'Supprimer',
      async () => {
        setConfirmOpen(false)
        setActionLoading(true)
        try {
          await eventsApi.deleteEvent(event.id)
          fetchEvents()
          toast({ title: 'Événement supprimé', description: "L'événement a été supprimé avec succès" })
        } catch (err: any) {
          console.error('Error deleting event:', err)
          const msg = err?.response?.data?.message || err?.message || "Impossible de supprimer l'événement"
          toast({ title: 'Erreur', description: msg, variant: 'destructive' })
        } finally {
          setActionLoading(false)
        }
      }
    )
  }

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
    const label = EVENT_STATUS[status as keyof typeof EVENT_STATUS] || status
    return <Badge className={color}>{label}</Badge>
  }

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

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim() || !form.scheduledStart || !form.scheduledEnd) {
      setFormError("Veuillez remplir tous les champs obligatoires.")
      return
    }
    
    setEventLoading(true)
    try {
      // Map form fields to backend DTO format, omitting empty optional fields
      const eventDataBase: any = {
        name: form.name,
        description: form.description,
        scheduledStart: form.scheduledStart,
        scheduledEnd: form.scheduledEnd,
        capacityTotal: form.capacityTotal ? parseInt(form.capacityTotal) : undefined,
        ticketSalesStart: form.ticketSalesStart || undefined,
        ticketSalesEnd: form.ticketSalesEnd || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        featuredImageUrl: form.featuredImageUrl || undefined,
        metadata: form.metadata
      }
      // Only include category, venueId, and mappingId if they have actual values (not empty strings)
      if (form.category && form.category.trim() !== '') eventDataBase.category = form.category
      if (form.venueId && form.venueId.trim() !== '') eventDataBase.venueId = form.venueId
      if (form.mappingId && form.mappingId.trim() !== '') eventDataBase.mappingId = form.mappingId
      const eventData = eventDataBase
      
      if (editingEvent && selectedEvent) {
        // Update existing event
        await eventsApi.updateEvent(selectedEvent.id, eventData)
        toast({ title: "Événement modifié avec succès" })
      } else {
        // Create new event - map to backend CreateEventDto format
        const baseCreate: any = {
          name: form.name,
          description: form.description,
          scheduledStart: form.scheduledStart,
          scheduledEnd: form.scheduledEnd,
          capacityTotal: form.capacityTotal ? parseInt(form.capacityTotal) : undefined,
          ticketSalesStart: form.ticketSalesStart || undefined,
          ticketSalesEnd: form.ticketSalesEnd || undefined,
          featuredImageUrl: form.featuredImageUrl || undefined,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
          metadata: form.metadata
        }
        if (form.category) baseCreate.category = form.category
        if (form.venueId) baseCreate.venueId = form.venueId
        if (form.mappingId) baseCreate.mappingId = form.mappingId
        const createEventData = baseCreate
        await eventsApi.createEvent(createEventData)
        toast({ title: "Événement ajouté avec succès" })
      }
      
      // Refresh events list
      fetchEvents()
      
      setShowAddEventModal(false)
        setForm({ name: '', description: '', scheduledStart: '', scheduledEnd: '', type: 'SPORTS_MATCH', category: '', venueId: '', mappingId: '', capacityTotal: '', ticketSalesStart: '', ticketSalesEnd: '', tags: '', featuredImageUrl: '', metadata: { is_public: true, requires_approval: false, is_featured: false } })
      setEditingEvent(false)
      setSelectedEvent(null)
    } catch (err: any) {
      console.error("Error saving event:", err)
      const raw = err?.response?.data || err?.message || ''
      let friendly = "Erreur lors de l'enregistrement de l'événement"
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
      if (text.includes('capacité') || text.toLowerCase().includes('capacity')) {
        friendly = "La capacité de l'événement dépasse la capacité du lieu. Réduisez la capacité ou choisissez un autre lieu."
      } else if (text.toLowerCase().includes('organisateur invalide')) {
        friendly = "Organisateur invalide configuré. Contactez l'administrateur."
      } else if (text.toLowerCase().includes('utilisateur créateur invalide')) {
        friendly = "Session invalide. Veuillez vous reconnecter et réessayer."
      } else if (text.toLowerCase().includes('cannot change event status') || text.toLowerCase().includes('transition non autorisée')) {
        friendly = "Transition de statut non autorisée pour cet événement."
      } else if (text.toLowerCase().includes('bad request exception')) {
        friendly = "Données invalides. Vérifiez les champs obligatoires et les dates."
      } else if (text.toLowerCase().includes('venueid must be a uuid')) {
        friendly = "Identifiant de lieu invalide."
      } else if (text.toLowerCase().includes('validation failed') || text.toLowerCase().includes('validation error')) {
        friendly = "Validation échouée. Corrigez les champs saisis."
      }
      setFormError(friendly)
      toast({ title: "Erreur", description: friendly, variant: "destructive" })
    } finally {
      setEventLoading(false)
    }
  }

  const handleEditEvent = async (event: any) => {
    setSelectedEvent(event)
    setEditingEvent(true)
    // Normalize type to a valid backend enum value
    const normalizedType = EVENT_TYPES.includes((event.type || '').toUpperCase() as any)
      ? (event.type || '').toUpperCase()
      : 'SPORTS_MATCH'
    
    const venueId = event.venueId || event.venue_id || ''
    
    setForm({
      name: event.name,
      description: event.description || '',
      scheduledStart: formatForDatetimeLocal(event.scheduledStart || event.scheduled_start),
      scheduledEnd: formatForDatetimeLocal(event.scheduledEnd || event.scheduled_end),
      type: normalizedType,
      category: event.categoryId || event.category_id || event.category || '',
      venueId: venueId,
      mappingId: event.mappingId || event.mapping_id || '',
      capacityTotal: event.capacityTotal || event.capacity_total?.toString() || '',
      ticketSalesStart: formatForDatetimeLocal(event.ticketSalesStart || event.ticket_sales_start),
      ticketSalesEnd: formatForDatetimeLocal(event.ticketSalesEnd || event.ticket_sales_end),
      tags: event.tags ? event.tags.join(', ') : '',
      featuredImageUrl: event.featuredImageUrl || event.featured_image_url || '',
      metadata: {
        is_public: event.visibility === 'PUBLIC',
        requires_approval: false,
        is_featured: false,
        ...event.metadata
      }
    })
    
    // Fetch venue details if we have a venueId to display the name
    if (venueId) {
      try {
        const venueResponse = await venuesApi.getById(venueId)
        if (venueResponse.success && venueResponse.data) {
          setAvailableVenues([venueResponse.data])
        }
      } catch (err) {
        console.error('Error fetching venue for edit:', err)
        // If venue fetch fails, try to use venue name from event if available
        if (event.venueName || event.venue?.name) {
          setAvailableVenues([{
            id: venueId,
            name: event.venueName || event.venue?.name
          }])
        }
      }
    }
    
    setShowAddEventModal(true)
    setFormError(null)
  }

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowStatsModal(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Événements"
            description="Gérez les événements, leurs statuts et leurs configurations."
          >
             <Button className="ml-auto" variant="default" onClick={() => { setEditingEvent(false); setShowAddEventModal(true); setForm({ name: '', description: '', scheduledStart: '', scheduledEnd: '', type: 'SPORTS_MATCH', category: '', venueId: '', mappingId: '', capacityTotal: '', ticketSalesStart: '', ticketSalesEnd: '', tags: '', featuredImageUrl: '', metadata: { is_public: true, requires_approval: false, is_featured: false } }); setFormError(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter Événement
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par nom, organisateur, lieu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
              </div>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="SCHEDULED">Planifié</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="PUBLISHED">Publié</option>
                <option value="LIVE">En direct</option>
                <option value="FINISHED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
                <option value="POSTPONED">Reporté</option>
                <option value="RESCHEDULED">Reprogrammé</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {eventCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                  <p className="text-xs text-muted-foreground">Événements</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Publiés</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter(e => e.status === "PUBLISHED").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Événements publiés</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En direct</CardTitle>
                  <Play className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter(e => e.status === "LIVE").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Événements en direct</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annulés</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter(e => e.status === "CANCELLED").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Événements annulés</p>
                </CardContent>
              </Card>
            </div>

            {/* Events Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchEvents }}
              />
            ) : events.length === 0 ? (
              error ? (
                <div className="space-y-4">
                  <EmptyState
                    icon={<AlertTriangle className="h-12 w-12" />}
                    title="Erreur de connexion API"
                    description={error}
                    action={{ 
                      label: "Réessayer", 
                      onClick: fetchEvents 
                    }}
                  />
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      <strong>Note de développement :</strong> L'endpoint des événements sur le backend pourrait ne pas être encore implémenté. 
                      Cette erreur est normale pendant le développement.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-12 w-12" />}
                  title="Aucun événement trouvé"
                  description={
                    searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Essayez d'ajuster vos critères de recherche."
                      : "Aucun événement n'est disponible."
                  }
                  action={{ 
                    label: "Réinitialiser", 
                    onClick: () => { 
                      setSearchTerm(""); 
                      setStatusFilter("all"); 
                      setCategoryFilter("all"); 
                    } 
                  }}
                />
              )
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:flex items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div className="w-2/5 min-w-[300px]">ÉVÉNEMENT</div>
                  <div className="w-1/6 min-w-[120px]">CATÉGORIE</div>
                  <div className="w-1/6 min-w-[120px]">STATUT</div>
                  <div className="w-1/6 min-w-[120px]">DATE</div>
                  <div className="w-1/6 min-w-[120px]">LIEU</div>
                  <div className="flex-1 flex justify-end pr-2">ACTIONS</div>
                </div>
                
                {/* Event count */}
                {!loading && events.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
                  </div>
                )}

                {/* Events List */}
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="hidden md:flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2/5 min-w-[300px] flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(event.scheduledStart || event.scheduled_start)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px]">
                      <Badge variant="secondary">
                        {event.category || event.categoryName || 'Sans catégorie'}
                      </Badge>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(event.status)}
                        <select
                          className="text-xs border rounded px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          value={event.status}
                          onChange={(e) => onSelectStatus(event, e.target.value)}
                          disabled={actionLoading}
                        >
                          {/* Only show allowed transitions for clarity */}
                          <option value={event.status} disabled>{EVENT_STATUS[event.status as keyof typeof EVENT_STATUS] || event.status}</option>
                          {getAllowedNextStatuses(event.status).map(next => (
                            <option key={next} value={next}>{EVENT_STATUS[next as keyof typeof EVENT_STATUS] || next}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px]">
                      <span className="text-sm text-gray-600">
                        {formatDate(event.scheduledStart || event.scheduled_start)}
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.venueName || event.venue?.name || event.venue_id || "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEvent(event)}
                              disabled={actionLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir les détails</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {(event.status === "DRAFT" || event.status === "SCHEDULED" || event.status === "CONFIRMED") && getAllowedNextStatuses(event.status).includes("PUBLISHED") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePublish(event)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Publier</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {event.status === "DRAFT" && !getAllowedNextStatuses(event.status).includes("PUBLISHED") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(event, "SCHEDULED")}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Planifier</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {event.status === "PUBLISHED" && getAllowedNextStatuses(event.status).includes("POSTPONED") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnpublish(event)}
                                disabled={actionLoading}
                              >
                                <EyeOff className="h-4 w-4 text-yellow-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reporter (dépublier temporairement)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleViewEvent(event)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Button>
                            {event.status === "DRAFT" && getAllowedNextStatuses(event.status).includes("SCHEDULED") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-blue-600 hover:text-blue-700"
                                onClick={() => handleStatusChange(event, "SCHEDULED")}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Planifier
                              </Button>
                            )}
                            {(event.status === "SCHEDULED" || event.status === "CONFIRMED") && getAllowedNextStatuses(event.status).includes("PUBLISHED") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-green-600 hover:text-green-700"
                                onClick={() => handlePublish(event)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publier
                              </Button>
                            )}
                            {event.status === "PUBLISHED" && getAllowedNextStatuses(event.status).includes("POSTPONED") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                                onClick={() => handleUnpublish(event)}
                                disabled={actionLoading}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Reporter (dépublier temporairement)
                              </Button>
                            )}

                            {/* Cancel event (critical) */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start text-red-600 hover:text-red-700"
                              onClick={() => handleCancel(event)}
                              disabled={actionLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler l'événement
                            </Button>

                            {/* Delete event */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start text-red-700 hover:text-red-800"
                              onClick={() => handleDelete(event)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && events.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Affichage de <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                    <span className="font-semibold">
                      {Math.min(page * itemsPerPage, totalCount)}
                    </span>{' '}
                    sur <span className="font-semibold">{totalCount}</span> événement{totalCount > 1 ? 's' : ''}
                  </span>
                  {totalPages > 1 && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>
                        Page <span className="font-semibold">{page}</span> sur{' '}
                        <span className="font-semibold">{totalPages}</span>
                      </span>
                    </>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-3"
                    >
                      <ChevronRight className="h-4 w-4 ml-1" />
                      <ChevronRight className="h-4 w-4 -mr-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Calendar className="h-6 w-6 text-primary" />
              {editingEvent ? "Modifier l'Événement" : "Nouvel Événement"}
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              {editingEvent ? "Modifiez les informations de l'événement." : "Créez un nouvel événement. Tous les champs marqués * sont obligatoires."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveEvent} className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-name" className="block mb-1 font-medium">Nom *</label>
                    <Input id="event-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom de l'événement" />
                  </div>
                  <div>
                    <label htmlFor="event-category" className="block mb-1 font-medium">Catégorie *</label>
                    <select 
                      id="event-category" 
                      value={form.category}
                      onChange={e => {
                        // Clear venue and mapping when category changes to allow re-detection
                        setForm(f => ({ ...f, category: e.target.value, venueId: '', mappingId: '' }))
                        setAvailableVenues([])
                        setAvailableMappings([])
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                      disabled={loadingCategories}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {eventCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {loadingCategories && (
                      <p className="text-xs text-muted-foreground mt-1">Chargement des catégories...</p>
                    )}
                    {!loadingCategories && eventCategories.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Aucune catégorie disponible</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="event-description" className="block mb-1 font-medium">Description</label>
                  <Textarea id="event-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez votre événement..." />
                </div>
              </CardContent>
            </Card>

            {/* Location & Capacity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Lieu & Capacité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-venue" className="block mb-1 font-medium">Lieu</label>
                    <Input 
                      id="event-venue" 
                      value={availableVenues.find(v => v.id === form.venueId)?.name || form.venueId || 'Sélection automatique...'} 
                      disabled 
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {loadingMappings ? 'Recherche du lieu approprié...' : form.venueId ? 'Lieu détecté automatiquement' : 'Sélectionnez une catégorie pour détecter le lieu'}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="event-capacity" className="block mb-1 font-medium">Capacité maximale</label>
                    <Input id="event-capacity" type="number" value={form.capacityTotal} onChange={e => setForm(f => ({ ...f, capacityTotal: e.target.value }))} placeholder="Nombre de places" />
                    <p className="text-xs text-muted-foreground mt-1">Laissez vide pour utiliser la capacité du lieu</p>
                  </div>
                </div>
                {form.mappingId && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      ✓ Mapping détecté: {availableMappings.find(m => m.id === form.mappingId)?.name || form.mappingId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Dates & Horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-start" className="block mb-1 font-medium">Début *</label>
                    <Input id="event-start" type="datetime-local" value={form.scheduledStart} onChange={e => setForm(f => ({ ...f, scheduledStart: e.target.value }))} required />
                  </div>
                  <div>
                    <label htmlFor="event-end" className="block mb-1 font-medium">Fin *</label>
                    <Input id="event-end" type="datetime-local" value={form.scheduledEnd} onChange={e => setForm(f => ({ ...f, scheduledEnd: e.target.value }))} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-sales-start" className="block mb-1 font-medium">Début des ventes</label>
                    <Input id="event-sales-start" type="datetime-local" value={form.ticketSalesStart} onChange={e => setForm(f => ({ ...f, ticketSalesStart: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="event-sales-end" className="block mb-1 font-medium">Fin des ventes</label>
                    <Input id="event-sales-end" type="datetime-local" value={form.ticketSalesEnd} onChange={e => setForm(f => ({ ...f, ticketSalesEnd: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Paramètres Supplémentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-tags" className="block mb-1 font-medium">Tags</label>
                    <Input id="event-tags" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags séparés par des virgules" />
                    <p className="text-xs text-muted-foreground mt-1">Ex: sport, football, championnat</p>
                  </div>
                  <div>
                    <label htmlFor="event-featured-image" className="block mb-1 font-medium">Image de vedette</label>
                    <Input id="event-featured-image" value={form.featuredImageUrl} onChange={e => setForm(f => ({ ...f, featuredImageUrl: e.target.value }))} placeholder="URL de l'image de vedette" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input id="event-public" type="checkbox" checked={form.metadata?.is_public} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, is_public: e.target.checked } }))} />
                    <label htmlFor="event-public" className="text-sm">Événement public</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="event-approval" type="checkbox" checked={form.metadata?.requires_approval} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, requires_approval: e.target.checked } }))} />
                    <label htmlFor="event-approval" className="text-sm">Validation requise</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="event-featured" type="checkbox" checked={form.metadata?.is_featured} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, is_featured: e.target.checked } }))} />
                    <label htmlFor="event-featured" className="text-sm">Événement en vedette</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Error Display */}
            {formError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAddEventModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={eventLoading}>
                {eventLoading ? <LoadingSpinner size="sm" /> : editingEvent ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event View Modal */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Détails de l'événement
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <p className="text-gray-900">{selectedEvent.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{selectedEvent.type || 'SPORTS_MATCH'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <p className="text-gray-900">{selectedEvent.category || 'Sans catégorie'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibilité</label>
                  <p className="text-gray-900">{selectedEvent.visibility || 'PUBLIC'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{selectedEvent.description || 'Aucune description'}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <p className="text-gray-900">
                    {formatDate(selectedEvent.scheduledStart || selectedEvent.scheduled_start)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <p className="text-gray-900">
                    {formatDate(selectedEvent.scheduledEnd || selectedEvent.scheduled_end)}
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité maximale</label>
                  <p className="text-gray-900">
                    {selectedEvent.capacityTotal || selectedEvent.capacity_total || 'Illimitée'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité actuelle</label>
                  <p className="text-gray-900">
                    {selectedEvent.capacityCurrent || selectedEvent.current_capacity || 0}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <p className="text-gray-900">
                  {selectedEvent.venueName || selectedEvent.venue?.name || selectedEvent.venue_id || 'N/A'}
                </p>
              </div>

              {/* Tags */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedEvent.visibility === 'PUBLIC'} 
                    disabled 
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Événement public</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedEvent.metadata?.requires_approval || false} 
                    disabled 
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Validation requise</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedEvent.metadata?.is_featured || false} 
                    disabled 
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Événement en vedette</label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowStatsModal(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setShowStatsModal(false)
              handleEditEvent(selectedEvent)
            }}>
              Modifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Confirmation Dialog - black & white theme */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white text-black border border-black">
          <DialogHeader>
            <DialogTitle className="text-black">{confirmTitle}</DialogTitle>
            <DialogDescription className="text-gray-700">
              {confirmDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="border-black text-black">
              Annuler
            </Button>
            <Button onClick={() => { if (onConfirmAction) onConfirmAction() }} className="bg-black text-white hover:bg-gray-900">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}