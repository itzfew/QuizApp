// app.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize quiz state
let quizData = [];
let userAnswers = {};
let currentQuestionIndex = 0;
let timer;
const TIME_PER_QUESTION = 60; // 1 minute per question
let timeLeft = TIME_PER_QUESTION;

// Event listeners for authentication
document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            handleUserRedirect(user);
        })
        .catch(error => {
            alert('Login Failed: ' + error.message);
        });
});

document.getElementById('register-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('Registration successful! Please login.');
        })
        .catch(error => {
            alert('Registration Failed: ' + error.message);
        });
});

// Redirect user based on role
function handleUserRedirect(user) {
    if (user.email === 'waheedchalla@gmail.com') {
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'none';
        loadAdminData();
    } else {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        startQuiz();
    }
}

// Start the quiz and load questions
function startQuiz() {
    userAnswers = {};
    quizData = [];
    currentQuestionIndex = 0;
    document.getElementById('question-container').innerHTML = '';

    loadQuizData();
}

// Load quiz data from Firestore
async function loadQuizData() {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    querySnapshot.forEach(doc => {
        quizData.push({
            id: doc.id,
            ...doc.data()
        });
    });
    renderQuestion();
}

// Render the current question to the DOM
function renderQuestion() {
    const question = quizData[currentQuestionIndex];
    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = `
        <h2>${currentQuestionIndex + 1}. ${question.question}</h2>
        ${question.options.map(option => `
            <div class="option" data-id="${question.id}" data-option="${option}">
                ${option}
            </div>
        `).join('')}
    `;

    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', (e) => {
            const selectedOption = e.target.dataset.option;
            userAnswers[question.id] = selectedOption;
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            e.target.classList.add('selected');
        });
    });

    document.getElementById('previous-question').style.display = currentQuestionIndex === 0 ? 'none' : 'block';
    document.getElementById('next-question').style.display = currentQuestionIndex === quizData.length - 1 ? 'none' : 'block';
    document.getElementById('submit-quiz').style.display = currentQuestionIndex === quizData.length - 1 ? 'block' : 'none';

    timeLeft = TIME_PER_QUESTION;
    startTimer();
}

// Handle navigation between questions
document.getElementById('next-question').addEventListener('click', () => {
    currentQuestionIndex++;
    renderQuestion();
});

document.getElementById('previous-question').addEventListener('click', () => {
    currentQuestionIndex--;
    renderQuestion();
});

// Start the timer
function startTimer() {
    const timerElement = document.getElementById('time');
    timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            if (currentQuestionIndex < quizData.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
            } else {
                submitQuiz();
            }
        }
    }, 1000);
}

// Submit the quiz and evaluate results
document.getElementById('submit-quiz').addEventListener('click', submitQuiz);

function submitQuiz() {
    clearInterval(timer);

    let correctAnswers = 0;
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    quizData.forEach(question => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) {
            correctAnswers++;
        }

        resultsContainer.innerHTML += `
            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                <h3>${question.question}</h3>
                <p><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
                <p><strong>Your Answer:</strong> ${userAnswer || 'Not Answered'}</p>
            </div>
        `;
    });

    // Save results to Firestore
    saveResultsToFirestore(correctAnswers, quizData.length);

    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
}

function saveResultsToFirestore(score, total) {
    const user = auth.currentUser;
    if (user) {
        addDoc(collection(db, 'userResults'), {
            userId: user.uid,
            score: score,
            total: total,
            timestamp: serverTimestamp()
        });
    }
}

document.getElementById('retry-quiz').addEventListener('click', () => {
    startQuiz();
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
});

// Load admin data
async function loadAdminData() {
    const querySnapshot = await getDocs(collection(db, 'userResults'));
    const adminResultsContainer = document.getElementById('admin-results');
    adminResultsContainer.innerHTML = '';

    querySnapshot.forEach(doc => {
        const data = doc.data();
        adminResultsContainer.innerHTML += `
            <div class="result-item">
                <p><strong>User ID:</strong> ${data.userId}</p>
                <p><strong>Score:</strong> ${data.score} / ${data.total}</p>
                <p><strong>Date:</strong> ${data.timestamp.toDate().toLocaleString()}</p>
            </div>
        `;
    });
}

// Auto-login on page load if user is already logged in
onAuthStateChanged(auth, user => {
    if (user) {
        handleUserRedirect(user);
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('result-container').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
});
