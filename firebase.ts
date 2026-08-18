
import { initializeApp, getApp, getApps } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getAnalytics } from "@firebase/analytics";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAGNF3vCtYw9VNJnRFlRxARWes3o92adDM",
  authDomain: "drinksplit-c2fd5.firebaseapp.com",
  projectId: "drinksplit-c2fd5",
  storageBucket: "drinksplit-c2fd5.firebasestorage.app",
  messagingSenderId: "38392208650",
  appId: "1:38392208650:web:9687cdcec85c88ac3b6ef3",
  measurementId: "G-RM9GD0XD67"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app;
let dbInstance: any = null;
let analyticsInstance: any = null;
let authInstance: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
    
    if (typeof window !== 'undefined') {
      analyticsInstance = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const db = dbInstance;
export const auth = authInstance;
export const analytics = analyticsInstance;
export const googleProvider = new GoogleAuthProvider();
