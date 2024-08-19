import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
  authDomain: "quizapp-1ae20.firebaseapp.com",
  projectId: "quizapp-1ae20",
  storageBucket: "quizapp-1ae20.appspot.com",
  messagingSenderId: "626886802317",
  appId: "1:626886802317:web:df08c307697ca235c45bc4",
  measurementId: "G-NKJTC5C1XW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('add-question').addEventListener('click', () => {
    const container = document.getElementById('questions-container');
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `
        <input type="text" placeholder="Question Text" class="question-text" required>
        <input type="text" placeholder="Option 1" class="question-option">
        <input type="text" placeholder="Option 2" class="question-option">
        <input type="text" placeholder="Option 3" class="question-option">
        <input type="text" placeholder="Option 4" class="question-option">
    `;
    container.appendChild(questionDiv);
});

document.getElementById('exam-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const title = document.getElementById('exam-title').value;
    const questions = [];

    document.querySelectorAll('#questions-container > div').forEach(div => {
        const questionText = div.querySelector('.question-text').value;
        const options = Array.from(div.querySelectorAll('.question-option')).map(input => input.value).filter(value => value);
        questions.push({ text: questionText, options });
    });

    await addDoc(collection(db, "exams"), {
        title: title,
        questions: questions
    });

    alert('Exam saved successfully');
    document.getElementById('exam-form').reset();
    document.getElementById('questions-container').innerHTML = '';
});
