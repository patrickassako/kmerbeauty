"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Script from "next/script";

export default function TesterLandingPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        profile: [] as string[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [splineLoaded, setSplineLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleProfileToggle = (value: string) => {
        setFormData(prev => ({
            ...prev,
            profile: prev.profile.includes(value)
                ? prev.profile.filter(p => p !== value)
                : [...prev.profile, value]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (response.ok) setIsSubmitted(true);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
                    <div className="w-20 h-20 bg-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-light text-[#2D2D2D] mb-4">Merci ! 🎉</h1>
                    <p className="text-gray-600 mb-6">Vous êtes maintenant inscrit au programme beta.</p>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                        <p className="text-sm text-gray-500 mb-2">Prochaine étape</p>
                        <p className="text-[#2D2D2D] font-medium">
                            Le lien de téléchargement vous sera envoyé par <span className="text-green-600">Email</span> ou <span className="text-green-600">WhatsApp</span>
                        </p>
                    </div>
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-3">En attendant, découvrez notre plateforme</p>
                        <a href="https://www.kmrbeauty.com" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#2D2D2D] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition-colors">
                            Visiter kmrbeauty.com
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-sm text-gray-500 mb-4">Suivez-nous sur les réseaux</p>
                        <div className="flex justify-center gap-4">
                            <a href="https://web.facebook.com/profile.php?id=61585229070539" target="_blank" rel="noopener noreferrer"
                                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="https://www.tiktok.com/@kmr.beauty.app" target="_blank" rel="noopener noreferrer"
                                className="w-12 h-12 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {!isMobile && (
                <Script type="module" src="https://unpkg.com/@splinetool/viewer@1.12.23/build/spline-viewer.js" onLoad={() => setSplineLoaded(true)} />
            )}

            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <img src="/logo.png" alt="KMR-Beauty" className="h-8 w-auto" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Beta</span>
                </div>
            </header>

            <main className="pt-24 pb-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-8rem)]">
                        <div>
                            <div className="relative w-full h-[300px] lg:h-[400px] mb-8 rounded-2xl overflow-hidden bg-gray-50">
                                {isMobile ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative w-48 h-48">
                                            <motion.div className="absolute inset-0 rounded-full bg-[#2D2D2D]/5"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                                            <motion.div className="absolute inset-4 rounded-full bg-[#2D2D2D]/10"
                                                animate={{ scale: [1.1, 1, 1.1] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
                                            <motion.div className="absolute inset-8 rounded-full bg-[#2D2D2D]/15"
                                                animate={{ scale: [1, 1.15, 1] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <motion.div className="w-20 h-20 bg-[#2D2D2D] rounded-2xl flex items-center justify-center"
                                                    animate={{ rotate: [0, 5, -5, 0] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                                                    <span className="text-3xl">✨</span>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* @ts-ignore */}
                                        <spline-viewer url="https://prod.spline.design/bNSNwEhn2EInbaAa/scene.splinecode" style={{ width: '100%', height: '100%' }} />
                                        {!splineLoaded && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D2D2D] rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <h1 className="text-4xl lg:text-5xl font-light text-[#2D2D2D] leading-tight mb-6">
                                    Testez l&apos;app<br />
                                    <span className="font-medium">avant tout le monde</span>
                                </h1>
                                <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                                    Rejoignez notre programme beta et aidez-nous à créer la meilleure expérience beauté au Cameroun.
                                </p>
                            </motion.div>
                        </div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Nom complet</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] transition-colors bg-transparent" placeholder="Votre nom" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Email</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] transition-colors bg-transparent" placeholder="votre@email.com" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Téléphone</label>
                                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] transition-colors bg-transparent" placeholder="+237 6XX XXX XXX" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Ville</label>
                                    <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full border-b border-gray-200 py-3 text-[#2D2D2D] focus:outline-none focus:border-[#2D2D2D] transition-colors bg-transparent appearance-none cursor-pointer">
                                        <option value="">Sélectionner</option>
                                        <option value="Douala">Douala</option>
                                        <option value="Yaoundé">Yaoundé</option>
                                        <option value="Bafoussam">Bafoussam</option>
                                        <option value="Garoua">Garoua</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-4">Je souhaite tester comme</label>
                                    <div className="flex gap-3">
                                        {[{ value: "client", label: "Client" }, { value: "prestataire", label: "Prestataire" }].map((option) => (
                                            <button key={option.value} type="button" onClick={() => handleProfileToggle(option.value)}
                                                className={`flex-1 py-3 px-4 rounded-full text-sm font-medium transition-all ${formData.profile.includes(option.value) ? "bg-[#2D2D2D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}>
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting || formData.profile.length === 0}
                                    className="w-full bg-[#2D2D2D] text-white py-4 rounded-full font-medium hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-8">
                                    {isSubmitting ? "Inscription..." : "Rejoindre le programme beta"}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    En vous inscrivant, vous acceptez de tester l&apos;application et de nous faire vos retours.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
