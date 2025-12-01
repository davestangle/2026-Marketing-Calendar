import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Config from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyA7m7x1aQuEn2OyPYzrImzzavk304mgW6k",
  authDomain: "big-moments-fcd81.firebaseapp.com",
  projectId: "big-moments-fcd81",
  storageBucket: "big-moments-fcd81.firebasestorage.app",
  messagingSenderId: "545327580206",
  appId: "1:545327580206:web:2cec9420810d6f21ed4bbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database, auth, AND storage instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();