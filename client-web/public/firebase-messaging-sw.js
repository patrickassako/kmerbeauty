// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
    apiKey: "AIzaSyA1D-s8zv3MBjJzGyZQh5gyE3nrb3FIFfg",
    authDomain: "kmerservice-d178f.firebaseapp.com",
    projectId: "kmerservice-d178f",
    storageBucket: "kmerservice-d178f.firebasestorage.app",
    messagingSenderId: "208145625226",
    appId: "1:208145625226:web:43f3ab41eed1078ff07d73",
    measurementId: "G-ZRFDYVNQBV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background message:', payload);

    const notificationTitle = payload.notification?.title || 'KmerBeauty';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon.png',
        badge: '/icon.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let url = '/';

    if (data.type === 'booking') url = '/pro/dashboard';
    else if (data.type === 'message') url = `/chat/${data.chatId}`;
    else if (data.type === 'credits') url = '/pro/credits';

    event.waitUntil(clients.openWindow(url));
});
