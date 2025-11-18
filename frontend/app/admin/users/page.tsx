"use client"

import { useEffect, useState, useRef } from "react"
import { groupsApi } from "@/lib/api/groups"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Edit, Trash2, Eye, KeyRound, UserCheck, UserX, Plus, Mail, Users, Calendar, LogIn, EyeOff, UserPlus, UserMinus, Shield, Activity, Download, Filter, Ticket, CreditCard, XCircle, User, Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usersApi } from "@/lib/api/users"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { UserCreationModal } from "@/components/admin/user-creation-modal";

function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFilteredCount, setTotalFilteredCount] = useState(0)
  const [itemsPerPage] = useState(20)
  const { toast } = useToast()
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [originalUser, setOriginalUser] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [viewUser, setViewUser] = useState<any | null>(null)
  const [resetUser, setResetUser] = useState<any | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState(false);

  const [resetPasswordStrength, setResetPasswordStrength] = useState<{score: number, label: string, color: string}>({score: 0, label: '', color: ''});
  const [stats, setStats] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState(false)
  // Add state for modals
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<any | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [userTab, setUserTab] = useState<'active' | 'archived'>('active');






  // Password strength checker - updated to match backend requirements
  function getPasswordStrength(pw: string) {
    let score = 0;
    let requirements = {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      numbers: /\d/.test(pw),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)
    };
    
    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.numbers) score++;
    if (requirements.symbols) score++;
    
    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-400' };
    if (score === 3) return { score, label: 'Moyen', color: 'bg-yellow-400' };
    if (score >= 4) return { score, label: 'Fort', color: 'bg-green-500' };
    return { score, label: '', color: '' };
  }

  // Mapping function to normalize user data from backend
  function mapUserFromBackend(user: any) {
    return {
      ...user,
      first_name: user.first_name ?? user.firstName ?? "",
      last_name: user.last_name ?? user.lastName ?? "",
      is_active: user.is_active ?? user.isActive ?? false,
      roles: user.roles ?? [],
      created_at: user.created_at ?? user.createdAt ?? null,
      last_login: user.last_login ?? user.lastLogin ?? null,
    };
  }

  // Helper function to get user's full name
  const getUserFullName = (user: any) => {
    if (!user) {
      console.warn('getUserFullName called with null or undefined user:', user);
      return '';
    }
    const firstName = user.first_name || user.firstName;
    const lastName = user.last_name || user.lastName;
    if (!firstName && !lastName) {
      console.warn('User object missing first_name/firstName and last_name/lastName fields:', user);
      return '';
    }
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    // Fetch all roles from backend
    usersApi.getAllRoles().then(setRoles).catch(() => setRoles([]));
    // eslint-disable-next-line
  }, [roleFilter, page, dateRange, userTab]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch groups when opening the Assign to Group modal
  useEffect(() => {
    if (showAssignGroupModal) {
      (async () => {
        try {
          const groupsResponse = await groupsApi.getGroups();
          setGroups(groupsResponse.data || []);
        } catch (err) {
          setGroups([]);
          toast({ title: "Erreur", description: "Impossible de charger les groupes", variant: "destructive" });
        }
      })();
    }
  }, [showAssignGroupModal]);

  const [assignGroupLoading, setAssignGroupLoading] = useState(false);

  const handleAssignGroup = async () => {
    if (!selectedUserForGroup?.id || !selectedGroupId) return;
    setAssignGroupLoading(true);
    try {
      // Use groupsApi.addMember to assign user to group
      await groupsApi.addMember(selectedGroupId, selectedUserForGroup.id);
      toast({ title: "Succès", description: "Utilisateur assigné au groupe." });
      setShowAssignGroupModal(false);
      setSelectedGroupId("");
      setSelectedUserForGroup(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'assigner l'utilisateur au groupe", variant: "destructive" });
    } finally {
      setAssignGroupLoading(false);
    }
  };

  const [assignRoleLoading, setAssignRoleLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedUserForRole?.id || !selectedRoleId) return;
    setAssignRoleLoading(true);
    try {
      // TODO: No usersApi.removeRole or assignRole exists. Implement or use group API if needed.
      // For now, this action is not implemented.
      toast({ title: "Rôle assigné avec succès (simulation)" });
      setShowAssignRoleModal(false);
      setSelectedRoleId("");
      setSelectedUserForRole(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur lors de l'assignation du rôle", description: err.message, variant: "destructive" });
    } finally {
      setAssignRoleLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersApi.getUserStats()
      console.log("Backend stats response:", response)
      // Transform backend response to match frontend expectations
      const responseData = response as any
      
      // Safely extract admin count from roleStats
      let adminCount = 0
      if (responseData.roleStats && Array.isArray(responseData.roleStats)) {
        const adminRole = responseData.roleStats.find((r: any) => (r.role_name || '').toLowerCase() === 'administrator' || (r.role_code || '').toUpperCase() === 'ADMIN');
        adminCount = adminRole?._count || 0;
      }
      
      const transformedStats = {
        total_users: responseData.data?.totalUsers || 0,
        active_users: responseData.data?.activeUsers || 0,
        admins: adminCount,
        active_subscriptions: responseData.data?.activeSubscriptions || 0,
        verified_users: responseData.data?.verifiedUsers || 0,
        newUsersToday: responseData.data?.newUsersToday || 0,
      }
      console.log("Transformed stats:", transformedStats)
      setStats(transformedStats)
    } catch (err) {
      console.error("Error fetching stats:", err)
      // Set fallback values when API fails - do not calculate from paginated results
      setStats({
        total_users: 0,
        active_users: 0,
        admins: 0,
        active_subscriptions: 0,
        verified_users: 0,
        newUsersToday: 0,
      })
    }
  }

  // Fetch users and then fetch roles for each user
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        limit: itemsPerPage,
      };
      
      // Only add query if it has at least 2 characters (backend requirement)
      if (searchTerm && searchTerm.trim().length >= 2) {
        params.query = searchTerm.trim();
        console.log('Search query being sent to backend:', JSON.stringify(params.query));
      }
      if (dateRange.start) params.createdAfter = dateRange.start;
      if (dateRange.end) params.createdBefore = dateRange.end;
      
      // Add is_active filter based on current tab - use the correct parameter name for backend
      if (userTab === 'active') {
        params.is_active = true;
      } else if (userTab === 'archived') {
        params.is_active = false;
      }
      
      // Role filter
      if (roleFilter !== "all") params.role = roleFilter;
      console.log('Fetching users with params:', params);
      console.log('Search term before trim:', JSON.stringify(searchTerm));
      console.log('Search term after trim:', JSON.stringify(searchTerm?.trim()));
      const response = await usersApi.getUsers(params.page || 1, params.limit || 20, params)
      console.log('Users response:', response);
      console.log('Response structure:', {
        hasData: 'data' in response,
        totalPages: (response as any).totalPages,
        pagination: (response as any).pagination,
        total: (response as any).total,
        dataLength: response.data?.length
      });
      console.log('Full response object keys:', Object.keys(response));
      console.log('Pagination object:', (response as any).pagination);
      
      // Handle paginated response
      if (response && typeof response === 'object' && 'data' in response) {
        let userList: any[] = response.data || []
        // For each user, fetch their roles and merge into user object
        await Promise.all(userList.map(async (user) => {
          try {
            const rolesRes = await usersApi.getUserRoles(user.id)
            user.roles = (rolesRes && rolesRes.data) ? rolesRes.data.map((r: any) => r.roleCode || r.code || r.roleName || r.name) : []
          } catch {
            user.roles = []
          }
          try {
            const userDetailsRes = await usersApi.getUser(user.id);
            const userDetails = userDetailsRes?.data ?? userDetailsRes ?? {};
            // @ts-expect-error: dynamic property access for camelCase
            user.last_login = userDetails.last_login || userDetails["lastLogin"] || null;
            // @ts-expect-error: dynamic property access for camelCase
            user.created_at = userDetails.created_at || userDetails["createdAt"] || null;
          } catch {
            user.last_login = null;
            user.created_at = null;
          }
        }))
        setUsers(userList)
        // Handle pagination response structure
        const responseAny = response as any;
        const totalPages = responseAny.pagination?.totalPages || 1;
        const totalCount = responseAny.pagination?.total || userList.length;
        console.log('Setting pagination:', { totalPages, totalCount, pagination: responseAny.pagination });
        setTotalPages(totalPages);
        setTotalFilteredCount(totalCount);
      } else {
        // Fallback for non-paginated response
        let userList: any[] = Array.isArray(response) ? response : []
        // For each user, fetch their roles and merge into user object
        await Promise.all(userList.map(async (user) => {
          try {
            const rolesRes = await usersApi.getUserRoles(user.id)
            user.roles = (rolesRes && rolesRes.data) ? rolesRes.data.map((r: any) => r.roleCode || r.code || r.roleName || r.name) : []
          } catch {
            user.roles = []
          }
          try {
            const userDetailsRes = await usersApi.getUser(user.id);
            const userDetails = userDetailsRes?.data ?? userDetailsRes ?? {};
            // @ts-expect-error: dynamic property access for camelCase
            user.last_login = userDetails.last_login || userDetails["lastLogin"] || null;
            // @ts-expect-error: dynamic property access for camelCase
            user.created_at = userDetails.created_at || userDetails["createdAt"] || null;
          } catch {
            user.last_login = null;
            user.created_at = null;
          }
        }))
        setUsers(userList)
        setTotalFilteredCount(userList.length)
        setTotalPages(1)
      }
    } catch (err: any) {
      setError("Erreur lors du chargement des utilisateurs.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: string) => {
    setExportLoading(true)
    try {
      // Fetch ALL users matching current filters (paginate through all pages)
      const baseParams: any = {};
      // Apply same filters as the main fetch
      if (searchTerm && searchTerm.trim().length >= 2) {
        baseParams.query = searchTerm.trim();
      }
      if (dateRange.start) baseParams.createdAfter = dateRange.start;
      if (dateRange.end) baseParams.createdBefore = dateRange.end;
      if (userTab === 'active') {
        baseParams.is_active = true;
      } else if (userTab === 'archived') {
        baseParams.is_active = false;
      }
      if (roleFilter !== "all") baseParams.role = roleFilter;

      const aggregatedUsers: any[] = [];
      let currentPage = 1;
      const pageSize = 200; // reasonable large page size to reduce number of requests
      while (true) {
        const res = await usersApi.getUsers(currentPage, pageSize, { ...baseParams });
        const pageUsers = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray(res) ? res : []);
        aggregatedUsers.push(...pageUsers);
        const pagination = (res as any)?.pagination;
        if (pagination && typeof pagination.totalPages === 'number') {
          if (currentPage >= pagination.totalPages) break;
          currentPage += 1;
        } else {
          // No pagination object provided, assume single page
          break;
        }
      }

      // Export all users matching current filters
      const exportData = aggregatedUsers.map(raw => {
        const user = mapUserFromBackend(raw);
        return ({
        'Email': user.email,
        'Prénom': user.first_name || '',
        'Nom': user.last_name || '',
        'Téléphone': user.phone || '',
        'Statut': isUserActive(user) ? 'Actif' : 'Inactif',
        'Email vérifié': user.email_verified ? 'Oui' : 'Non',
        'Rôles': Array.isArray(user.roles) ? user.roles.join(', ') : '',
        'Créé le': user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '',
        'Dernière connexion': user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : ''
        });
      });

      // Create Excel file using xlsx library
      const XLSX = await import('xlsx');
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better formatting
      const columnWidths = [
        { wch: 30 }, // Email
        { wch: 15 }, // Prénom
        { wch: 15 }, // Nom
        { wch: 15 }, // Téléphone
        { wch: 10 }, // Statut
        { wch: 12 }, // Email vérifié
        { wch: 25 }, // Rôles
        { wch: 12 }, // Créé le
        { wch: 15 }, // Dernière connexion
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create a descriptive sheet name based on current filters
      let sheetName = 'Utilisateurs';
      if (userTab === 'active') {
        sheetName = 'Utilisateurs Actifs';
      } else if (userTab === 'archived') {
        sheetName = 'Utilisateurs Archivés';
      }
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate the Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a descriptive filename based on current filters
      let filename = `utilisateurs-${new Date().toISOString().split('T')[0]}`;
      if (userTab === 'active') {
        filename += '-actifs';
      } else if (userTab === 'archived') {
        filename += '-archives';
      }
      if (searchTerm) {
        filename += `-recherche-${searchTerm}`;
      }
      if (roleFilter !== 'all') {
        filename += `-role-${roleFilter}`;
      }
      filename += '.xlsx';
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Create a descriptive success message
      let message = `${exportData.length} utilisateur${exportData.length > 1 ? 's' : ''} exporté${exportData.length > 1 ? 's' : ''}`;
      if (userTab === 'active') {
        message += ' (actifs)';
      } else if (userTab === 'archived') {
        message += ' (archivés)';
      }
      if (searchTerm || roleFilter !== 'all' || dateRange.start || dateRange.end) {
        message += ' avec filtres appliqués';
      }
      message += ' en fichier Excel';
      
      toast({
        title: "Export réussi",
        description: message
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  }

  // View user details
  const handleView = async (user: any) => {
    console.log('DEBUG handleView user:', user); // Debug log to check user object
    setViewLoading(true);
    setViewUser(null);
    setViewError(null);
    setUserTickets([]);
    setTicketsLoading(false);
    setUserSubscriptions([]);
    setSubsLoading(false);
    setShowTicketsModal(false);
    setShowSubsModal(false);
    try {
      // Use getUser instead of getUserProfile
      const res = await usersApi.getUser(user.id);
      // Accept both {data: user} and direct user object
      let userObj = res?.data ?? res ?? null;
      if (userObj) {
        // Fetch roles for this user, just like in fetchUsers
        try {
          const rolesRes = await usersApi.getUserRoles(user.id);
          userObj.roles = (rolesRes && rolesRes.data) ? rolesRes.data.map((r: any) => r.roleCode || r.code || r.roleName || r.name) : [];
        } catch {
          userObj.roles = [];
        }
        // Normalize email_verified and emailVerified
        // @ts-expect-error: dynamic property access for emailVerified
        userObj.email_verified = userObj.email_verified ?? userObj.emailVerified ?? false;
        // @ts-expect-error: dynamic property access for emailVerified
        userObj.emailVerified = userObj.email_verified;
        setViewUser(userObj);
        setTicketsLoading(true);
        try {
          // TODO: No usersApi.getUserTickets exists. Implement or use a dedicated endpoint.
          // const tickets = await usersApi.getUserTickets(user.id);
          // setUserTickets(Array.isArray(tickets) ? tickets : []);
          setUserTickets([]);
        } catch (ticketErr) {
          setUserTickets([]);
        } finally {
          setTicketsLoading(false);
        }
        setSubsLoading(true);
        try {
          // TODO: No usersApi.getUserSubscriptions exists. Implement or use a dedicated endpoint.
          // let subs = await usersApi.getUserSubscriptions(user.id);
          // if (Array.isArray(subs)) {
          //   subs = subs.filter((sub) => sub.user_id === user.id);
          // }
          // setUserSubscriptions(Array.isArray(subs) ? subs : []);
          setUserSubscriptions([]);
        } catch (subsErr) {
          setUserSubscriptions([]);
        } finally {
          setSubsLoading(false);
        }
      } else {
        setViewError("Impossible de charger les détails de l'utilisateur (données manquantes).");
      }
    } catch (err: any) {
      setViewError(err?.message || "Erreur lors de la récupération du profil utilisateur.");
    } finally {
      setViewLoading(false);
    }
  };

  // Edit user
  const handleEditSubmit = async () => {
    setEditLoading(true)
    try {
      // Only send editable fields, do not send role or status
      const payload = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        phone: editingUser.phone,
      }
      console.log("Updating user", editingUser.id, payload);
      await usersApi.updateUser(editingUser.id, payload);
      // Handle status change separately
      if (originalUser && editingUser.is_active !== originalUser.is_active) {
        if (editingUser.is_active) {
          await usersApi.activateUser(editingUser.id);
          // ✅ NOUVEAU : Clear archived badge when user is activated through edit
          setUsers(prev => prev.map(u => 
            u.id === editingUser.id 
              ? { 
                  ...u, 
                  is_active: true, 
                  metadata: { 
                    ...u.metadata, 
                    deletedAt: undefined // Remove the deletedAt field
                  } 
                }
              : u
          ))
        } else {
          await usersApi.deactivateUser(editingUser.id);
        }
      }
      toast({ title: "Utilisateur modifié avec succès" })
      setEditingUser(null)
      setOriginalUser(null)
      fetchUsers()
    } catch (err: any) {
      toast({ title: "Erreur lors de la modification", description: err.message, variant: "destructive" })
    } finally {
      setEditLoading(false)
    }
  }

  // Activate/Deactivate user (already implemented)
  const handleToggleActive = async (user: any) => {
    try {
      if (isUserActive(user)) {
        await usersApi.deactivateUser(user.id)
        toast({ title: "Utilisateur désactivé" })
      } else {
        await usersApi.activateUser(user.id)
        toast({ title: "Utilisateur activé" })
        // ✅ NOUVEAU : Clear archived badge when user is activated
        // Update the user's metadata to remove deletedAt when activated
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { 
                ...u, 
                is_active: true, 
                metadata: { 
                  ...u.metadata, 
                  deletedAt: undefined // Remove the deletedAt field
                } 
              }
            : u
        ))
      }
      fetchUsers()
    } catch (err: any) {
      toast({ title: "Erreur lors du changement de statut", description: err.message, variant: "destructive" })
    }
  }

  // Verify user
  const handleVerifyUser = async (user: any) => {
    try {
      await usersApi.verifyUser(user.id)
      toast({ title: "Utilisateur vérifié" })
      fetchUsers()
    } catch (err: any) {
      toast({ title: "Erreur lors de la vérification", description: err.message, variant: "destructive" })
    }
  }

  // Delete user: call usersApi.deleteUser and remove user from list on success
  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    try {
      await usersApi.deleteUser(id)
      toast({ title: "Utilisateur archivé avec succès" })
      setDeleteUserId(null)
      // Update the user's is_active status instead of removing from list
      setUsers(prev => prev.map(u => 
        u.id === id 
          ? { ...u, is_active: false, metadata: { ...u.metadata, deletedAt: new Date().toISOString() } }
          : u
      ))
    } catch (err: any) {
      let message =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de l'archivage"
      if (
        typeof message === "string" &&
        message.includes("related records")
      ) {
        message =
          "Impossible d'archiver cet utilisateur car il possède des tickets ou d'autres données associées. Veuillez d'abord supprimer ou réaffecter ces données."
      }
      toast({
        title: "Erreur lors de l'archivage",
        description: message,
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Suspend/Unsuspend user - not supported, leave as TODO
  const handleSuspendUser = async (user: any) => {
    // TODO: No backend endpoint for suspend/unsuspend. Implement when available.
    toast({ title: "Suspension non supportée (backend manquant)" })
  }

  // Admin-initiated password reset - not supported, leave as TODO
  const handleResetPassword = async () => {
    // TODO: No backend endpoint for admin-initiated password reset. Implement when available.
    toast({ title: "Réinitialisation du mot de passe non supportée (backend manquant)" })
      setResetUser(null)
      setResetPassword("")
  }

  // Helper function to determine active status
  const isUserActive = (user: any) => {
    if (typeof user.is_active === 'boolean') return user.is_active;
    if (typeof user.isActive === 'boolean') return user.isActive;
    console.warn('User object missing is_active and isActive fields:', user);
    return false;
  };

  // Helper function to determine if user is archived
  const isUserArchived = (user: any) => {
    // A user is considered archived if they are inactive OR have a deletedAt timestamp
    return !isUserActive(user) || (user.metadata && user.metadata.deletedAt);
  };

  // Helper to check if a user has the selected role
  const userHasRole = (user: any, selectedRoleCode: string) => {
    const userRoles = user.roles || user.user_roles || [];
    return userRoles.some(
      (role: any) =>
        (typeof role === "string" && role === selectedRoleCode) ||
        role.code === selectedRoleCode ||
        role.roleCode === selectedRoleCode
    );
  };

  // Use users directly from backend - all filtering is done on the backend
  // The backend already applies: search, role, date range, and active/inactive filters
  const filteredUsers = users;

  // Add missing closing brace if needed
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Utilisateurs"
            description="Gérez les utilisateurs, leurs rôles et leurs accès."
          >
            <Button className="ml-auto" variant="default" onClick={() => setShowAddUserModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter Utilisateur
            </Button>
          </PageHeader>
          {/* Tab Switcher */}
          <Tabs value={userTab} onValueChange={v => setUserTab(v as 'active' | 'archived')} className="mb-6">
            <TabsList>
              <TabsTrigger value="active">Utilisateurs actifs</TabsTrigger>
              <TabsTrigger value="archived">Utilisateurs archivés / inactifs</TabsTrigger>
            </TabsList>
          </Tabs>
          {/* --- Statistics Cards Section --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Users */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.total_users : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            {/* Active Users */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                <UserCheck className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.active_users : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            {/* New Users Today */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux utilisateurs aujourd'hui</CardTitle>
                <UserPlus className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.newUsersToday : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
            {/* Active Subscriptions */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
                <CreditCard className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.active_subscriptions : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* --- End Statistics Cards Section --- */}
          {/* --- Enhanced Filtering Section --- */}
          <div className="space-y-4 mb-6">
            {/* Search and Quick Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par nom, email, téléphone ou rôle..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ boxShadow: 'none' }}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
                {searchTerm && searchTerm.trim().length === 1 && (
                  <div className="absolute -bottom-6 left-0 text-xs text-orange-600">
                    Saisissez au moins 2 caractères pour rechercher
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setRoleFilter("all")
                  setDateRange({ start: "", end: "" })
                }}
                className="text-xs"
              >
                Réinitialiser
              </Button>
            </div>
            
            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded-full px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem 1.25rem',
                  }}
                >
                  <option value="all">Tous les rôles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.code}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={dateRange.start ? new Date(dateRange.start) : undefined}
                  onChange={date => setDateRange(prev => ({ ...prev, start: date ? date.toISOString().slice(0, 10) : '' }))}
                  selectsStart
                  startDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  endDate={dateRange.end ? new Date(dateRange.end) : undefined}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Date début"
                  className="text-sm border border-gray-300 rounded-full px-3 py-2"
                  isClearable
                />
                <span className="text-gray-400">à</span>
                <DatePicker
                  selected={dateRange.end ? new Date(dateRange.end) : undefined}
                  onChange={date => setDateRange(prev => ({ ...prev, end: date ? date.toISOString().slice(0, 10) : '' }))}
                  selectsEnd
                  startDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  endDate={dateRange.end ? new Date(dateRange.end) : undefined}
                  minDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Date fin"
                  className="text-sm border border-gray-300 rounded-full px-3 py-2"
                  isClearable
                />
              </div>
              
              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
                className="text-xs"
              >
                {exportLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exporter
              </Button>
            </div>
          </div>
          {/* --- End Enhanced Filtering Section --- */}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col gap-2 min-h-[300px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center bg-white rounded-xl shadow px-4 py-3 gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchUsers }}
              />
            ) : totalFilteredCount === 0 ? (
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="Aucun utilisateur trouvé"
                description="Ajustez vos critères de recherche ou aucun utilisateur n'est disponible."
                action={{ label: "Réinitialiser", onClick: () => { setSearchTerm(""); setRoleFilter("all") } }}
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_180px] lg:grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_180px] md:grid-cols-[1.2fr_0.8fr_0.6fr_1fr_1fr_140px] sm:grid-cols-[1fr_0.6fr_0.5fr_0.8fr_0.8fr_120px] items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div>Utilisateur</div>
                  <div>Rôles</div>
                  <div>Statut</div>
                  <div>Dernière connexion</div>
                  <div>Créé le</div>
                  <div className="text-right pr-2">Actions</div>
                </div>
                {/* User count */}
                {!loading && filteredUsers.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">{totalFilteredCount} utilisateur{totalFilteredCount > 1 ? 's' : ''} trouvé{totalFilteredCount > 1 ? 's' : ''}</div>
                )}
                {filteredUsers.map((user) => {
                  console.log('USER_ROW:', user);
                  const userRoles = user.roles || user.user_roles || [];
                  if (!user.roles && !user.user_roles) {
                    console.warn('User object missing roles/user_roles fields:', user);
                  }
                  return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_180px] lg:grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr_180px] md:grid-cols-[1.2fr_0.8fr_0.6fr_1fr_1fr_140px] sm:grid-cols-[1fr_0.6fr_0.5fr_0.8fr_0.8fr_120px] items-center bg-white rounded-xl shadow-sm px-4 py-3 group hover:bg-gray-50 border-b last:border-b-0 relative"
                  >
                    {/* User */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
                        {user.avatar ? (
                          <img src={user.avatar} alt={getUserFullName(user)} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          `${(user.first_name || user.firstName || 'U')?.[0] || "U"}${(user.last_name || user.lastName || '')?.[0] || ""}`
                        )}
                      </div>
                      <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate max-w-[160px] md:max-w-[140px] sm:max-w-[120px] text-sm sm:text-xs" title={getUserFullName(user)}>{getUserFullName(user)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[140px] md:max-w-[120px] sm:max-w-[100px]" title={user.email}>
                          <Mail className="h-3 w-3" />
                          <span className="truncate" data-tooltip-id={`email-tooltip-${user.id}`}>{user.email}</span>
                        </div>
                        {(user.metadata?.isNoPriceUser || user.isNoPriceUser || user.sponsorType) && (
                          <Badge className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-medium">
                            {(user.metadata?.sponsorType || user.sponsorType) === 'SPONSOR' ? 'Sponsor' : 'Partenaire'} - 0 frais
                          </Badge>
                        )}
                      </div>
                      {isUserArchived(user) && (
                        <Badge className="ml-2 bg-gray-300 text-gray-800 text-xs font-medium">Archivé</Badge>
                      )}
                    </div>
                    {/* Roles */}
                    <div>
                        {userRoles.length === 0 ? (
                        <span className="text-gray-400 text-xs">Aucun</span>
                      ) : (
                          userRoles.map((r: any, i: number) => (
                          <Badge key={i} className="mr-1 mb-1 inline-block bg-blue-100 text-blue-800">
                              {typeof r === "string" ? r : r.role?.name || r.name || r.code || "?"}
                          </Badge>
                        ))
                      )}
                    </div>
                    {/* Statut */}
                    <div>
                        <Badge className={isUserActive(user) ? "rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800" : "rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800"}>
                          {isUserActive(user) ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    {/* Last Login */}
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <LogIn className="h-4 w-4 text-gray-400" />
                      {user.last_login ? new Date(user.last_login).toLocaleDateString("fr-FR") : "-"}
                    </div>
                    {/* Created At */}
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "-"}
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end">
                      {/* Voir */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" aria-label="Voir" className="rounded-full" onClick={e => { e.stopPropagation(); handleView(user); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir les détails de l'utilisateur</TooltipContent>
                        </Tooltip>
                        {/* Désactiver/Activer */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" aria-label={isUserActive(user) ? "Désactiver" : "Activer"} className="rounded-full" onClick={e => { e.stopPropagation(); handleToggleActive(user); }}>
                                {isUserActive(user) ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                            <TooltipContent>{isUserActive(user) ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}</TooltipContent>
                        </Tooltip>
                        {/* Modifier */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" aria-label="Modifier" className="rounded-full" onClick={e => { e.stopPropagation();
                                // Map user data to ensure consistent field names
                                const mappedUser = mapUserFromBackend(user);
                                setOriginalUser(mappedUser);
                              setEditingUser({
                                  ...mappedUser,
                              });
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier l'utilisateur</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* Dropdown for remaining actions */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" aria-label="Actions administratives" className="rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="min-w-[14rem] max-w-sm p-1 z-[100] mt-2 shadow-lg rounded-xl border border-gray-200 whitespace-normal">
                          <TooltipProvider>
                            {/* Réinitialiser le mot de passe */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start text-sm" size="sm" onClick={e => { e.stopPropagation(); setResetUser(user); }}>
                                  <KeyRound className="mr-2 h-4 w-4" /> Réinitialiser le mot de passe
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Réinitialiser le mot de passe</TooltipContent>
                            </Tooltip>
                            {/* Assigner un rôle 
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start text-sm" size="sm" onClick={e => { e.stopPropagation(); setSelectedUserForRole(user); setShowAssignRoleModal(true); }}>
                                  <Shield className="mr-2 h-4 w-4" /> Assigner un rôle
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Assigner un rôle</TooltipContent>
                            </Tooltip>*/}
                              {/* Supprimer */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 text-sm" size="sm" onClick={e => { e.stopPropagation(); setDeleteUserId(user.id); }}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Archiver
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Archiver l'utilisateur</TooltipContent>
                              </Tooltip>
                              {/* Vérifier */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start text-green-600 hover:bg-green-50 text-sm" size="sm" onClick={async e => {
                                  e.stopPropagation();
                                  try {
                                      await handleVerifyUser(user);
                                  } catch (err: any) {
                                      toast({ title: "Erreur", description: err?.message || "Impossible de vérifier l'utilisateur", variant: "destructive" });
                                  }
                                }}>
                                    <UserCheck className="mr-2 h-4 w-4" /> Vérifier l'utilisateur
                                </Button>
                              </TooltipTrigger>
                                <TooltipContent>Vérifier l'utilisateur</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  );
                })}
                {/* Pagination */}
                {!loading && !error && totalFilteredCount > 0 && (
                  <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Affichage de <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                        <span className="font-semibold">
                          {Math.min(page * itemsPerPage, totalFilteredCount)}
                        </span>{' '}
                        sur <span className="font-semibold">{totalFilteredCount}</span> utilisateurs
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
                    {/* Debug info */}
                    <div className="text-xs text-gray-400">
                      Debug: totalPages={totalPages}, page={page}, totalFilteredCount={totalFilteredCount}
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
            )}
          </div>
        </div>
      </div>

      {/* View User Modal */}
      <Dialog open={!!viewUser || viewLoading || !!viewError} onOpenChange={() => { setViewUser(null); setViewLoading(false); setViewError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex justify-center items-center min-h-[120px]"><LoadingSpinner size="lg" /></div>
          ) : viewError ? (
            <div className="text-red-600 text-center py-8">{viewError}</div>
          ) : viewUser ? (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Informations personnelles</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Prénom</div>
                    <div className="font-semibold text-gray-900 text-lg">{viewUser.first_name || viewUser.firstName || ''}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Nom</div>
                    <div className="font-semibold text-gray-900 text-lg">{viewUser.last_name || viewUser.lastName || ''}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Email</div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {viewUser.email}
                    {(viewUser.email_verified || viewUser.emailVerified) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">Vérifié</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-2">Non vérifié</span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Téléphone</div>
                  <div className="font-medium text-gray-900">{viewUser.phone || '-'}</div>
                </div>
              </div>
              {/* Statut & rôle */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Statut & rôle</div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Statut</div>
                    <span className={isUserActive(viewUser) ? "inline-block rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800" : "inline-block rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800"}>
                      {isUserActive(viewUser) ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Rôle</div>
                    {(() => {
                      const userRoles = viewUser?.roles || viewUser?.user_roles || [];
                      if (!viewUser?.roles && !viewUser?.user_roles) {
                        console.warn('User object missing roles/user_roles fields:', viewUser);
                      }
                      return userRoles.length === 0 ? (
                        <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">Aucun</span>
                      ) : (
                        userRoles.map((role: any, i: number) => (
                          <Badge key={i} className="bg-gray-100 text-gray-800 text-xs font-medium mr-1">
                            {typeof role === "string" ? role : role?.name || role?.code || "?"}
                          </Badge>
                        ))
                      );
                    })()}
                  </div>
                </div>
              </div>
              {/* Activité */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Activité</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Dernière connexion</div>
                    <div className="font-medium text-gray-900">{viewUser.last_login || viewUser.lastLogin ? new Date(viewUser.last_login || viewUser.lastLogin).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '-'}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Membre depuis</div>
                    <div className="font-medium text-gray-900">{viewUser.created_at || viewUser.createdAt ? new Date(viewUser.created_at || viewUser.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '-'}</div>
                  </div>
                </div>
              </div>
              {/* Improved Unified Tickets & Subscriptions Section (centered, after activity) */}
              <div className="flex flex-col items-center mt-8">
                <div className="flex gap-6">
                  <button
                    className="flex flex-col items-center bg-blue-50 text-blue-700 font-semibold rounded-full px-6 py-3 shadow hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                    onClick={() => setShowTicketsModal(true)}
                    type="button"
                    style={{ minWidth: 110 }}
                  >
                    <span className="text-2xl font-bold">{userTickets.length}</span>
                    <span className="text-sm font-medium">Tickets</span>
                  </button>
                  <button
                    className="flex flex-col items-center bg-green-50 text-green-700 font-semibold rounded-full px-6 py-3 shadow hover:bg-green-100 transition focus:outline-none focus:ring-2 focus:ring-green-300"
                    onClick={() => setShowSubsModal(true)}
                    type="button"
                    style={{ minWidth: 110 }}
                  >
                    <span className="text-2xl font-bold">{userSubscriptions.length}</span>
                    <span className="text-sm font-medium">Abonnements</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => { setViewUser(null); setViewLoading(false); setViewError(null); }}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Edit className="h-6 w-6 text-primary" />
              Modifier l'utilisateur
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Modifiez les informations de l'utilisateur. Tous les champs marqués * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <form onSubmit={e => { e.preventDefault(); handleEditSubmit(); }} className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user-first-name" className="block mb-1 font-medium">Prénom *</label>
                    <Input id="user-first-name" value={editingUser.first_name} onChange={e => setEditingUser((u: any) => ({ ...u, first_name: e.target.value }))} required placeholder="Prénom" />
                  </div>
                  <div>
                    <label htmlFor="user-last-name" className="block mb-1 font-medium">Nom *</label>
                    <Input id="user-last-name" value={editingUser.last_name} onChange={e => setEditingUser((u: any) => ({ ...u, last_name: e.target.value }))} required placeholder="Nom" />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="user-email" className="block mb-1 font-medium">Email *</label>
                  <Input id="user-email" value={editingUser.email} onChange={e => setEditingUser((u: any) => ({ ...u, email: e.target.value }))} required type="email" placeholder="Email" />
                  <p className="text-xs text-muted-foreground mt-1">L'adresse email doit être unique.</p>
                </div>
              </div>
              {/* Section: Contact */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-lg">Contact</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user-phone" className="block mb-1 font-medium">Téléphone</label>
                    <Input id="user-phone" value={editingUser.phone || ''} onChange={e => setEditingUser((u: any) => ({ ...u, phone: e.target.value }))} placeholder="Téléphone" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Annuler</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? "Modification..." : "Enregistrer"}</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={!!resetUser} onOpenChange={() => setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <Input
                  value={resetPassword}
                  onChange={e => {
                    setResetPassword(e.target.value);
                    setResetPasswordStrength(getPasswordStrength(e.target.value));
                  }}
                  type={showResetPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="mt-1 py-3 px-4 text-base rounded-lg pr-10"
                  placeholder="Entrer le nouveau mot de passe..."
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowResetPassword(v => !v)}
                  aria-label={showResetPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showResetPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-16 rounded ${resetPasswordStrength.color}`}></div>
                <span className={`text-xs font-medium ${resetPasswordStrength.color === 'bg-red-400' ? 'text-red-600' : resetPasswordStrength.color === 'bg-yellow-400' ? 'text-yellow-700' : 'text-green-700'}`}>{resetPasswordStrength.label}</span>
              </div>
              {resetPassword && resetPasswordStrength.score < 4 && (
                <div className="text-xs text-red-500 mt-1">Le mot de passe doit comporter au moins 8 caractères, contenir une majuscule, une minuscule, un chiffre et un caractère spécial.</div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetUser(null)}>Annuler</Button>
              <Button type="submit">Réinitialiser</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent className="max-w-md border-t-4 border-red-600 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-7 w-7 text-red-600" />
            <DialogTitle className="text-lg font-bold text-red-700">Attention</DialogTitle>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            Êtes-vous sûr de vouloir archiver cet utilisateur ? Cela désactivera son compte et le retirera de la liste des utilisateurs.
          </p>
          <p className="text-sm font-semibold text-red-60 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-50" />
            Cette action est <span className="underline">irréversible</span>.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteUserId(null)}
              disabled={deleteLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(deleteUserId!)}
              disabled={deleteLoading}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold px-6"
            >
              {deleteLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Archiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add secondary modal for tickets */}
      <Dialog open={showTicketsModal} onOpenChange={setShowTicketsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tickets achetés</DialogTitle>
          </DialogHeader>
          {ticketsLoading ? (
            <div className="flex items-center gap-2 text-gray-500"><LoadingSpinner size="sm" /> Chargement des tickets...</div>
          ) : userTickets.length === 0 ? (
            <div className="text-gray-400 text-sm">Aucun ticket trouvé.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {userTickets.map((ticket, idx) => (
                <div key={ticket.id || idx} className="border rounded-lg p-3 flex flex-col text-sm bg-blue-50 shadow">
                  <div className="font-semibold text-blue-900 mb-1">{ticket.event?.name || 'Événement inconnu'}</div>
                  <div><span className="font-semibold">Type:</span> {ticket.ticket_type?.name || '-'}</div>
                  <div><span className="font-semibold">Numéro:</span> {ticket.ticket_number || '-'}</div>
                  <div><span className="font-semibold">Acheté le:</span> {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR') : '-'}</div>
                  <div><span className="font-semibold">Statut:</span> {ticket.is_active ? 'Actif' : 'Inactif'}</div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowTicketsModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add secondary modal for subscriptions */}
      <Dialog open={showSubsModal} onOpenChange={setShowSubsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonnements</DialogTitle>
          </DialogHeader>
          {subsLoading ? (
            <div className="flex items-center gap-2 text-gray-500"><LoadingSpinner size="sm" /> Chargement des abonnements...</div>
          ) : userSubscriptions.length === 0 ? (
            <div className="text-gray-400 text-sm">Aucun abonnement trouvé.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {userSubscriptions.map((sub, idx) => (
                <div key={sub.id || idx} className="border rounded-lg p-3 flex flex-col text-sm bg-green-50 shadow">
                  <div className="font-semibold text-green-900 mb-1">{sub.subscription_plan?.name || 'Plan inconnu'}</div>
                  <div><span className="font-semibold">Statut:</span> {sub.status || '-'}</div>
                  <div><span className="font-semibold">Début:</span> {sub.start_date ? new Date(sub.start_date).toLocaleDateString('fr-FR') : '-'}</div>
                  <div><span className="font-semibold">Fin:</span> {sub.end_date ? new Date(sub.end_date).toLocaleDateString('fr-FR') : '-'}</div>
                  <div><span className="font-semibold">Renouvellement auto:</span> {sub.auto_renew ? 'Oui' : 'Non'}</div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowSubsModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Creation Modal */}
      <UserCreationModal 
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onUserCreated={fetchUsers}
      />

      {/* Assign to Group Modal */}
      {/* <Dialog open={showAssignGroupModal} onOpenChange={setShowAssignGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner à un groupe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>Sélectionnez un groupe pour {getUserFullName(selectedUserForGroup)} :</div>
            <select className="w-full border rounded p-2" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
              <option value="">Sélectionner un groupe</option>
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAssignGroupModal(false)} variant="outline">Annuler</Button>
            <Button disabled={!selectedGroupId || assignGroupLoading} onClick={handleAssignGroup}>
              {assignGroupLoading ? "Assignation..." : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      {/* Assign Role Modal */}
      <Dialog open={showAssignRoleModal} onOpenChange={setShowAssignRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Rôles actuels</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(viewUser?.roles || viewUser?.user_roles || []).map((role: any, i: number) => (
                  <Badge key={i} className="bg-gray-100 text-gray-800 text-xs font-medium">
                    {typeof role === "string" ? role : role?.name || role?.code || "?"}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500">L'assignation de rôle est actuellement non supportée.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rôle à assigner</label>
            <select className="w-full border rounded p-2" value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
              <option value="">Sélectionner un rôle</option>
              {roles.map((role: any) => (
                  <option key={role.id} value={role.code}>{role.name}</option>
              ))}
            </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAssignRoleModal(false)} variant="outline">Annuler</Button>
            <Button disabled={!selectedRoleId || assignRoleLoading} onClick={handleAssignRole}>
              {assignRoleLoading ? "Assignation..." : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
  )
}

// Export the component directly like subscriptions page
export default AdminUsersPage; 