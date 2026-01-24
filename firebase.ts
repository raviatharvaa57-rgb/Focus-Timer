
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1-LEFcF7L70jnSsoctOdtXO9zzUFn_Sg",
  authDomain: "focus-timer-drive.firebaseapp.com",
  projectId: "focus-timer-drive",
  storageBucket: "focus-timer-drive.firebasestorage.app",
  messagingSenderId: "916009428641",
  appId: "1:916009428641:web:e1ae20bbd7d1a3d771f2e0"
};

// Initialize the Firebase app instance using compat SDK to avoid modular export issues
const app = firebase.initializeApp(firebaseConfig);

// Initialize and export the Auth instance using compat SDK
export const auth = firebase.auth();

export default app;
