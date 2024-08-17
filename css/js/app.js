import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// User Authentication Functions
function register(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User registered:', userCredential.user);
    })
    .catch((error) => {
      console.error('Error registering:', error);
    });
}

function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User logged in:', userCredential.user);
    })
    .catch((error) => {
      console.error('Error logging in:', error);
    });
}

function logout() {
  signOut(auth)
    .then(() => {
      console.log('User logged out');
    })
    .catch((error) => {
      console.error('Error logging out:', error);
    });
}

// Fetch and Display Quiz
function displayQuiz(quizId) {
  const quizDocRef = doc(db, 'quizzes', quizId);
  getDoc(quizDocRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const quiz = docSnap.data();
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `<h2>${quiz.title}</h2>`;
        quiz.questions.forEach((q, index) => {
          appDiv.innerHTML += `<p>${q.question}</p>`;
          q.options.forEach((option, i) => {
            appDiv.innerHTML += `<label><input type="radio" name="${q.id}" value="${option}">${option}</label><br>`;
          });
        });
        appDiv.innerHTML += '<button onclick="submitQuiz()">Submit</button>';
      } else {
        console.log('No such quiz!');
      }
    })
    .catch((error) => {
      console.error('Error fetching quiz:', error);
    });
}

// Handle Quiz Submission
function submitQuiz() {
  // Implement quiz submission logic here
}

// Add Quiz Function
function addQuiz(title, questions) {
  addDoc(collection(db, 'quizzes'), {
    title: title,
    questions: questions
  })
  .then((docRef) => {
    console.log('Quiz added with ID:', docRef.id);
  })
  .catch((error) => {
    console.error('Error adding quiz:', error);
  });
}
