"use client"

import { useEffect, useState } from "react"
import { contactApi } from '@/lib/api/contact'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Mail, User as UserIcon, Tag, Info, CheckCircle, XCircle, Loader2, MessageSquare, Send, Trash2, Reply } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  RESPONDED: "Répondu",
  CLOSED: "Fermé",
}
const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  PENDING: Loader2,
  RESPONDED: CheckCircle,
  CLOSED: XCircle,
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  RESPONDED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
}

export default function AdminContactRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<any | null>(null)
  const [response, setResponse] = useState("")
  const [status, setStatus] = useState<string>("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await contactApi.getContactRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError("Erreur lors du chargement des demandes de contact.")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (req: any) => {
    setSelected(req)
    setResponse(req.response || "")
    setStatus(req.status)
    setActionError("")
  }

  const handleRespond = async () => {
    console.log("handleRespond called", { selected, response, status });
    if (!selected) return
    setActionLoading(true)
    setActionError("")
    try {
      const updated = await contactApi.updateContactRequest(selected.id, { response, status })
      setRequests((prev) => prev.map((r) => r.id === selected.id ? updated : r))
      setSelected(null) // Close modal after success
      setResponse("")
      setStatus("")
    } catch (err: any) {
      setActionError("Erreur lors de la mise à jour.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette demande de contact ?")) return
    setActionLoading(true)
    setActionError("")
    try {
      await contactApi.deleteContactRequest(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err: any) {
      setActionError("Erreur lors de la suppression.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <PageHeader title="Demandes de contact" description="Gérez et répondez aux demandes de contact des utilisateurs." />
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Demandes de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pt-4 pb-2 text-sm text-muted-foreground">
                {requests.length} demandes trouvées
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                <div className="grid grid-cols-12 items-center px-6 py-2 text-xs font-semibold text-muted-foreground uppercase gap-2">
                  <div className="col-span-3 flex items-center gap-1"><UserIcon className="h-4 w-4 mr-1" />Nom</div>
                  <div className="col-span-3 flex items-center gap-1"><Mail className="h-4 w-4 mr-1" />Email</div>
                  <div className="col-span-2 flex items-center gap-1"><Tag className="h-4 w-4 mr-1" />Sujet</div>
                  <div className="col-span-2 flex items-center gap-1"><Info className="h-4 w-4 mr-1" />Statut</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                {requests.map((request) => (
                  <div key={request.id} className="grid grid-cols-12 items-center px-6 py-4 bg-white dark:bg-zinc-900 rounded-lg my-2 shadow-sm">
                    <div className="col-span-3 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-muted mr-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </span>
                      <div>
                        <div className="font-semibold text-base">{request.name}</div>
                        <div className="text-xs text-muted-foreground">{request.created_at && new Date(request.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="col-span-3 font-medium">{request.email}</div>
                    <div className="col-span-2">{request.subject}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"}`}>
                        {(() => { const StatusIcon = STATUS_ICONS[request.status] || Info; return <StatusIcon className="h-4 w-4" /> })()}
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-2 justify-center">
                      <Button variant="outline" size="icon" onClick={() => handleView(request)}><Info className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(request.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Modal for viewing/responding to a contact request */}
          <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader className="bg-muted/50 rounded-t-lg px-6 pt-6 pb-2 border-b">
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Mail className="h-6 w-6 text-primary" />
                  Détail de la demande
                </DialogTitle>
                <DialogDescription className="text-base mt-1 mb-4">Informations détaillées sur la demande de contact</DialogDescription>
              </DialogHeader>
              {selected && (() => {
                const StatusIcon = STATUS_ICONS[selected.status] || Info;
                return (
                  <div className="space-y-8 px-8 py-8">
                    {/* Section: Informations de Contact */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-lg">Informations de Contact</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Nom</div>
                          <div className="font-semibold text-lg flex items-center gap-2 break-all"><UserIcon className="h-5 w-5 text-muted-foreground" />{selected.name}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email</div>
                          <div className="font-semibold text-lg flex items-center gap-2 break-all"><Mail className="h-5 w-5 text-muted-foreground" />{selected.email}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Sujet</div>
                          <div className="font-medium text-base flex items-center gap-2 break-all"><Tag className="h-5 w-5 text-muted-foreground" />{selected.subject}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Statut</div>
                          <div className="flex items-center gap-2"><StatusIcon className="h-5 w-5" />{selected.status}</div>
                        </div>
                      </div>
                    </div>
                    {/* Section: Message */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-lg">Message</span>
                      </div>
                      <div className="bg-muted/60 rounded-xl shadow p-6 border">
                        <div className="text-base text-muted-foreground whitespace-pre-line">{selected.message}</div>
                      </div>
                    </div>
                    {/* Section: Réponse */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-lg">Réponse</span>
                      </div>
                      <div className="bg-muted/60 rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Réponse</div>
                          <textarea className="w-full min-h-[60px] rounded border px-3 py-2 text-base" value={response} onChange={e => setResponse(e.target.value)} placeholder="Votre réponse..." />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Changer le statut</div>
                          <select className="w-full rounded border px-3 py-2 text-base" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="PENDING">En attente</option>
                            <option value="RESPONDED">Répondu</option>
                            <option value="CLOSED">Fermé</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <DialogFooter className="px-8 pb-8">
                      <Button variant="default" onClick={handleRespond} className="flex items-center gap-2 text-base px-6 py-2" disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        {actionLoading ? "Enregistrement..." : "Enregistrer la réponse"}
                      </Button>
                      <Button variant="outline" onClick={() => setSelected(null)} className="text-base px-6 py-2">Fermer</Button>
                    </DialogFooter>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
} 