import { db } from './firebase-config.js';
import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Handle form submission
document.getElementById('quizForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const title = document.getElementById('quizTitle').value;
  const question1 = document.getElementById('question1').value;
  const options1 = document.getElementById('options1').value.split(',');

  const questions = [
    {
      question: question1,
      options: options1
    }
    // Add more questions if needed
  ];

  addQuiz(title, questions);
});

// Add quiz to Firestore
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
