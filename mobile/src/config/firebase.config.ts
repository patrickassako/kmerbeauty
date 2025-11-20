/**
 * Configuration Firebase
 * Contient les clés et configuration pour Firebase Cloud Messaging
 */

export const firebaseConfig = {
  // IMPORTANT: L'utilisateur doit remplacer ces valeurs par celles de son projet Firebase
  // Récupérées depuis Firebase Console > Project Settings > General > Your apps

  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",

  // Clé serveur FCM (pour le backend/Edge Functions)
  // Récupérée depuis Firebase Console > Project Settings > Cloud Messaging > Server key
  serverKey: "YOUR_FCM_SERVER_KEY",
};

// TODO: L'utilisateur doit mettre à jour ces valeurs avec celles de son projet Firebase
