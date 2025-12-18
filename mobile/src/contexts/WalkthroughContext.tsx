/**
 * WalkthroughContext
 * Context for managing onboarding walkthrough state across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WALKTHROUGH_STORAGE_KEY = '@walkthrough_completed';

export interface WalkthroughStep {
    id: string;
    title: string;
    description: string;
    targetRef?: React.RefObject<any>;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface WalkthroughContextType {
    // Client walkthrough
    clientWalkthroughCompleted: boolean;
    clientCurrentStep: number;
    clientSteps: WalkthroughStep[];
    startClientWalkthrough: () => void;
    nextClientStep: () => void;
    skipClientWalkthrough: () => void;

    // Provider walkthrough
    providerWalkthroughCompleted: boolean;
    providerCurrentStep: number;
    providerSteps: WalkthroughStep[];
    startProviderWalkthrough: () => void;
    nextProviderStep: () => void;
    skipProviderWalkthrough: () => void;

    // General
    isWalkthroughActive: boolean;
    resetWalkthrough: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

// Client walkthrough steps
const CLIENT_STEPS: WalkthroughStep[] = [
    {
        id: 'welcome',
        title: '👋 Bienvenue sur KMR Beauty !',
        description: 'Découvrez comment trouver et réserver les meilleurs services de beauté près de chez vous.',
        position: 'bottom',
    },
    {
        id: 'search',
        title: '🔍 Rechercher un service',
        description: 'Utilisez la barre de recherche pour trouver rapidement le service que vous souhaitez.',
        position: 'bottom',
    },
    {
        id: 'categories',
        title: '📂 Explorer par catégorie',
        description: 'Parcourez les différentes catégories : Coiffure, Maquillage, Soins, Massage...',
        position: 'bottom',
    },
    {
        id: 'map',
        title: '🗺️ Visualiser sur la carte',
        description: 'Trouvez les prestataires les plus proches de vous grâce à la carte interactive.',
        position: 'top',
    },
    {
        id: 'providers',
        title: '💅 Choisir un prestataire',
        description: 'Consultez les profils, avis et tarifs des prestataires pour faire votre choix.',
        position: 'bottom',
    },
    {
        id: 'booking',
        title: '📅 Réserver facilement',
        description: 'Sélectionnez une date, un créneau et confirmez votre réservation en quelques clics !',
        position: 'bottom',
    },
    {
        id: 'finish',
        title: '🎉 C\'est parti !',
        description: 'Vous êtes prêt(e) à utiliser l\'application. Bonne expérience !',
        position: 'bottom',
    },
];

// Provider walkthrough steps
const PROVIDER_STEPS: WalkthroughStep[] = [
    {
        id: 'welcome',
        title: '👋 Bienvenue Prestataire !',
        description: 'Voici comment gérer votre activité et recevoir des clients sur KMR Beauty.',
        position: 'bottom',
    },
    {
        id: 'dashboard',
        title: '📊 Votre tableau de bord',
        description: 'Visualisez vos statistiques : revenus, réservations, et performance.',
        position: 'bottom',
    },
    {
        id: 'proposals',
        title: '📬 Nouvelles demandes',
        description: 'Recevez et gérez les demandes de réservation de vos clients ici.',
        position: 'bottom',
    },
    {
        id: 'appointments',
        title: '📅 Vos rendez-vous',
        description: 'Consultez et gérez tous vos rendez-vous confirmés.',
        position: 'bottom',
    },
    {
        id: 'services',
        title: '💼 Vos services',
        description: 'Ajoutez et personnalisez les services que vous proposez avec vos propres tarifs.',
        position: 'bottom',
    },
    {
        id: 'profile',
        title: '👤 Votre profil',
        description: 'Complétez votre profil pour attirer plus de clients : photos, zones d\'intervention, etc.',
        position: 'bottom',
    },
    {
        id: 'availability',
        title: '🟢 Votre disponibilité',
        description: 'Activez/désactivez votre disponibilité pour recevoir des réservations.',
        position: 'bottom',
    },
    {
        id: 'finish',
        title: '🚀 Prêt à démarrer !',
        description: 'Votre espace prestataire est configuré. Bonne chance !',
        position: 'bottom',
    },
];

interface WalkthroughProviderProps {
    children: ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
    const [clientWalkthroughCompleted, setClientWalkthroughCompleted] = useState(true);
    const [providerWalkthroughCompleted, setProviderWalkthroughCompleted] = useState(true);
    const [clientCurrentStep, setClientCurrentStep] = useState(-1);
    const [providerCurrentStep, setProviderCurrentStep] = useState(-1);
    const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);

    useEffect(() => {
        loadWalkthroughStatus();
    }, []);

    const loadWalkthroughStatus = async () => {
        try {
            const data = await AsyncStorage.getItem(WALKTHROUGH_STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                setClientWalkthroughCompleted(parsed.clientCompleted ?? false);
                setProviderWalkthroughCompleted(parsed.providerCompleted ?? false);
            } else {
                // First time user - show walkthrough
                setClientWalkthroughCompleted(false);
                setProviderWalkthroughCompleted(false);
            }
        } catch (error) {
            console.error('Error loading walkthrough status:', error);
        }
    };

    const saveWalkthroughStatus = async (clientCompleted: boolean, providerCompleted: boolean) => {
        try {
            await AsyncStorage.setItem(
                WALKTHROUGH_STORAGE_KEY,
                JSON.stringify({ clientCompleted, providerCompleted })
            );
        } catch (error) {
            console.error('Error saving walkthrough status:', error);
        }
    };

    const startClientWalkthrough = () => {
        setClientCurrentStep(0);
        setIsWalkthroughActive(true);
    };

    const nextClientStep = () => {
        if (clientCurrentStep < CLIENT_STEPS.length - 1) {
            setClientCurrentStep(clientCurrentStep + 1);
        } else {
            // Walkthrough complete
            setClientCurrentStep(-1);
            setClientWalkthroughCompleted(true);
            setIsWalkthroughActive(false);
            saveWalkthroughStatus(true, providerWalkthroughCompleted);
        }
    };

    const skipClientWalkthrough = () => {
        setClientCurrentStep(-1);
        setClientWalkthroughCompleted(true);
        setIsWalkthroughActive(false);
        saveWalkthroughStatus(true, providerWalkthroughCompleted);
    };

    const startProviderWalkthrough = () => {
        setProviderCurrentStep(0);
        setIsWalkthroughActive(true);
    };

    const nextProviderStep = () => {
        if (providerCurrentStep < PROVIDER_STEPS.length - 1) {
            setProviderCurrentStep(providerCurrentStep + 1);
        } else {
            // Walkthrough complete
            setProviderCurrentStep(-1);
            setProviderWalkthroughCompleted(true);
            setIsWalkthroughActive(false);
            saveWalkthroughStatus(clientWalkthroughCompleted, true);
        }
    };

    const skipProviderWalkthrough = () => {
        setProviderCurrentStep(-1);
        setProviderWalkthroughCompleted(true);
        setIsWalkthroughActive(false);
        saveWalkthroughStatus(clientWalkthroughCompleted, true);
    };

    const resetWalkthrough = async () => {
        setClientWalkthroughCompleted(false);
        setProviderWalkthroughCompleted(false);
        setClientCurrentStep(-1);
        setProviderCurrentStep(-1);
        await AsyncStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
    };

    return (
        <WalkthroughContext.Provider
            value={{
                clientWalkthroughCompleted,
                clientCurrentStep,
                clientSteps: CLIENT_STEPS,
                startClientWalkthrough,
                nextClientStep,
                skipClientWalkthrough,
                providerWalkthroughCompleted,
                providerCurrentStep,
                providerSteps: PROVIDER_STEPS,
                startProviderWalkthrough,
                nextProviderStep,
                skipProviderWalkthrough,
                isWalkthroughActive,
                resetWalkthrough,
            }}
        >
            {children}
        </WalkthroughContext.Provider>
    );
};

export const useWalkthrough = (): WalkthroughContextType => {
    const context = useContext(WalkthroughContext);
    if (!context) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
};

export { CLIENT_STEPS, PROVIDER_STEPS };
