import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-pB6V_hF3K5mK_example",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cinesense-3c393.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cinesense-3c393",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cinesense-3c393.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

// Initialize Firebase and export auth and database instances
const app = initializeApp(firebaseConfig);

// Authentication service instance
export const auth = getAuth(app);

// Firestore database instance
export const db = getFirestore(app);

export default app;
