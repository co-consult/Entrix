import { Wrench, Construction, Clock, Code } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UnderDevelopmentProps {
  title?: string
  description?: string
  estimatedCompletion?: string
  features?: string[]
}

export function UnderDevelopment({ 
  title = "Page en cours de développement",
  description = "Cette fonctionnalité est actuellement en cours de développement et sera bientôt disponible.",
  estimatedCompletion = "Bientôt disponible",
  features = []
}: UnderDevelopmentProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Construction className="h-20 w-20 text-blue-600 animate-pulse" />
                <Wrench className="h-8 w-8 text-orange-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
            <p className="text-xl text-gray-600">{description}</p>
          </div>

          {/* Status Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-blue-700">
                <Clock className="h-5 w-5" />
                Statut du développement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
                <Code className="h-5 w-5" />
                {estimatedCompletion}
              </div>
              
              {features.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Fonctionnalités prévues :</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin">
                Retour au tableau de bord
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">
                Gérer les utilisateurs
              </Link>
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progression</span>
              <span>25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 