// Firebase configuration for web push notifications
// Replace these values with your actual Firebase config

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on client side
let messaging: Messaging | null = null;

export const initializeFirebase = async () => {
    if (typeof window === 'undefined') return null;

    const supported = await isSupported();
    if (!supported) {
        console.log('Firebase messaging not supported in this browser');
        return null;
    }

    if (!getApps().length) {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    }

    return messaging;
};

export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        if (!messaging) {
            await initializeFirebase();
        }

        if (!messaging) {
            console.log('Messaging not initialized');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get the token
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting notification permission:', error);
        return null;
    }
};

export const registerServiceWorker = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
    if (!messaging) {
        console.log('Messaging not initialized');
        return () => { };
    }

    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
};

// Register the FCM token with the backend
export const registerTokenWithBackend = async (userId: string, token: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/register-web-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, token }),
        });

        if (!response.ok) {
            throw new Error('Failed to register token');
        }

        console.log('Token registered with backend');
        return true;
    } catch (error) {
        console.error('Error registering token:', error);
        return false;
    }
};
