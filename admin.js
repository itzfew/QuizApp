import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

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

// Admin only
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if the user has admin privileges
    if (!user.admin) {
      alert("You do not have admin privileges.");
      window.location.href = 'index.html';
    }
  }
});

document.getElementById('create-exam-btn').addEventListener('click', async () => {
  const examName = document.getElementById('exam-name').value;
  const examDescription = document.getElementById('exam-description').value;

  try {
    await addDoc(collection(db, 'exams'), {
      name: examName,
      description: examDescription,
      timestamp: serverTimestamp()
    });
    alert('Exam created successfully!');
    document.getElementById('exam-name').value = '';
    document.getElementById('exam-description').value = '';
  } catch (error) {
    console.error('Error creating exam: ', error);
  }
});

document.getElementById('add-question-btn').addEventListener('click', async () => {
  const examId = document.getElementById('exam-id').value;
  const questionText = document.getElementById('question-text').value;
  const options = [
    document.getElementById('option1').value,
    document.getElementById('option2').value,
    document.getElementById('option3').value,
    document.getElementById('option4').value
  ];
  const correctOption = document.getElementById('correct-option').value;

  try {
    await addDoc(collection(db, 'questions'), {
      examId: examId,
      text: questionText,
      options: options,
      correctOption: correctOption,
      timestamp: serverTimestamp()
    });
    alert('Question added successfully!');
    document.getElementById('exam-id').value = '';
    document.getElementById('question-text').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('option3').value = '';
    document.getElementById('option4').value = '';
    document.getElementById('correct-option').value = '';
  } catch (error) {
    console.error('Error adding question: ', error);
  }
});
