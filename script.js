// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';
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
            handleUserRedirect(userCredential.user);
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

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('result-container').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('view-results').style.display = 'none';
    }).catch(error => {
        console.error('Logout Error:', error);
    });
});

// Redirect user based on role
function handleUserRedirect(user) {
    const email = user.email;
    if (email === 'challawaheed@gmail.com') {
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('result-container').style.display = 'none';
        document.getElementById('view-results').style.display = 'none';
        loadAdminData();
    } else {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('result-container').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('view-results').style.display = 'block';
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
    try {
        const querySnapshot = await getDocs(collection(db, 'questions'));
        quizData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderQuestion();
    } catch (error) {
        console.error('Error loading quiz data:', error);
    }
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
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
});

document.getElementById('previous-question').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

// Start the timer
function startTimer() {
    timeLeft = TIME_PER_QUESTION;
    const timerElement = document.getElementById('time');
    clearInterval(timer);
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
        if (isCorrect) correctAnswers++;
        resultsContainer.innerHTML += `
            <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                <h3>${question.question}</h3>
                <p><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
                <p><strong>Your Answer:</strong> ${userAnswer || 'Not Answered'}</p>
            </div>
        `;
    });
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
        }).catch(error => {
            console.error('Error saving results:', error);
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
    try {
        const querySnapshot = await getDocs(collection(db, 'userResults'));
        const adminResultsContainer = document.getElementById('admin-results');
        adminResultsContainer.innerHTML = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            adminResultsContainer.innerHTML += `
                <div class="admin-result-item">
                    <h3>User ID: ${data.userId}</h3>
                    <p><strong>Score:</strong> ${data.score} / ${data.total}</p>
                    <p><strong>Date:</strong> ${data.timestamp.toDate().toLocaleString()}</p>
                </div>
            `;
        });
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            adminResultsContainer.innerHTML += `
                <div class="admin-user-item">
                    <h3>Email: ${userData.email}</h3>
                    <p><strong>Password:</strong> ${userData.password}</p>
                    <p><strong>Score:</strong> ${userData.score || 'No score available'}</p>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
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
        document.getElementById('view-results').style.display = 'none';
    }
});

// Add question functionality for admin
document.getElementById('add-question-btn').addEventListener('click', async () => {
    const questionText = document.getElementById('question-text').value;
    const options = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value,
        document.getElementById('option4').value
    ];
    const correctAnswer = document.getElementById('correct-answer').value;
    if (questionText && options.length === 4 && correctAnswer) {
        try {
            await addDoc(collection(db, 'questions'), {
                question: questionText,
                options: options,
                correctAnswer: correctAnswer
            });
            alert('Question added successfully!');
            document.getElementById('question-text').value = '';
            document.getElementById('option1').value = '';
            document.getElementById('option2').value = '';
            document.getElementById('option3').value = '';
            document.getElementById('option4').value = '';
            document.getElementById('correct-answer').value = '';
        } catch (error) {
            console.error('Error adding question:', error);
        }
    } else {
        alert('Please fill all fields correctly.');
    }
});

document.getElementById('reset-password-btn').addEventListener('click', () => {
    const email = document.getElementById('reset-email').value;
    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('Password reset email sent!');
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
});
