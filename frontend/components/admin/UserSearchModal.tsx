"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Plus, Search, Eye, EyeOff } from "lucide-react";
import type { User as UserType } from "@/types";
import { usersApi } from "@/lib/api/users";

interface UserSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (user: UserType) => void;
  selectedUser?: UserType | null;
}

function NewUserModal({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (user: UserType) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Create user via API
      const response = await usersApi.createUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        is_active: true
      } as any);
      
      console.log('API response:', response);
      console.log('Response data:', response.data);
      
      // Handle both response.data and direct response
      const user = response.data || response;
      console.log('User object to pass to onCreate:', user);
      
      onCreate(user);
      onOpenChange(false);
      setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || "Erreur lors de la création de le Supporter ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-2xl">
        {/* Removed DialogHeader and DialogTitle for a cleaner modal without the black top section */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Prénom
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  placeholder="Entrez le prénom"
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nom
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  placeholder="Entrez le nom"
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <input 
                type="email" 
                required 
                placeholder="exemple@email.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required 
                placeholder="Entrez le mot de passe"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all duration-200 placeholder:text-gray-400 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 h-12 bg-black hover:bg-gray-900 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Création...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Créer</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UserSearchModal({ 
  open, 
  onOpenChange, 
  onSelect, 
  selectedUser 
}: UserSearchModalProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users); // Affiche tous les utilisateurs si champ vide
    } else {
      const filtered = users
        .filter(user => user && typeof user === 'object')
        .filter(user => {
          const matches = (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
          return matches;
        });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch real users from the backend
      const response = await usersApi.getUsers(1, 100); // Get first 100 users
      const usersData = response.data || [];
      console.log('Fetched users:', usersData);
      
      // Filter out any invalid user objects
      const validUsers = usersData.filter(user => 
        user && 
        typeof user === 'object' && 
        user.id && 
        (user.first_name || user.last_name || user.email)
      );
      
      console.log('Valid users:', validUsers);
      setUsers(validUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to empty array if API fails
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    onSelect(user);
    onOpenChange(false);
  };

  const handleCreateNewUser = () => {
    setShowNewUserModal(true);
  };

  const handleUserCreated = (user: UserType) => {
    console.log('Created user:', user);
    // Validate the user object before adding it
    if (user && typeof user === 'object' && user.id) {
      setUsers(prev => [user, ...prev]);
      setSearchTerm(""); // Clear search so all users show
      onSelect(user);    // This updates selectedUser in the parent
      setShowNewUserModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      setTimeout(() => onOpenChange(false), 500); // Close the main modal after 500ms
    } else {
      console.error('Invalid user object received:', user);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sélectionner un supporter
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Supporter anonyme */}
            <div className="rounded-lg border bg-white divide-y divide-gray-100 shadow-sm">
              <div
                onClick={() => {
                  onSelect({
                    id: 'cmd6ofjy80002t6h0cfcnl5t2',
                    first_name: 'Supporter',
                    last_name: 'Anonyme',
                    email: 'anonymous@system.local',
                    is_active: true,
                    created_at: '',
                    updated_at: ''
                  });
                  onOpenChange(false);
                }}
                className={`flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition hover:bg-gray-50 ${selectedUser?.id === 'cmd6ofjy80002t6h0cfcnl5t2' ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Supporter anonyme</div>
                    <div className="text-sm text-gray-500">Aucun e-mail</div>
                  </div>
                </div>
                {selectedUser?.id === 'cmd6ofjy80002t6h0cfcnl5t2' && (
                  <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                )}
                <Badge variant="secondary" className="text-xs">Anonyme</Badge>
              </div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700">
                    Supporter créé et sélectionné avec succès !
                  </span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2">Chargement des supporters...</span>
              </div>
            ) : (
              <div className="rounded-lg border bg-white divide-y divide-gray-100 shadow-sm max-h-[400px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Aucun supporter trouvé</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.first_name || ''} {user.last_name || ''}
                          </div>
                          <div className="text-sm text-gray-500">{user.email || 'Aucun email'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedUser?.id === user.id && (
                          <Badge variant="secondary" className="text-xs">Sélectionné</Badge>
                        )}
                        <Badge 
                          variant={user.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <NewUserModal open={showNewUserModal} onOpenChange={setShowNewUserModal} onCreate={handleUserCreated} />
    </>
  );
}