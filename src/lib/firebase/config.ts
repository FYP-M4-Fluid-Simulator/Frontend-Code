import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const processEnvString = (value: string | undefined): string => {
  return typeof value === "string" ? value : "";
};

const apiKey = processEnvString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey,
  authDomain: processEnvString(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: processEnvString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: processEnvString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: processEnvString(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: processEnvString(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Initialize Firebase only once
let app: FirebaseApp | undefined;
let auth: Auth | any;

if (apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} else {
  console.warn("Firebase configuration is missing. Auth will not work.");
}

export { app, auth };

