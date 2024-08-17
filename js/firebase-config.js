// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyA_dNTrWIo8fSTub-J4uh_Yjf4Fr_qay3c",
  authDomain: "ind-edu.firebaseapp.com",
  databaseURL: "https://ind-edu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ind-edu",
  storageBucket: "ind-edu.appspot.com",
  messagingSenderId: "60520122150",
  appId: "1:60520122150:web:0205f57353dae6cfc723e7",
  measurementId: "G-XLZRGM88T9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
