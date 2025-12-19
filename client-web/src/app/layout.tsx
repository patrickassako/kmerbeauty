import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { InstallAppPopupWrapper } from "@/components/InstallAppPopupWrapper";
import CountdownWrapper from "@/components/CountdownWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KMR-BEAUTY | Services de beauté à domicile au Cameroun",
    template: "%s | KMR-BEAUTY"
  },
  description: "Trouvez les meilleurs coiffeurs, maquilleurs, esthéticiennes et spas au Cameroun. Réservez vos soins de beauté à domicile ou en salon à Yaoundé, Douala et partout au Cameroun.",
  keywords: [
    "beauté Cameroun", "coiffure Yaoundé", "coiffure Douala",
    "maquillage à domicile", "spa Cameroun", "salon de beauté",
    "esthéticienne Cameroun", "manucure pédicure", "soins visage",
    "massage Cameroun", "tresse africaine", "extension cheveux"
  ],
  authors: [{ name: "KMR-BEAUTY" }],
  creator: "KMR-BEAUTY",
  publisher: "KMR-BEAUTY",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_CM",
    url: "https://kmrbeauty.com",
    siteName: "KMR-BEAUTY",
    title: "KMR-BEAUTY | La beauté à votre porte",
    description: "Réservez vos soins de beauté à domicile ou en salon. Coiffure, maquillage, manucure, massage et plus encore au Cameroun.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KMR-BEAUTY - Services de beauté au Cameroun",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KMR-BEAUTY | Services de beauté au Cameroun",
    description: "Trouvez et réservez les meilleurs professionnels de beauté au Cameroun",
    images: ["/og-image.png"],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://kmrbeauty.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <LanguageProvider>
          <CountdownWrapper>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </CountdownWrapper>
          <InstallAppPopupWrapper />
        </LanguageProvider>
      </body>
    </html>
  );
}


