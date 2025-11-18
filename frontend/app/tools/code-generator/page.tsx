"use client";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import CodeGenerator from '../../../components/CodeGenerator';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Wrench, Key } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CodeGeneratorPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex h-screen bg-background">
        <Sidebar type="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-primary/90 rounded-xl p-6 flex items-center gap-4 mb-8 shadow">
              <Wrench className="h-12 w-12 text-primary-foreground" />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground mb-1">Générateur de codes uniques</h1>
                <p className="text-primary-foreground/90">Ce programme a pour objectif de créer rapidement des lots de codes uniques pour les tickets et abonnements, afin de faciliter la génération des schémas QR qui seront utilisés dans l’étape suivante.</p>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Comment ça marche ?</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Renseignez les trois préfixes pour personnaliser vos codes.</li>
                <li>Indiquez le nombre de codes à générer (jusqu'à 100 000).</li>
                <li>Cliquez sur <span className="font-semibold">Générer</span>.</li>
                <li>Téléchargez vos codes au format texte.</li>
              </ol>
            </div>
            <Card className="mt-6 p-6">
              <CodeGenerator />
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 