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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
// Sign Up
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('Sign Up Successful!');
        window.location.href = 'login.html';
    } catch (error) {
        alert(error.message);
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Login Successful!');
        window.location.href = 'quiz.html';
    } catch (error) {
        alert(error.message);
    }
});
// Quiz Functionality
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('quiz.html')) {
        const quizContainer = document.getElementById('quizContainer');
        
        // Fetch quiz questions from Firestore
        const quizRef = firestore.collection('quizzes').doc('quiz1');
        const doc = await quizRef.get();
        const quizData = doc.data();
        
        // Display questions
        quizData.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.innerHTML = `
                <p>${question.text}</p>
                ${question.options.map((option, i) => `
                    <label>
                        <input type="radio" name="question${index}" value="${i}">
                        ${option}
                    </label>
                `).join('<br>')}
            `;
            quizContainer.appendChild(questionElement);
        });
        
        // Handle quiz submission
        document.getElementById('submitQuiz')?.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) {
                alert('You need to log in first!');
                return;
            }
            
            let score = 0;
            quizData.questions.forEach((question, index) => {
                const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
                if (selectedOption && parseInt(selectedOption.value) === question.correctOption) {
                    score++;
                }
            });
            
            // Save score to Firestore
            await firestore.collection('scores').add({
                userId: user.uid,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert(`Your score is ${score}/${quizData.questions.length}`);
        });
    }
});
// Leaderboard Functionality
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('leaderboard.html')) {
        const leaderboard = document.getElementById('leaderboard');
        
        // Fetch scores from Firestore
        const scoresRef = firestore.collection('scores').orderBy('score', 'desc').limit(10);
        const snapshot = await scoresRef.get();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            leaderboard.innerHTML += `<li>User ${data.userId}: ${data.score}</li>`;
        });
    }
});
