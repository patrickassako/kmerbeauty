import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-muted/30 border-t pt-16 pb-8">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo-desktop.png" alt="KMS-BEAUTY" className="h-12 w-auto object-contain" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            La première plateforme de réservation de services beauté et bien-être au Cameroun.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink href="#" icon={Facebook} />
                            <SocialLink href="#" icon={Instagram} />
                            <SocialLink href="#" icon={Twitter} />
                            <SocialLink href="#" icon={Linkedin} />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Découvrir</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/search?category=hair" className="hover:text-primary">Coiffure</Link></li>
                            <li><Link href="/search?category=nails" className="hover:text-primary">Onglerie</Link></li>
                            <li><Link href="/search?category=massage" className="hover:text-primary">Massage & Spa</Link></li>
                            <li><Link href="/search?category=barber" className="hover:text-primary">Barbier</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Entreprise</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/pro" className="hover:text-primary">Devenir Partenaire</Link></li>
                            <li><Link href="/search" className="hover:text-primary">Nos Services</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Télécharger l'app</h3>
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80 transition-opacity">
                                App Store
                            </div>
                            <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80 transition-opacity">
                                Google Play
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>© 2025 KMR-BEAUTY. Tous droits réservés.</p>
                    <div className="flex items-center gap-6">
                        <span>Cameroun 🇨🇲</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon }: { href: string, icon: any }) {
    return (
        <Link href={href} className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
            <Icon className="h-4 w-4" />
        </Link>
    );
}
