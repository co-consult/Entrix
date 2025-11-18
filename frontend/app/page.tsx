import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Ticket, Users, Shield, BarChart3 } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      name: "Gestion d'Événements",
      description: "Créez et gérez vos événements en toute simplicité avec notre interface intuitive.",
      icon: Calendar,
    },
    {
      name: "Billetterie Intégrée",
      description: "Système de billetterie complet avec QR codes sécurisés et contrôle d'accès.",
      icon: Ticket,
    },
    {
      name: "Gestion des Lieux",
      description: "Configurez vos venues avec plans de salle détaillés et gestion des zones.",
      icon: MapPin,
    },
    {
      name: "Gestion des Participants",
      description: "Organisez vos équipes, artistes et intervenants efficacement.",
      icon: Users,
    },
    {
      name: "Sécurité Avancée",
      description: "Contrôle d'accès en temps réel et système de sécurité multicouches.",
      icon: Shield,
    },
    {
      name: "Analytics & Reporting",
      description: "Tableaux de bord détaillés et rapports pour optimiser vos événements.",
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Plateforme de Gestion d'Événements</h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Entrix est la solution complète pour organiser, gérer et promouvoir vos événements en Tunisie et au
              Maghreb. De la billetterie au contrôle d'accès, tout est intégré.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/events">Découvrir les Événements</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/auth/register">Créer un Compte</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Fonctionnalités Complètes</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Tout ce dont vous avez besoin pour vos événements
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Une plateforme moderne et intuitive qui couvre tous les aspects de la gestion d'événements, de la
              planification à l'analyse post-événement.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                    <feature.icon className="h-5 w-5 flex-none text-primary" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Prêt à commencer ?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Rejoignez les organisateurs qui font confiance à Entrix pour leurs événements. Créez votre compte et
              organisez votre premier événement dès aujourd'hui.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/auth/register">Commencer Gratuitement</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/contact">Nous Contacter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Entrix en chiffres</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Une plateforme qui grandit avec la communauté événementielle
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-muted p-8">
                <dt className="text-sm font-semibold leading-6 text-muted-foreground">Événements Organisés</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight">1,000+</dd>
              </div>
              <div className="flex flex-col bg-muted p-8">
                <dt className="text-sm font-semibold leading-6 text-muted-foreground">Billets Vendus</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight">50,000+</dd>
              </div>
              <div className="flex flex-col bg-muted p-8">
                <dt className="text-sm font-semibold leading-6 text-muted-foreground">Organisateurs Actifs</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight">200+</dd>
              </div>
              <div className="flex flex-col bg-muted p-8">
                <dt className="text-sm font-semibold leading-6 text-muted-foreground">Lieux Partenaires</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight">50+</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  )
}
