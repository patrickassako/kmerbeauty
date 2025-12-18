// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1D-s8zv3MBjJzGyZQh5gyE3nrb3FIFfg",
  authDomain: "kmerservice-d178f.firebaseapp.com",
  projectId: "kmerservice-d178f",
  storageBucket: "kmerservice-d178f.firebasestorage.app",
  messagingSenderId: "208145625226",
  appId: "1:208145625226:web:43f3ab41eed1078ff07d73",
  measurementId: "G-ZRFDYVNQBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);