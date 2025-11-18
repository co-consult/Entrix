"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, BarChart3, Plus, Edit, Trash2, Shield } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { useSession } from "next-auth/react";

const GROUP_TYPES = [
  "ACCESS",
  "MARKETING",
  "MIXED",
  "ZONE_ASSIGNMENT",
  "TEMPORAL",
];
const GROUP_STATUSES = [
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "EXPIRED",
  "CANCELLED",
  "TERMINATED",
];

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, totalMembers: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "ACCESS",
    status: "ACTIVE",
    max_members: "",
  });
  const [saving, setSaving] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchGroups();
      fetchStats();
    }
  }, [status]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getGroups();
      setGroups(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les groupes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.request("/groups/stats");
      setStats(data);
    } catch {
      setStats({ total: 0, active: 0, totalMembers: 0 });
    }
  };

  const openCreateDialog = () => {
    setEditingGroup(null);
    setForm({ name: "", description: "", type: "ACCESS", status: "ACTIVE", max_members: "" });
    setShowDialog(true);
  };

  const openEditDialog = (group: any) => {
    setEditingGroup(group);
    setForm({
      name: group.name || "",
      description: group.description || "",
      type: group.type || "ACCESS",
      status: group.status || "ACTIVE",
      max_members: group.max_members ? String(group.max_members) : "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (group: any) => {
    if (!window.confirm(`Supprimer le groupe "${group.name}" ?`)) return;
    try {
      await apiClient.deleteGroup(group.id);
      toast({ title: "Succès", description: "Groupe supprimé." });
      fetchGroups();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Suppression impossible", variant: "destructive" });
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_members: form.max_members ? Number(form.max_members) : undefined,
      };
      if (editingGroup) {
        await apiClient.updateGroup(editingGroup.id, payload);
        toast({ title: "Succès", description: "Groupe modifié." });
      } else {
        await apiClient.createGroup(payload);
        toast({ title: "Succès", description: "Groupe créé." });
      }
      setShowDialog(false);
      fetchGroups();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Enregistrement impossible", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Groupes"
            description="Gérez les groupes, leurs types et leur capacité."
          >
            <Button className="ml-auto" variant="default" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Nouveau Groupe
            </Button>
          </PageHeader>

          {/* --- Statistics Cards Section --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Groupes</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.total : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Groupes Actifs</CardTitle>
                <UserCheck className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.active : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Capacité Totale</CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.totalMembers : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Types de Groupes</CardTitle>
                <Users className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {GROUP_TYPES.length}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* --- End Statistics Cards Section --- */}

          {/* --- Table Section --- */}
          <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Membres max</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <EmptyState
                        title="Aucun groupe trouvé"
                        description="Créez un groupe pour commencer à organiser vos utilisateurs."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.type}</TableCell>
                      <TableCell>{group.status}</TableCell>
                      <TableCell>{group.max_members ?? "-"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(group)}>
                          <Edit className="h-4 w-4 mr-1" /> Modifier
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(group)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* --- End Table Section --- */}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Users className="h-6 w-6 text-primary" />
                  {editingGroup ? "Modifier le Groupe" : "Nouveau Groupe"}
                </DialogTitle>
                <DialogDescription className="text-base mt-1 mb-4">
                  {editingGroup ? "Modifiez les informations du groupe." : "Créez un nouveau groupe. Tous les champs marqués * sont obligatoires."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Section: Informations Générales */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-lg">Informations Générales</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="group-name" className="block mb-1 font-medium">Nom *</label>
                      <Input id="group-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} placeholder="Nom du groupe" />
                      <p className="text-xs text-muted-foreground mt-1">Le nom du groupe doit être unique.</p>
                    </div>
                    <div>
                      <label htmlFor="group-type" className="block mb-1 font-medium">Type *</label>
                      <select id="group-type" className="w-full border rounded px-3 py-2" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                        {GROUP_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="group-description" className="block mb-1 font-medium">Description</label>
                    <Input id="group-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} placeholder="Description du groupe" />
                  </div>
                </div>
                {/* Section: Statut */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-lg">Statut</span>
                  </div>
                  <div>
                    <label htmlFor="group-status" className="block mb-1 font-medium">Statut *</label>
                    <select id="group-status" className="w-full border rounded px-3 py-2" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} required>
                      {GROUP_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
