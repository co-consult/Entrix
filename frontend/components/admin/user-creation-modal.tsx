"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, User, Phone, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usersApi } from "@/lib/api/users"

interface UserCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function UserCreationModal({ open, onOpenChange, onUserCreated }: UserCreationModalProps) {
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_active: true,
    password: '',
  })
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [addPasswordStrength, setAddPasswordStrength] = useState<{score: number, label: string, color: string}>({score: 0, label: '', color: ''})
  const { toast } = useToast()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    
    // Password validation - simplified to match backend requirements
    const password = newUser.password;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    if (!requirements.length || !requirements.uppercase || !requirements.lowercase || !requirements.numbers || !requirements.symbols) {
      setAddUserError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }
    
    if (!newUser.first_name.trim() || !newUser.last_name.trim() || !newUser.email.trim()) {
      setAddUserError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (newUser.phone && newUser.phone.trim() !== "") {
      // Phone validation: only allow digits, spaces, dashes, parentheses, and optional leading +
      const phoneRegex = /^\+?[0-9\s\-()]{6,20}$/;
      if (!phoneRegex.test(newUser.phone.trim())) {
        setAddUserError("Veuillez entrer un numéro de téléphone valide.");
        return;
      }
    }
    setAddUserLoading(true);
    try {
      const payload: any = {
        email: newUser.email.trim(),
        password: newUser.password,
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        email_verified: null,
        phone_verified: null,
      };
      if (newUser.phone && newUser.phone.trim() !== "") {
        payload.phone = newUser.phone.trim();
      }
      const created = await usersApi.createUser(payload);
      // Safely extract user ID from response
      const userId = created?.data?.id;
      if (!userId) {
        setAddUserError("Erreur: l'utilisateur n'a pas pu être créé (ID manquant)");
        setAddUserLoading(false);
        return;
      }
      if (newUser.is_active) {
        await usersApi.activateUser(userId);
      } else {
        await usersApi.deactivateUser(userId);
      }
      toast({ title: "Utilisateur ajouté avec succès" });
      onOpenChange(false);
      setNewUser({ first_name: '', last_name: '', email: '', phone: '', is_active: true, password: '' });
      onUserCreated();
    } catch (err: any) {
      let errorMsg = err?.message || "Erreur lors de l'ajout";
      if (errorMsg.includes('Unique constraint failed') && errorMsg.includes('email')) {
        errorMsg = "Un utilisateur avec cet email existe déjà.";
      }
      setAddUserError(errorMsg);
      toast({ title: "Erreur lors de l'ajout", description: errorMsg, variant: "destructive" });
    } finally {
      setAddUserLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <UserPlus className="h-6 w-6 text-primary" />
            Ajouter un utilisateur
          </DialogTitle>
          <DialogDescription className="text-base mt-1 mb-4">
            Créez un nouveau compte utilisateur. Tous les champs marqués * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {addUserError && (
            <Alert variant="destructive">
              <AlertDescription>{addUserError}</AlertDescription>
            </Alert>
          )}
          {/* Section: Informations Générales */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-lg">Informations Générales</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-user-first-name" className="block mb-1 font-medium">Prénom *</label>
                <Input id="new-user-first-name" value={newUser.first_name} onChange={e => setNewUser(u => ({ ...u, first_name: e.target.value }))} required placeholder="Prénom" />
              </div>
              <div>
                <label htmlFor="new-user-last-name" className="block mb-1 font-medium">Nom *</label>
                <Input id="new-user-last-name" value={newUser.last_name} onChange={e => setNewUser(u => ({ ...u, last_name: e.target.value }))} required placeholder="Nom" />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="new-user-email" className="block mb-1 font-medium">Email *</label>
              <Input id="new-user-email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required type="email" placeholder="Email" />
              <p className="text-xs text-muted-foreground mt-1">L'adresse email doit être unique.</p>
            </div>
          </div>
          {/* Section: Contact & Sécurité */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-lg">Contact & Sécurité</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-user-phone" className="block mb-1 font-medium">Téléphone</label>
                <Input id="new-user-phone" value={newUser.phone} onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))} placeholder="Téléphone" />
              </div>
              <div>
                <label htmlFor="new-user-status" className="block mb-1 font-medium">Statut</label>
                <select
                  id="new-user-status"
                  className="w-full border rounded px-3 py-2"
                  value={newUser.is_active ? 'active' : 'inactive'}
                  onChange={e => setNewUser(u => ({ ...u, is_active: e.target.value === 'active' }))}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="new-user-password" className="block mb-1 font-medium">Mot de passe *</label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  value={newUser.password}
                  onChange={e => {
                    setNewUser(u => ({ ...u, password: e.target.value }));
                    setAddPasswordStrength(getPasswordStrength(e.target.value));
                  }}
                  required
                  type={showAddPassword ? "text" : "password"}
                  minLength={6}
                  className="pr-10"
                  placeholder="Mot de passe"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowAddPassword(v => !v)}
                  aria-label={showAddPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showAddPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-16 rounded ${addPasswordStrength.color}`}></div>
                <span className={`text-xs font-medium ${addPasswordStrength.color === 'bg-red-400' ? 'text-red-600' : addPasswordStrength.color === 'bg-yellow-400' ? 'text-yellow-700' : 'text-green-700'}`}>{addPasswordStrength.label}</span>
              </div>
              {newUser.password && (
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${newUser.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>Au moins 8 caractères</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newUser.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>Une majuscule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/[a-z]/.test(newUser.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>Une minuscule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/\d/.test(newUser.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>Un chiffre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newUser.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>Un caractère spécial</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={addUserLoading}>{addUserLoading ? 'Ajout...' : 'Ajouter'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 