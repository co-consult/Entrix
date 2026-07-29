"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import VenueSetupWizard from "@/components/admin/VenueSetupWizard";

export default function VenueResumeSetupPage() {
  const params = useParams();
  const venueId = params.venueId as string;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full py-6">
          <PageHeader
            title="Continuer la configuration"
            description="Reprenez la configuration du lieu à l'étape souhaitée."
          />
          <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>}>
            <VenueSetupWizard venueId={venueId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
