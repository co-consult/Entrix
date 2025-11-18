import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Globe } from "lucide-react"

// Ajouter l'icône TikTok SVG
const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" height="1.5em" width="1.5em" {...props}>
    <path d="M12.75 2h2.25a.75.75 0 0 1 .75.75v2.25a4.5 4.5 0 0 0 4.5 4.5h.75A.75.75 0 0 1 22 10.25v2.25a.75.75 0 0 1-.75.75h-1.5v3.25A5.75 5.75 0 0 1 14 22a5.75 5.75 0 0 1-5.75-5.75v-5.5A.75.75 0 0 1 9 10h2.25a.75.75 0 0 1 .75.75v5.5a2.25 2.25 0 1 0 2.25-2.25.75.75 0 0 1-.75-.75V2.75A.75.75 0 0 1 12.75 2z" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Entrix Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">Entrix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La plateforme de référence pour la gestion d'événements et la billetterie en Tunisie et au Maghreb.
            </p>
            <div className="flex space-x-4 mt-2">
              <Link href="https://www.css.org.tn" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
                <Globe className="h-6 w-6" />
              </Link>
              <Link href="https://www.facebook.com/OfficielCSS" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://www.youtube.com/CSSofficiel" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
                <Youtube className="h-6 w-6" />
              </Link>
              <Link href="https://www.instagram.com/club_sportif.sfaxien/" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="https://www.tiktok.com/@cssofficiel" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
                <TikTokIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-muted-foreground hover:text-foreground">
                  Événements
                </Link>
              </li>
              <li>
                <Link href="/venues" className="text-muted-foreground hover:text-foreground">
                  Lieux
                </Link>
              </li>
              <li>
                <Link href="/organizers" className="text-muted-foreground hover:text-foreground">
                  Organisateurs
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Nous contacter
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>bureaudordre@css.org.tn</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+216 74 497 138</span>
              </div>
              <Link href="https://www.google.com/maps/place/Club+Sportif+Sfaxien/@34.72614,10.7505481,17z/data=!3m1!4b1!4m6!3m5!1s0x13002cd839f07f35:0xfeac544c7f268c89!8m2!3d34.7261356!4d10.753123!16s%2Fg%2F1hc33dzvn?entry=ttu&g_ep=EgoyMDI1MDcxNS4xIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <MapPin className="h-4 w-4" />
                <span>Sfax, Tunisie</span>
              </Link>
            </div>
          </div>

          {/* CSS Official Info */}
          
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© {currentYear} Entrix. Tous droits réservés.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Politique de confidentialité
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}