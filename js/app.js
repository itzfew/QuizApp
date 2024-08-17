// app.js
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Function to display quizzes
function displayQuizzes() {
  const quizListDiv = document.getElementById('quizList');
  
  getDocs(collection(db, 'quizzes'))
    .then((querySnapshot) => {
      quizListDiv.innerHTML = ''; // Clear previous content
      querySnapshot.forEach((doc) => {
        const quiz = doc.data();
        const quizElement = document.createElement('div');
        quizElement.innerHTML = `
          <h3>${quiz.title}</h3>
          <button onclick="startQuiz('${doc.id}')">Start Quiz</button>
        `;
        quizListDiv.appendChild(quizElement);
      });
    })
    .catch((error) => {
      console.error('Error fetching quizzes:', error);
    });
}

// Function to start a quiz
function startQuiz(quizId) {
  displayQuiz(quizId);
}

// Function to display a specific quiz
function displayQuiz(quizId) {
  // Fetch and display specific quiz logic
}

// Call displayQuizzes when the page loads
window.onload = function() {
  displayQuizzes();
};
