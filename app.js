// app.js

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
    authDomain: "quizapp-1ae20.firebaseapp.com",
    projectId: "quizapp-1ae20",
    storageBucket: "quizapp-1ae20.appspot.com",
    messagingSenderId: "626886802317",
    appId: "1:626886802317:web:df08c307697ca235c45bc4",
    measurementId: "G-NKJTC5C1XW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Add a question to the form
function addQuestion() {
    const container = document.getElementById('questions-container');
    const questionCount = container.children.length + 1;

    const questionHTML = `
        <div class="question">
            <input type="text" class="question-text" placeholder="Question ${questionCount}" required>
            <input type="text" class="option-a" placeholder="Option A" required>
            <input type="text" class="option-b" placeholder="Option B" required>
            <input type="text" class="option-c" placeholder="Option C" required>
            <input type="text" class="option-d" placeholder="Option D" required>
            <input type="text" class="correct-option" placeholder="Correct Option (A/B/C/D)" required>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', questionHTML);
}

// Submit quiz
document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('quiz-title').value;
    const description = document.getElementById('quiz-description').value;
    const questions = Array.from(document.querySelectorAll('.question')).map(q => {
        return {
            text: q.querySelector('.question-text').value,
            options: {
                A: q.querySelector('.option-a').value,
                B: q.querySelector('.option-b').value,
                C: q.querySelector('.option-c').value,
                D: q.querySelector('.option-d').value
            },
            correctOption: q.querySelector('.correct-option').value
        };
    });

    try {
        await db.collection('quizzes').add({
            title,
            description,
            questions
        });
        alert('Quiz added successfully!');
    } catch (error) {
        console.error('Error adding quiz: ', error);
    }
});

// Load quizzes for users
async function loadQuizzes() {
    const quizzesList = document.getElementById('quizzes-list');
    quizzesList.innerHTML = '';
    
    try {
        const snapshot = await db.collection('quizzes').get();
        snapshot.forEach(doc => {
            const quiz = doc.data();
            const quizElement = document.createElement('div');
            quizElement.innerHTML = `
                <h3>${quiz.title}</h3>
                <button onclick='startQuiz("${doc.id}")'>Start Quiz</button>
            `;
            quizzesList.appendChild(quizElement);
        });
    } catch (error) {
        console.error('Error loading quizzes: ', error);
    }
}

// Start a quiz
async function startQuiz(quizId) {
    const quizTitleDisplay = document.getElementById('quiz-title-display');
    const questionsDisplay = document.getElementById('questions-display');
    
    try {
        const doc = await db.collection('quizzes').doc(quizId).get();
        const quiz = doc.data();
        
        quizTitleDisplay.textContent = quiz.title;
        questionsDisplay.innerHTML = quiz.questions.map((q, index) => `
            <div class="question">
                <p>${q.text}</p>
                ${Object.keys(q.options).map(option => `
                    <input type="radio" name="q${index}" value="${option}"> ${q.options[option]}<br>
                `).join('')}
            </div>
        `).join('');
        
        document.getElementById('quiz-taking-panel').style.display = 'block';
    } catch (error) {
        console.error('Error starting quiz: ', error);
    }
}

// Submit quiz answers
document.getElementById('submit-quiz').addEventListener('click', async () => {
    const quizTitleDisplay = document.getElementById('quiz-title-display');
    const answers = Array.from(document.querySelectorAll('.question')).map((q, index) => {
        return {
            question: q.querySelector('p').textContent,
            answer: document.querySelector(`input[name="q${index}"]:checked`)?.value || 'No answer'
        };
    });

    const userEmail = prompt("Enter your email");
    const userName = prompt("Enter your name");

    try {
        await db.collection('responses').add({
            quizTitle: quizTitleDisplay.textContent,
            answers,
            email: userEmail,
            name: userName,
            date: new Date()
        });
        alert('Quiz submitted successfully!');
    } catch (error) {
        console.error('Error submitting quiz: ', error);
    }
});

// Initial load
window.onload = function() {
    loadQuizzes();
};
