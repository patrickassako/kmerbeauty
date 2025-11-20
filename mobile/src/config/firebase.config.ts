/**
 * Configuration Firebase
 * Contient les clés et configuration pour Firebase Cloud Messaging
 */

export const firebaseConfig = {
  // Récupérées depuis Firebase Console > Project Settings > General > Your apps (Web app)
  // TODO: Remplacer ces valeurs par celles de votre Web app Firebase

  apiKey: "YOUR_FIREBASE_API_KEY", // Ex: "AIzaSyBxxx..."
  authDomain: "kmerservice-d178f.firebaseapp.com",
  projectId: "kmerservice-d178f",
  storageBucket: "kmerservice-d178f.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID", // Ex: "123456789"
  appId: "YOUR_APP_ID", // Ex: "1:123456789:web:abcdef123456"

  // Clé serveur FCM (pour le backend/Edge Functions)
  // Récupérée depuis Firebase Console > Project Settings > Cloud Messaging > Server key (Legacy)
  serverKey: "YOUR_FCM_SERVER_KEY", // Ex: "AAAA1234567890..."
};

// IMPORTANT: Ce fichier n'est PAS utilisé côté mobile avec Expo Push Notifications
// Il est gardé pour référence si vous voulez implémenter des fonctionnalités Firebase supplémentaires
// Les notifications fonctionnent via Expo sans ce fichier (utilisent google-services.json à la place)
