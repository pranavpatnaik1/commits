// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// Add this debug log
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'exists' : 'missing',
  authDomain: firebaseConfig.authDomain ? 'exists' : 'missing',
  projectId: firebaseConfig.projectId ? 'exists' : 'missing',
  storageBucket: firebaseConfig.storageBucket ? 'exists' : 'missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'exists' : 'missing',
  appId: firebaseConfig.appId ? 'exists' : 'missing',
});

let auth;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Add listener to track auth state
  onAuthStateChanged(auth, (user) => {
    console.log("Firebase: Auth state changed:", {
      hasUser: !!user,
      uid: user?.uid,
      email: user?.email,
      // Add this to see full state
      state: auth.currentUser ? 'authenticated' : 'not authenticated'
    });
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth };