"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Smartphone, Key, CheckCircle, Copy } from "lucide-react"
import apiClient from "@/lib/api"

export default function MfaSetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedProvider, setSelectedProvider] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session) {
      router.push("/auth/login")
    }
  }, [session, router])

  const handleProviderSelect = async (provider: string) => {
    setSelectedProvider(provider)
    setError("")
    setIsLoading(true)

    try {
      const response = await apiClient.setupMfa({ 
        provider, 
        phoneNumber: provider === 'sms' ? phoneNumber : undefined 
      })
      
      if (provider === 'totp') {
        setQrCode(response.qrCode)
        setSecret(response.secret)
      }
      
      setStep(2)
    } catch (error: any) {
      setError(error.message || "Erreur lors de la configuration MFA")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.verifyMfa({
        provider: selectedProvider,
        code: verificationCode
      })

      if (response.backupCodes) {
        setBackupCodes(response.backupCodes)
        setStep(3)
      } else {
        router.push("/dashboard?message=MFA configuré avec succès")
      }
    } catch (error: any) {
      setError(error.message || "Code de vérification incorrect")
    } finally {
      setIsLoading(false)
    }
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Configuration MFA</CardTitle>
            <CardDescription>
              Renforcez la sécurité de votre compte avec l'authentification à deux facteurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Choisissez votre méthode MFA</Label>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleProviderSelect('totp')}
                  disabled={isLoading}
                >
                  <Key className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Application d'authentification</div>
                    <div className="text-sm text-muted-foreground">
                      Google Authenticator, Authy, etc.
                    </div>
                  </div>
                </Button>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => phoneNumber ? handleProviderSelect('sms') : null}
                    disabled={isLoading || !phoneNumber}
                  >
                    <Smartphone className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">SMS</div>
                      <div className="text-sm text-muted-foreground">
                        Code envoyé par SMS
                      </div>
                    </div>
                  </Button>
                  
                  <Input
                    placeholder="Numéro de téléphone (+216 XX XXX XXX)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                Configurer plus tard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Vérification MFA</CardTitle>
            <CardDescription>
              {selectedProvider === 'totp' 
                ? "Scannez le QR code avec votre application d'authentification"
                : "Entrez le code reçu par SMS"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {selectedProvider === 'totp' && qrCode && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Clé secrète (si vous ne pouvez pas scanner):</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <Button 
              onClick={handleVerification} 
              className="w-full" 
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? "Vérification..." : "Vérifier"}
            </Button>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)}
                className="text-sm text-muted-foreground"
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>MFA configuré</CardTitle>
            <CardDescription>
              Sauvegardez ces codes de récupération dans un endroit sûr
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Ces codes vous permettront d'accéder à votre compte si vous perdez votre appareil MFA.
                Chaque code ne peut être utilisé qu'une seule fois.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={copyBackupCodes} variant="outline" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copier les codes
            </Button>

            <Button asChild className="w-full">
              <Link href="/dashboard">Terminer</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}