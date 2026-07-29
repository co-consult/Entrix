"use client";

import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import VenueSetupWizard from "@/components/admin/VenueSetupWizard";

export default function VenueSetupPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full py-6">
          <PageHeader
            title="Assistant configuration lieu"
            description="Créez un lieu, sa cartographie, ses zones, puis un abonnement saison ou un événement."
          />
          <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}>
            <VenueSetupWizard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
