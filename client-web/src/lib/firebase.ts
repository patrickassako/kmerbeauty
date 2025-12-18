// Firebase configuration for web push notifications
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

let messaging: Messaging | null = null;

export const initializeFirebase = async () => {
    if (typeof window === 'undefined') return null;

    const supported = await isSupported();
    if (!supported) {
        console.log('Firebase messaging not supported');
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
        if (!messaging) await initializeFirebase();
        if (!messaging) return null;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

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

export const onForegroundMessage = (callback: (payload: any) => void) => {
    if (!messaging) return () => { };
    return onMessage(messaging, callback);
};

export const registerTokenWithBackend = async (userId: string, token: string) => {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/register-web-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token }),
        });
        return true;
    } catch (error) {
        console.error('Error registering token:', error);
        return false;
    }
};
