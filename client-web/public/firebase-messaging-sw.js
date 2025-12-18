// Firebase Cloud Messaging Service Worker
// This file handles push notifications in the background

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration - replace with your actual config
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'KmerBeauty';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon.png',
        badge: '/icon.png',
        data: payload.data,
        tag: payload.data?.type || 'general',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Ouvrir'
            },
            {
                action: 'dismiss',
                title: 'Fermer'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const data = event.notification.data || {};
    let url = '/';

    // Navigate based on notification type
    switch (data.type) {
        case 'booking':
        case 'booking_reminder':
            url = data.isProvider
                ? '/pro/dashboard'
                : `/bookings/${data.bookingId}`;
            break;
        case 'message':
            url = `/chat/${data.chatId}`;
            break;
        case 'credits':
        case 'credit_purchase':
            url = '/pro/credits';
            break;
        case 'marketplace_order':
            url = data.isSeller
                ? '/pro/sales'
                : '/orders';
            break;
        case 'announcement':
        case 'welcome':
            url = '/';
            break;
        default:
            url = '/';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already an open window
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
