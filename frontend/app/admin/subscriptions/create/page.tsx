"use client";

import React, { useState, useEffect } from "react";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { eventsApi } from "@/lib/api/events";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import UserSearchModal from "@/components/admin/UserSearchModal";

// Types
interface User {
  id: string;
  name: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}
interface Plan {
  id: string;
  name: string;
}
interface Event {
  id: string;
  name: string;
}
interface SubscriptionInput {
  user: User | null;
  qr_code: string;
  event: Event | null;
}
interface Result {
  subscription?: SubscriptionInput;
  accessRight?: { qr_code: string };
  error?: string;
  success: boolean;
}

export default function AdminSubscriptionCreate() {
  const [step, setStep] = useState<number>(1);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInput[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState<number>(-1);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const plansRes = await subscriptionsApi.getSubscriptionPlans();
        setPlans(plansRes || []);
        const eventsRes = await eventsApi.getEvents(1, 100); // adjust limit as needed
        setEvents(eventsRes.data || []);
      } catch (e) {
        toast({ title: "Error loading data", description: (e as any).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    const results: Result[] = [];
    for (const sub of subscriptions) {
      try {
        const res = await subscriptionsApi.createAdminSubscription({
          user_id: sub.user!.id,
          subscription_plan_id: plan!.id,
          qr_code: sub.qr_code,
          // Note: event_id is not used by the backend subscription creation
          // The subscription plan already defines which events are included
        });
        results.push({ ...res, success: true });
        toast({
          title: "Subscription Created",
          description: `User ${sub.user!.name} with QR ${sub.qr_code}`,
          variant: "default",
        });
      } catch (err: any) {
        results.push({ error: err.message, ...sub, success: false });
        toast({
          title: "Error Creating Subscription",
          description: err.message,
          variant: "destructive",
        });
      }
    }
    setResult(results);
    setLoading(false);
    setStep(5);
  };

  const updateSub = (idx: number, field: keyof SubscriptionInput, value: any) => {
    const updated = subscriptions.map((sub, i) =>
      i === idx ? { ...sub, [field]: value } : sub
    );
    setSubscriptions(updated);
  };

  const handleUserSelect = (user: any) => {
    if (currentUserIndex >= 0) {
      const userData = {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      };
      updateSub(currentUserIndex, "user", userData);
    }
  };

  const allValid = subscriptions.length > 0 && subscriptions.every(
    (sub, idx, arr) =>
      sub.user &&
      sub.qr_code &&
      arr.findIndex(s => s.qr_code === sub.qr_code) === idx
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Créer un abonnement"
            description="Créez de nouveaux abonnements pour les utilisateurs."
          >
            <Link href="/admin/subscriptions">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux abonnements
              </Button>
            </Link>
          </PageHeader>

          <div className="max-w-4xl mx-auto mt-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Étape {step} sur 5</h2>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        stepNum <= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {stepNum}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {loading && <LoadingSpinner />}
            
            {!loading && step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner un type d'abonnement</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    aria-label="Select subscription plan"
                    value={plan ? plan.id : ""}
                    onChange={e => {
                      const selected = plans.find(p => p.id === e.target.value) || null;
                      setPlan(selected);
                    }}
                  >
                    <option value="">Sélectionner un plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="mt-4">
                    <Button disabled={!plan} onClick={() => setStep(2)}>Suivant</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!loading && step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner la quantité</CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    aria-label="Select quantity"
                    onChange={e => setQuantity(Math.max(1, Math.min(1000, Number(e.target.value))))}
                  />
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                    <Button
                      onClick={() => {
                        setSubscriptions(Array(quantity).fill(null).map(() => ({ user: null, qr_code: "", event: null })));
                        setStep(3);
                      }}
                    >
                      Suivant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!loading && step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails des abonnements</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptions.map((sub, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3">Abonnement {idx + 1}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur:</label>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setCurrentUserIndex(idx);
                              setShowUserModal(true);
                            }}
                            className="w-full justify-start"
                          >
                            {sub.user ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{sub.user.first_name} {sub.user.last_name}</span>
                                <span className="text-gray-500">({sub.user.email})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Sélectionner un utilisateur</span>
                              </div>
                            )}
                          </Button>
                        </div>
                        <div>
                          <label htmlFor={`qr-code-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Code QR:
                          </label>
                          <input
                            id={`qr-code-${idx}`}
                            type="text"
                            value={sub.qr_code}
                            onChange={e => updateSub(idx, "qr_code", e.target.value)}
                            placeholder="Entrer un code QR unique"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            aria-label="QR code"
                          />
                          {subscriptions.filter(s => s.qr_code === sub.qr_code).length > 1 && (
                            <span className="text-red-500 text-xs">Le code QR doit être unique</span>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`event-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Événement (optionnel):
                          </label>
                          <select
                            id={`event-${idx}`}
                            value={sub.event ? sub.event.id : ""}
                            onChange={e => {
                              const event = events.find(ev => ev.id === e.target.value) || null;
                              updateSub(idx, "event", event);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            aria-label="Select event"
                          >
                            <option value="">Sélectionner un événement (optionnel)</option>
                            {events.map(ev => (
                              <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            L'événement est optionnel. Le type d'abonnement définit déjà les événements inclus.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                    <Button disabled={!allValid} onClick={() => setStep(4)}>Suivant</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!loading && step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Révision et confirmation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {subscriptions.map((sub, idx) => (
                      <li key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <strong>Abonnement {idx + 1}:</strong> Utilisateur: {sub.user ? sub.user.name : "-"}, 
                        QR: {sub.qr_code}, Événement: {sub.event ? sub.event.name : "Aucun (optionnel)"}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setStep(3)}>Retour</Button>
                    <Button disabled={loading} onClick={handleSubmit}>
                      {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                      Créer les abonnements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!loading && step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {result.map((res, idx) => (
                      <li key={idx} className={`p-3 rounded-lg ${res.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        {res.success ? (
                          <div>
                            <div className="text-green-800 font-medium">
                              Succès: Utilisateur {res.subscription?.user?.name}, QR: {res.accessRight?.qr_code}
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-800">
                            Erreur: {res.error}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Link href="/admin/subscriptions">
                      <Button>Retour à la liste des abonnements</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        onSelect={handleUserSelect}
        selectedUser={null}
      />
    </div>
  );
} 