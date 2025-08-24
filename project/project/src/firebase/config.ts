import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCTTMjGHpQUK3JmRpu_f6shzo2SuJPdb54",
  authDomain: "projectify-ea2d7.firebaseapp.com",
  projectId: "projectify-ea2d7",
  storageBucket: "projectify-ea2d7.firebasestorage.app",
  messagingSenderId: "629148472158",
  appId: "1:629148472158:web:6374c718d30409bdecf5cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;