import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, LogIn, Calendar, ArrowLeft } from "lucide-react";

function isUserInactiveOrArchived(user: any) {
  return !user.is_active || (user.metadata && user.metadata.deletedAt);
}

export default function ArchivedUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchArchivedUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await usersApi.getUsers(1, 1000, {});
        let userList: any[] = response.data || [];
        // Fetch roles and details for each user
        await Promise.all(userList.map(async (user) => {
          try {
            const rolesRes = await usersApi.getUserRoles(user.id);
            user.roles = (rolesRes && rolesRes.data) ? rolesRes.data.map((r: any) => r.roleName || r.roleCode || r.roleId) : [];
          } catch {
            user.roles = [];
          }
          try {
            const userDetailsRes = await usersApi.getUser(user.id);
            const userDetails = userDetailsRes?.data ?? userDetailsRes ?? {};
            // @ts-expect-error: dynamic property access for camelCase
            user.last_login = userDetails.last_login || userDetails["lastLogin"] || null;
            // @ts-expect-error: dynamic property access for camelCase
            user.created_at = userDetails.created_at || userDetails["createdAt"] || null;
            // @ts-expect-error: dynamic property access for metadata
            user.metadata = userDetails.metadata || {};
          } catch {
            user.last_login = null;
            user.created_at = null;
            user.metadata = {};
          }
        }));
        setUsers(userList.filter(isUserInactiveOrArchived));
      } catch (err: any) {
        setError("Erreur lors du chargement des utilisateurs archivés.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArchivedUsers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background p-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/users")}> <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste des utilisateurs</Button>
        <h1 className="text-2xl font-bold ml-4">Utilisateurs archivés / inactifs</h1>
      </div>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-gray-500">Aucun utilisateur archivé ou inactif trouvé.</div>
      ) : (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr] items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
            <div>Utilisateur</div>
            <div>Rôles</div>
            <div>Statut</div>
            <div>Dernière connexion</div>
            <div>Archivé le</div>
          </div>
          {users.map((user) => {
            const userRoles = user.roles || user.user_roles || [];
            return (
              <div key={user.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_1.2fr_1.2fr] items-center border-b px-4 py-3">
                {/* User */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.first_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      `${user.first_name?.[0] || "U"}${user.last_name?.[0] || ""}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate max-w-[160px]" title={`${user.first_name} ${user.last_name}`}>{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[140px]" title={user.email}>
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
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
                  <Badge className="rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800">Inactif</Badge>
                </div>
                {/* Last Login */}
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <LogIn className="h-4 w-4 text-gray-400" />
                  {user.last_login ? new Date(user.last_login).toLocaleDateString("fr-FR") : "-"}
                </div>
                {/* Archived At */}
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {user.metadata && user.metadata.deletedAt ? new Date(user.metadata.deletedAt).toLocaleDateString("fr-FR") : "-"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// TODO: Add actions for restoring or permanently deleting users if needed 