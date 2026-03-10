import { Shield, Lock, Eye, Database, UserCheck, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Politique de confidentialité | KMR-BEAUTY",
    description: "Découvrez comment KMR-BEAUTY collecte, utilise et protège vos données personnelles.",
};

const sections = [
    {
        icon: Database,
        title: "Données collectées",
        content: [
            {
                subtitle: "Données que vous nous fournissez",
                text: "Lors de votre inscription ou utilisation de nos services, nous collectons : votre nom et prénom, adresse e-mail, numéro de téléphone, adresse postale, photo de profil (optionnelle), et informations de paiement (traitées de manière sécurisée par nos partenaires de paiement).",
            },
            {
                subtitle: "Données collectées automatiquement",
                text: "Nous collectons automatiquement certaines informations lors de votre utilisation de notre plateforme : adresse IP, type de navigateur et d'appareil, pages visitées et durée de navigation, données de localisation (avec votre consentement), et données d'utilisation et de performance.",
            },
        ],
    },
    {
        icon: Eye,
        title: "Utilisation de vos données",
        content: [
            {
                subtitle: "Fourniture de nos services",
                text: "Vos données sont utilisées pour gérer votre compte, traiter vos réservations, faciliter les paiements, vous mettre en relation avec des prestataires de services beauté, et vous envoyer des confirmations et rappels de rendez-vous.",
            },
            {
                subtitle: "Amélioration de la plateforme",
                text: "Nous analysons les données d'utilisation (de manière agrégée et anonymisée) pour améliorer notre plateforme, personnaliser votre expérience, et développer de nouveaux services adaptés à vos besoins.",
            },
            {
                subtitle: "Communications",
                text: "Avec votre consentement, nous pouvons vous envoyer des newsletters, offres promotionnelles, et actualités concernant nos services. Vous pouvez vous désabonner à tout moment.",
            },
        ],
    },
    {
        icon: UserCheck,
        title: "Partage de vos données",
        content: [
            {
                subtitle: "Avec les prestataires de services",
                text: "Pour faciliter vos réservations, nous partageons certaines informations (nom, contact, détails de la réservation) avec les prestataires de services beauté concernés.",
            },
            {
                subtitle: "Partenaires techniques",
                text: "Nous faisons appel à des prestataires techniques de confiance (hébergement, paiement, analytique) qui traitent vos données dans le strict cadre de nos instructions et dans le respect de la réglementation en vigueur.",
            },
            {
                subtitle: "Obligations légales",
                text: "Nous pouvons divulguer vos données si la loi l'exige, dans le cadre d'une procédure judiciaire, ou pour protéger nos droits, notre propriété ou la sécurité de nos utilisateurs.",
            },
        ],
    },
    {
        icon: Lock,
        title: "Sécurité de vos données",
        content: [
            {
                subtitle: "Mesures de protection",
                text: "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Cela inclut le chiffrement SSL/TLS de toutes les communications, le stockage sécurisé des données, et des contrôles d'accès stricts.",
            },
            {
                subtitle: "Conservation des données",
                text: "Nous conservons vos données personnelles aussi longtemps que nécessaire pour vous fournir nos services et respecter nos obligations légales. Vous pouvez demander la suppression de votre compte à tout moment.",
            },
        ],
    },
    {
        icon: Shield,
        title: "Vos droits",
        content: [
            {
                subtitle: "Droits d'accès et de rectification",
                text: "Vous avez le droit d'accéder à vos données personnelles et de les rectifier à tout moment depuis votre espace personnel ou en nous contactant directement.",
            },
            {
                subtitle: "Droit à l'effacement",
                text: "Vous pouvez demander la suppression de vos données personnelles, sous réserve de nos obligations légales de conservation.",
            },
            {
                subtitle: "Droit à la portabilité",
                text: "Vous pouvez demander à recevoir vos données dans un format structuré et lisible par machine.",
            },
            {
                subtitle: "Droit d'opposition",
                text: "Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct à tout moment.",
            },
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero */}
            <div className="bg-black text-white py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Shield className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Politique de confidentialité
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Votre vie privée est notre priorité. Découvrez comment nous collectons,
                        utilisons et protégeons vos données personnelles.
                    </p>
                    <p className="mt-6 text-sm text-gray-400">
                        Dernière mise à jour : 10 mars 2026
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">

                {/* Intro */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4">Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                        KMR-BEAUTY (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;la Plateforme&quot;) s&apos;engage à protéger
                        la vie privée de ses utilisateurs. La présente Politique de confidentialité décrit
                        comment nous collectons, utilisons, partageons et protégeons vos informations
                        personnelles lorsque vous utilisez notre plateforme de réservation de services
                        beauté et bien-être.
                    </p>
                    <p className="text-gray-600 leading-relaxed mt-4">
                        En utilisant KMR-BEAUTY, vous acceptez les pratiques décrites dans cette politique.
                        Si vous n&apos;acceptez pas ces conditions, nous vous invitons à ne pas utiliser nos services.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-black rounded-xl">
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold">{index + 1}. {section.title}</h2>
                                </div>
                                <div className="space-y-5">
                                    {section.content.map((item, i) => (
                                        <div key={i}>
                                            <h3 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h3>
                                            <p className="text-gray-600 leading-relaxed">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Cookies */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold mb-4">6. Cookies et technologies similaires</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Nous utilisons des cookies et technologies similaires pour améliorer votre expérience,
                        mémoriser vos préférences, analyser l&apos;utilisation de notre plateforme et vous proposer
                        des contenus personnalisés.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                        {[
                            { type: "Essentiels", desc: "Nécessaires au fonctionnement de la plateforme (session, authentification)." },
                            { type: "Analytiques", desc: "Nous aident à comprendre comment vous utilisez notre site pour l'améliorer." },
                            { type: "Marketing", desc: "Utilisés pour vous proposer des contenus et offres pertinents (avec votre consentement)." },
                        ].map((cookie) => (
                            <div key={cookie.type} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-sm mb-2">{cookie.type}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{cookie.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Minors */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold mb-4">7. Mineurs</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Nos services sont destinés aux personnes âgées de 18 ans et plus. Nous ne collectons
                        pas sciemment des données personnelles concernant des mineurs. Si vous pensez qu&apos;un
                        mineur nous a fourni des informations, veuillez nous contacter afin que nous puissions
                        supprimer ces données.
                    </p>
                </div>

                {/* Changes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold mb-4">8. Modifications de cette politique</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Nous pouvons mettre à jour cette politique de confidentialité périodiquement.
                        Nous vous informerons de tout changement significatif par e-mail ou par une
                        notification visible sur notre plateforme. Nous vous encourageons à consulter
                        régulièrement cette page.
                    </p>
                </div>

                {/* Contact */}
                <div className="bg-black text-white rounded-2xl p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold mb-4">Nous contacter</h2>
                    <p className="text-gray-300 mb-6">
                        Pour toute question relative à cette politique de confidentialité ou à l&apos;exercice
                        de vos droits, vous pouvez nous contacter :
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400 shrink-0" />
                            <a href="mailto:support@kmrbeauty.com" className="text-gray-300 hover:text-white transition-colors">
                                support@kmrbeauty.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                            <a href="tel:+237681022388" className="text-gray-300 hover:text-white transition-colors">
                                +237 681 02 23 88
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                            <span className="text-gray-300">Yaoundé, Cameroun</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/20">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Contacter notre équipe
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
