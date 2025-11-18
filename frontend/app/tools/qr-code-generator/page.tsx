"use client";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import QRCodeGenerator from '../../../components/QRCodeGenerator';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function QRCodeGeneratorPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex h-screen bg-background">
        <Sidebar type="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-primary/90 rounded-xl p-6 flex items-center gap-4 mb-8 shadow">
              <QrCode className="h-12 w-12 text-primary-foreground" />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground mb-1">Générateur de QR Codes</h1>
                <p className="text-primary-foreground/90">Transformez vos codes uniques en QR codes scannables. Importez un fichier texte de codes, visualisez les QR codes générés, puis téléchargez-les tous en un clic.</p>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Comment ça marche ?</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Importez un fichier texte contenant vos codes (un code par ligne).</li>
                <li>Prévisualisez les QR codes générés.</li>
                <li>Téléchargez tous les QR codes au format ZIP.</li>
              </ol>
            </div>
            <Card className="mt-6 p-6">
              <QRCodeGenerator />
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 