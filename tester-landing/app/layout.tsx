import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Devenir Beta Testeur | KMR-Beauty",
    description: "Rejoignez notre programme de beta testeurs et soyez parmi les premiers à découvrir KMR-Beauty, l'application qui révolutionne les services de beauté à domicile au Cameroun. Coiffure, maquillage, soins - réservez en 2 clics.",
    keywords: ["KMR-Beauty", "beta testeur", "beauté", "Cameroun", "coiffure à domicile", "maquillage", "soins esthétiques", "Douala", "Yaoundé", "application beauté"],
    authors: [{ name: "KMR-Beauty" }],
    creator: "KMR-Beauty",
    publisher: "KMR-Beauty",
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        locale: "fr_CM",
        url: "https://tester.kmrbeauty.com",
        siteName: "KMR-Beauty",
        title: "Devenir Beta Testeur | KMR-Beauty",
        description: "Soyez parmi les premiers à tester l'application de beauté à domicile au Cameroun. Inscrivez-vous maintenant !",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "KMR-Beauty Beta Testeur",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Devenir Beta Testeur | KMR-Beauty",
        description: "Rejoignez notre programme beta et testez l'app avant tout le monde !",
        images: ["/og-image.png"],
    },
    icons: {
        icon: "/icon.png",
        shortcut: "/favicon.ico",
        apple: "/icon.png",
    },
    manifest: "/manifest.json",
    themeColor: "#2D2D2D",
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
