// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBx-BT-jN4RT3_ldy5QpWHEXuwLZEZTfhY",
  authDomain: "carneriks-b31a8.firebaseapp.com",
  projectId: "carneriks-b31a8",
  storageBucket: "carneriks-b31a8.firebasestorage.app",
  messagingSenderId: "983092378648",
  appId: "1:983092378648:web:63dafbb33b33a50e82576d",
  measurementId: "G-YNQH8HJM3B"
};

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics safely (works across browser environments)
export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.debug("Firebase Analytics not initialized in current environment:", err);
  });
}

export default app;
