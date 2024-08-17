import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBngswaoY4gdIMH7_jDfPkCnkTUbttEvUk",
  authDomain: "willing-star-1649162963080.firebaseapp.com",
  projectId: "willing-star-1649162963080",
  storageBucket: "willing-star-1649162963080.appspot.com",
  messagingSenderId: "711266174647",
  appId: "1:711266174647:web:a9bda7a6963d789c82ef32",
  measurementId: "G-S06YSXZ20W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const quizList = document.getElementById('quizList');
const pollList = document.getElementById('pollList');
const welcomeMessage = document.getElementById('welcomeMessage');

// Login and Logout
loginButton.addEventListener('click', async () => {
    try {
        await signInAnonymously(auth);
        console.log('User signed in');
    } catch (error) {
        console.error('Error signing in:', error);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Fetch quizzes and polls
async function fetchQuizzes() {
    const querySnapshot = await getDocs(collection(db, 'quizzes'));
    quizList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const quizElement = document.createElement('div');
        quizElement.classList.add('quiz-item');
        quizElement.innerHTML = `
            <p><strong>Question:</strong> ${data.question}</p>
            <ul>
                ${data.options.map((option, index) => `
                    <li class="${index === data.correctOption ? 'correct-option' : ''}">${option}</li>
                `).join('')}
            </ul>
            <button onclick="submitQuiz('${doc.id}')">Submit Answer</button>
        `;
        quizList.appendChild(quizElement);
    });
}

async function fetchPolls() {
    const querySnapshot = await getDocs(collection(db, 'polls'));
    pollList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pollElement = document.createElement('div');
        pollElement.classList.add('poll-item');
        pollElement.innerHTML = `
            <p><strong>Question:</strong> ${data.question}</p>
            <ul>
                ${Object.entries(data.options).map(([key, option]) => `
                    <li><input type="radio" name="${doc.id}" value="${key}"> ${option}</li>
                `).join('')}
            </ul>
            <button onclick="submitPoll('${doc.id}')">Vote</button>
            <div class="progress-bar" id="progress-${doc.id}"></div>
        `;
        pollList.appendChild(pollElement);
    });
}
// Submit quiz answer
async function submitQuiz(quizId) {
    const selectedOption = prompt('Enter the index of your answer:');
    const user = auth.currentUser;
    if (user) {
        await setDoc(doc(db, 'responses', `${user.uid}_${quizId}`), {
            userId: user.uid,
            quizId: quizId,
            answer: parseInt(selectedOption),
            type: 'quiz'
        });
        alert('Quiz submitted successfully!');
    } else {
        alert('You must be logged in to submit.');
    }
}

// Submit poll vote
async function submitPoll(pollId) {
    const form = document.querySelector(`input[name="${pollId}"]:checked`);
    if (form) {
        const selectedOption = form.value;
        const user = auth.currentUser;
        if (user) {
            await setDoc(doc(db, 'responses', `${user.uid}_${pollId}`), {
                userId: user.uid,
                pollId: pollId,
                answer: selectedOption,
                type: 'poll'
            });
            alert('Vote recorded successfully!');
            updatePollProgress(pollId);
        } else {
            alert('You must be logged in to vote.');
        }
    } else {
        alert('Please select an option.');
    }
}

// Update poll progress bar
async function updatePollProgress(pollId) {
    const responsesSnapshot = await getDocs(collection(db, 'responses').where('pollId', '==', pollId));
    const totalVotes = responsesSnapshot.size;
    const voteCounts = {};
    responsesSnapshot.forEach(doc => {
        const data = doc.data();
        if (!voteCounts[data.answer]) {
            voteCounts[data.answer] = 0;
        }
        voteCounts[data.answer]++;
    });

    const progressElement = document.getElementById(`progress-${pollId}`);
    if (progressElement) {
        // Calculate the percentage of votes for each option
        const options = document.querySelectorAll(`input[name="${pollId}"]`);
        options.forEach(option => {
            const optionValue = option.value;
            const votes = voteCounts[optionValue] || 0;
            const percentage = (votes / totalVotes) * 100;
            const progressBar = document.createElement('div');
            progressBar.style.width = `${percentage}%`;
            progressBar.style.backgroundColor = '#4CAF50';
            progressBar.style.height = '1rem';
            progressBar.style.borderRadius = '5px';
            progressElement.appendChild(progressBar);
        });
    }
}

// Update welcome message
onAuthStateChanged(auth, user => {
    if (user) {
        welcomeMessage.textContent = `Welcome back, ${user.uid}!`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline';
        fetchQuizzes();
        fetchPolls();
    } else {
        welcomeMessage.textContent = 'Welcome to the Quiz and Poll App!';
        loginButton.style.display = 'inline';
        logoutButton.style.display = 'none';
    }
});
