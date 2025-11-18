"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, User, MessageCircle } from "lucide-react"
import { contactApi } from '@/lib/api/contact';
import { useRef, useEffect, useState } from "react"

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [logoPos, setLogoPos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)
  const illustrationRef = useRef<HTMLDivElement>(null)
  // Use a single dark gray color for all splashes
  const SPLASH_COLOR = '#22272e'; // dark gray
  // Splash state (add color)
  const [splashes, setSplashes] = useState<Array<{id: number, x: number, y: number, created: number, color: string, mouse: boolean}>>([])
  const splashId = useRef(0)
  const CARD_WIDTH = 520; // px (matches new width)
  const CARD_HEIGHT = 520; // px (matches new height)

  // Animation loop to fade out splashes and drop random drops
  useEffect(() => {
    let raf: number;
    let lastDrop = Date.now();
    function animate() {
      const now = Date.now();
      setSplashes(prev => prev.filter(s => now - s.created < 2400)); // 2.4s fade
      // Drop random drops every 0.7-1.5s
      if (now - lastDrop > 700 + Math.random() * 800) {
        lastDrop = now;
        setSplashes(prev => [
          ...prev,
          {
            id: splashId.current++,
            x: Math.random() * CARD_WIDTH,
            y: Math.random() * CARD_HEIGHT,
            created: now,
            color: SPLASH_COLOR,
            mouse: false
          }
        ]);
      }
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // On mouse move, show only one splash at the cursor (no tail, just one splash per event)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!illustrationRef.current) return;
    const rect = illustrationRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CARD_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CARD_HEIGHT;
    setSplashes(prev => [
      // Keep only non-mouse (random drop) splashes
      ...prev.filter(s => !s.mouse),
      {
        id: splashId.current++,
        x,
        y,
        created: Date.now(),
        color: SPLASH_COLOR,
        mouse: true
      }
    ]);
  };
  const handleMouseLeave = () => {};

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await contactApi.sendContactRequest(form)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'envoi du message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 flex flex-col md:flex-row justify-center items-center min-h-[60vh] gap-8 md:gap-16">
      {/* Left: Contact Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center">
        <Card className="w-full max-w-2xl min-h-[520px] shadow-lg p-2 md:p-8 flex flex-col justify-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Nous contacter</CardTitle>
            <p className="text-muted-foreground text-center mt-2 text-sm">Des questions, une demande ? Remplissez le formulaire ci-dessous et notre équipe vous répondra rapidement.</p>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert variant="default" className="mb-4 flex items-center gap-2 justify-center">
                <CheckCircle className="text-green-600 w-5 h-5" />
                <AlertDescription>
                  Merci pour votre message ! Nous vous répondrons dès que possible.
                </AlertDescription>
              </Alert>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom complet"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      required
                      aria-label="Nom complet"
                      className="pl-10 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      required
                      aria-label="Email"
                      className="pl-10 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                </div>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sujet"
                    value={form.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                    required
                    aria-label="Sujet"
                    className="pl-10 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>
                <Textarea
                  placeholder="Votre message..."
                  value={form.message}
                  onChange={e => handleChange('message', e.target.value)}
                  required
                  rows={5}
                  aria-label="Votre message"
                  className="focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                <Button
                  type="submit"
                  className="w-full font-semibold text-base py-3 bg-primary hover:bg-primary/90 transition focus:ring-2 focus:ring-primary focus:outline-none"
                  disabled={loading}
                  aria-label="Envoyer le message"
                >
                  {loading ? 'Envoi...' : 'Envoyer'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Right: Animated Illustration */}
      <div className="hidden md:flex w-full md:w-1/2 justify-center items-center">
        <div
          ref={illustrationRef}
          className="rounded-xl bg-gradient-to-br from-primary/5 to-secondary/10 p-10 flex flex-col items-center justify-center shadow-lg w-full max-w-2xl min-h-[520px] relative overflow-hidden"
          style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.10), inset 0 2px 24px 0 #fff6', width: 520, height: 520 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Splash effects on mouse movement */}
          <div className="absolute left-0 top-0 w-full h-full z-0 pointer-events-none">
            {splashes.map(splash => {
              const now = Date.now();
              const age = now - splash.created;
              const opacity = Math.max(0, 0.35 * (1 - age / 2400));
              const blur = 6;
              const scale = 1 + 0.25 * (age / 2400);
              const color = SPLASH_COLOR;
              return (
                <div
                  key={splash.id}
                  className="absolute"
                  style={{
                    width: 90 * scale,
                    height: 70 * scale,
                    left: splash.x - (90 * scale) / 2,
                    top: splash.y - (70 * scale) / 2,
                    opacity,
                    filter: `blur(${blur}px)`,
                    background: `radial-gradient(ellipse 60% 80% at 50% 50%, #fff 0%, #fff8 30%, ${color} 60%, ${color}99 85%, transparent 100%)`,
                    borderRadius: '50% 60% 55% 65% / 60% 55% 65% 50%',
                    pointerEvents: 'none',
                    transition: 'opacity 0.5s',
                    boxShadow: `0 0 0 0 ${color}, 0 0 32px 12px ${color}99, 0 0 64px 32px ${color}55`,
                  }}
                />
              );
            })}
          </div>
          {/* Writing card overlay centered */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className="backdrop-blur-xl bg-white/50 dark:bg-black/40 border border-white/30 dark:border-white/10 shadow-2xl rounded-2xl px-8 py-7 w-full max-w-md relative overflow-hidden"
              style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 2px 24px 0 #fff6' }}
            >
              <div className="flex justify-center mb-3">
                <MessageCircle className="w-14 h-14 text-primary drop-shadow-md" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2 text-center text-primary tracking-tight drop-shadow-sm">Nous sommes à votre écoute</h2>
              <p className="text-center text-muted-foreground max-w-xs mx-auto text-base font-light leading-relaxed drop-shadow-sm">Notre équipe est disponible pour répondre à toutes vos questions, suggestions ou demandes d'assistance. N'hésitez pas à nous écrire !</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 