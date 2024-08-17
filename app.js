import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';

// Your Firebase configuration
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
const addQuizButton = document.getElementById('addQuizButton');
const addPollButton = document.getElementById('addPollButton');

// Sign in anonymously
loginButton.addEventListener('click', async () => {
    try {
        await signInAnonymously(auth);
        console.log('User signed in');
        fetchQuizzes();
        fetchPolls();
    } catch (error) {
        console.error('Error signing in:', error);
    }
});

// Sign out
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Add a quiz
addQuizButton.addEventListener('click', async () => {
    const quizId = prompt('Enter quiz ID:');
    const question = prompt('Enter quiz question:');
    const options = prompt('Enter options (comma-separated):').split(',');
    const correctOption = parseInt(prompt('Enter the index of the correct option:'));

    try {
        await setDoc(doc(db, 'quizzes', quizId), {
            question: question,
            options: options,
            correctOption: correctOption
        });
        console.log('Quiz added successfully!');
        fetchQuizzes();
    } catch (error) {
        console.error('Error adding quiz:', error);
    }
});

// Add a poll
addPollButton.addEventListener('click', async () => {
    const pollId = prompt('Enter poll ID:');
    const question = prompt('Enter poll question:');
    const options = prompt('Enter options (comma-separated):').split(',');

    try {
        await setDoc(doc(db, 'polls', pollId), {
            question: question,
            options: options.reduce((acc, option, index) => {
                acc[`option${index + 1}`] = option;
                return acc;
            }, {}),
            votes: {}
        });
        console.log('Poll added successfully!');
        fetchPolls();
    } catch (error) {
        console.error('Error adding poll:', error);
    }
});

// Fetch quizzes
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
        `;
        quizList.appendChild(quizElement);
    });
}

// Fetch polls
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
                ${Object.values(data.options).map(option => `
                    <li>${option}</li>
                `).join('')}
            </ul>
        `;
        pollList.appendChild(pollElement);
    });
}
