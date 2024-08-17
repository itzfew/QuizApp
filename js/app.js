// Import Firebase modules from CDN
import { auth, db } from './firebase-config.js';
import { collection, doc, getDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// User Authentication Functions

// Register a new user
function register(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User registered:', userCredential.user);
      alert('Registration successful!');
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error('Error registering:', errorMessage);
      alert(`Registration failed: ${errorMessage}`);
    });
}

// Login user
function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User logged in:', userCredential.user);
      alert('Login successful!');
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error('Error logging in:', errorMessage);
      alert(`Login failed: ${errorMessage}`);
    });
}

// Logout user
function logout() {
  signOut(auth)
    .then(() => {
      console.log('User logged out');
      alert('Logged out successfully!');
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error('Error logging out:', errorMessage);
      alert(`Logout failed: ${errorMessage}`);
    });
}

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user);
    // Update UI to show authenticated user view
  } else {
    console.log('No user is signed in');
    // Update UI to show guest view
  }
});

// Fetch and Display Quiz
function displayQuiz(quizId) {
  const quizDocRef = doc(db, 'quizzes', quizId);
  getDoc(quizDocRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const quiz = docSnap.data();
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `<h2>${quiz.title}</h2>`;
        quiz.questions.forEach((q) => {
          appDiv.innerHTML += `<p>${q.question}</p>`;
          q.options.forEach((option) => {
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
  // Get user answers from the form
  const appDiv = document.getElementById('app');
  const formData = new FormData(appDiv.querySelector('form'));
  
  const answers = {};
  for (const [name, value] of formData.entries()) {
    answers[name] = value;
  }
  
  console.log('Submitted answers:', answers);

  // Save answers to Firebase (e.g., Firestore or Realtime Database)
  // Example:
  // addDoc(collection(db, 'quizResults'), { answers: answers })
  //   .then((docRef) => {
  //     console.log('Quiz results saved with ID:', docRef.id);
  //   })
  //   .catch((error) => {
  //     console.error('Error saving quiz results:', error);
  //   });
}

// Add a new quiz
function addQuiz(title, questions) {
  addDoc(collection(db, 'quizzes'), {
    title: title,
    questions: questions
  })
  .then((docRef) => {
    console.log('Quiz added with ID:', docRef.id);
    alert('Quiz added successfully!');
  })
  .catch((error) => {
    const errorMessage = error.message;
    console.error('Error adding quiz:', errorMessage);
    alert(`Failed to add quiz: ${errorMessage}`);
  });
}

// Example usage: Call displayQuiz with a specific quiz ID to display a quiz
// displayQuiz('your-quiz-id');

// Example usage: Call addQuiz to add a new quiz
// addQuiz('Sample Quiz Title', [{ question: 'What is 2+2?', options: ['3', '4', '5'] }]);
