// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBngswaoY4gdIMH7_jDfPkCnkTUbttEvUk",
  authDomain: "willing-star-1649162963080.firebaseapp.com",
  projectId: "willing-star-1649162963080",
  storageBucket: "willing-star-1649162963080.appspot.com",
  messagingSenderId: "711266174647",
  appId: "1:711266174647:web:a9bda7a6963d789c82ef32",
  measurementId: "G-S06YSXZ20W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
