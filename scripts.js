import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, query, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to display exams
async function displayExams() {
  const examsList = document.getElementById('exams-list');
  examsList.innerHTML = '';

  try {
    const q = query(collection(db, 'exams'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
      const exam = doc.data();
      const examDiv = document.createElement('div');
      examDiv.classList.add('exam');
      examDiv.innerHTML = `
        <h3>${exam.name}</h3>
        <p>${exam.description}</p>
        <button onclick="startExam('${doc.id}')">Start Exam</button>
      `;
      examsList.appendChild(examDiv);
    });
  } catch (error) {
    console.error('Error fetching exams: ', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  displayExams();
  document.getElementById('sign-out').addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'index.html'; // Redirect to home page or login page
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  });
});

async function startExam(examId) {
  // Logic to start the exam, typically navigating to a new page or displaying the exam
  window.location.href = `exam.html?examId=${examId}`;
}
