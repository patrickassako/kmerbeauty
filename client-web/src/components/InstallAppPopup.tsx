"use client";

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, MoreVertical, Smartphone, Apple, Chrome } from 'lucide-react';

interface InstallAppPopupProps {
    onClose: () => void;
}

type Platform = 'ios' | 'android' | 'desktop';

const detectPlatform = (): Platform => {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        return 'ios';
    }

    // Android detection
    if (/android/i.test(userAgent)) {
        return 'android';
    }

    return 'desktop';
};

export function InstallAppPopup({ onClose }: InstallAppPopupProps) {
    const [platform, setPlatform] = useState<Platform>('desktop');
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        setPlatform(detectPlatform());
    }, []);

    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.kmerservices.app'; // Replace with actual URL

    const iosSteps = [
        {
            icon: <Share className="w-8 h-8" />,
            title: "Appuyez sur Partager",
            description: "En bas de Safari, appuyez sur l'icône de partage",
            image: "/images/ios-step1.png"
        },
        {
            icon: <Plus className="w-8 h-8" />,
            title: "Sur l'écran d'accueil",
            description: "Faites défiler et appuyez sur \"Sur l'écran d'accueil\"",
            image: "/images/ios-step2.png"
        },
        {
            icon: <Smartphone className="w-8 h-8" />,
            title: "C'est installé !",
            description: "L'application sera disponible comme une app native",
            image: "/images/ios-step3.png"
        }
    ];

    // Android content
    if (platform === 'android') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <img
                                    src="/logo.png"
                                    alt="KmerBeauty"
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💆</text></svg>';
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">KmerBeauty</h2>
                                <p className="text-white/80 text-sm">L'app officielle</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                📱 Téléchargez notre app !
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Une expérience optimisée avec notifications,
                                mode hors-ligne et bien plus encore !
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🔔</span>
                                <span className="text-gray-700">Notifications en temps réel</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">⚡</span>
                                <span className="text-gray-700">Plus rapide et fluide</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📍</span>
                                <span className="text-gray-700">Géolocalisation précise</span>
                            </div>
                        </div>

                        {/* Play Store Button */}
                        <a
                            href={playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                            </svg>
                            <span>Télécharger sur Play Store</span>
                        </a>

                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700 transition"
                        >
                            Continuer sur le site web
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // iOS content with tutorial
    if (platform === 'ios') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <img
                                    src="/logo.png"
                                    alt="KmerBeauty"
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💆</text></svg>';
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">KmerBeauty</h2>
                                <div className="flex items-center gap-2 text-white/70 text-sm">
                                    <Apple className="w-4 h-4" />
                                    <span>Bientôt sur App Store</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                📲 Installez l'app web !
                            </h3>
                            <p className="text-gray-600 text-sm">
                                En attendant l'App Store, ajoutez KmerBeauty à votre écran d'accueil en 3 étapes simples
                            </p>
                        </div>

                        {/* Step indicator */}
                        <div className="flex justify-center gap-2 mb-6">
                            {iosSteps.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`w-3 h-3 rounded-full transition ${idx === currentStep ? 'bg-amber-500 w-8' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Current Step */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center min-h-[180px] flex flex-col items-center justify-center">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${currentStep === 0 ? 'bg-blue-500 text-white' :
                                    currentStep === 1 ? 'bg-green-500 text-white' :
                                        'bg-amber-500 text-white'
                                }`}>
                                {iosSteps[currentStep].icon}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">
                                Étape {currentStep + 1}: {iosSteps[currentStep].title}
                            </h4>
                            <p className="text-gray-600 text-sm">
                                {iosSteps[currentStep].description}
                            </p>

                            {/* Visual hint for step 1 */}
                            {currentStep === 0 && (
                                <div className="mt-4 flex items-center gap-2 text-blue-500 text-sm">
                                    <Share className="w-5 h-5" />
                                    <span>← Cherchez cette icône en bas de Safari</span>
                                </div>
                            )}

                            {/* Visual hint for step 2 */}
                            {currentStep === 1 && (
                                <div className="mt-4 bg-white border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                                    <Plus className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Sur l'écran d'accueil</span>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                                >
                                    Précédent
                                </button>
                            )}
                            {currentStep < iosSteps.length - 1 ? (
                                <button
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition"
                                >
                                    Suivant
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
                                >
                                    J'ai compris ! ✓
                                </button>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700 transition"
                        >
                            Continuer sur le site web
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop content - show both options
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-4xl">💆</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">KmerBeauty</h2>
                            <p className="text-white/80 text-sm">Téléchargez l'app mobile !</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            📱 Disponible sur mobile !
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Pour une meilleure expérience, téléchargez notre application mobile
                        </p>
                    </div>

                    {/* QR Code placeholder */}
                    <div className="bg-gray-100 rounded-xl p-6 mb-6">
                        <div className="w-32 h-32 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <span className="text-gray-400 text-sm">QR Code</span>
                        </div>
                        <p className="text-center text-gray-500 text-sm mt-3">
                            Scannez avec votre téléphone
                        </p>
                    </div>

                    {/* Store buttons */}
                    <div className="space-y-3">
                        <a
                            href={playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                            </svg>
                            <span>Google Play (Android)</span>
                        </a>
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
                            <Apple className="w-4 h-4" />
                            <span>App Store - Bientôt disponible</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700 transition"
                    >
                        Continuer sur le site web
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook to manage popup display
export function useInstallAppPopup() {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the popup before
        const dismissed = localStorage.getItem('installAppPopupDismissed');
        const lastShown = localStorage.getItem('installAppPopupLastShown');

        // Show popup if never dismissed, or if it's been more than 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const shouldShow = !dismissed || (lastShown && parseInt(lastShown) < sevenDaysAgo);

        if (shouldShow) {
            // Delay popup by 3 seconds for better UX
            const timer = setTimeout(() => {
                setShowPopup(true);
                localStorage.setItem('installAppPopupLastShown', Date.now().toString());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    const closePopup = () => {
        setShowPopup(false);
        localStorage.setItem('installAppPopupDismissed', 'true');
    };

    return { showPopup, closePopup };
}
