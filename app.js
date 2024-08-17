import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Profile page logic
if (window.location.pathname.includes('profile.html')) {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const signOutButton = document.getElementById('sign-out');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('sign-up').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            authSection.style.display = 'none';
            userInfo.style.display = 'block';
            usernameDisplay.textContent = user.email.split('@')[0];
        } else {
            authSection.style.display = 'block';
            userInfo.style.display = 'none';
        }
    });
}

// Main index page logic
if (window.location.pathname.includes('index.html')) {
    const pollForm = document.getElementById('poll-form');
    const signOutButton = document.getElementById('sign-out');
    const pollList = document.getElementById('poll-list');

    onAuthStateChanged(auth, user => {
        if (user) {
            pollForm.style.display = 'block';
            signOutButton.style.display = 'inline';
        } else {
            pollForm.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('submit-poll').addEventListener('click', async () => {
        const question = document.getElementById('poll-question').value;
        const options = document.getElementById('poll-options').value.split(',').map(opt => opt.trim());
        if (question.trim() === '' || options.length === 0) {
            alert('Poll question and options cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'polls'), {
                    question: question,
                    options: options,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    votes: Array(options.length).fill(0) // Initialize votes count for each option
                });
                document.getElementById('poll-question').value = '';
                document.getElementById('poll-options').value = '';
                displayPolls();
                alert('Poll created successfully!');
            } catch (error) {
                console.error('Error creating poll: ', error);
            }
        } else {
            alert('You must be logged in to create a poll.');
        }
    });

    async function displayPolls() {
        pollList.innerHTML = '';
        try {
            const q = query(collection(db, 'polls'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                const poll = doc.data();
                const pollDiv = document.createElement('div');
                pollDiv.classList.add('poll');
                const pollId = doc.id;

                pollDiv.innerHTML = `
                    <h3>${poll.question}</h3>
                    <div class="poll-options">
                        ${poll.options.map((option, index) => `
                            <button onclick="vote('${pollId}', ${index})">${option}</button>
                        `).join('')}
                    </div>
                    <div id="progress-${pollId}" class="progress-bar"></div>
                `;

                pollList.appendChild(pollDiv);
                updateProgressBar(pollId, poll.options, poll.votes);
            });
        } catch (error) {
            console.error('Error getting polls: ', error);
        }
    }

    window.vote = async function(pollId, optionIndex) {
        if (!auth.currentUser) {
            alert('You must be logged in to vote.');
            return;
        }

        try {
            const pollRef = doc(db, 'polls', pollId);
            const pollDoc = await getDoc(pollRef);
            const poll = pollDoc.data();
            const votes = poll.votes;

            // Update the votes
            votes[optionIndex] += 1;
            await updateDoc(pollRef, { votes: votes });

            // Update the progress bar
            updateProgressBar(pollId, poll.options, votes);
        } catch (error) {
            console.error('Error voting: ', error);
        }
    };

    function updateProgressBar(pollId, options, votes) {
        const totalVotes = votes.reduce((acc, vote) => acc + vote, 0);
        const progressBar = document.getElementById(`progress-${pollId}`);
        progressBar.innerHTML = options.map((option, index) => {
            const percentage = totalVotes > 0 ? (votes[index] / totalVotes) * 100 : 0;
            return `
                <div class="progress-option">
                    <span>${option}</span>
                    <div class="progress-bar-inner" style="width: ${percentage}%;"></div>
                    <span>${Math.round(percentage)}%</span>
                </div>
            `;
        }).join('');
    }

    displayPolls();
}

// Settings page logic
if (window.location.pathname.includes('settings.html')) {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size');

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });

    fontSizeSelect.addEventListener('change', () => {
        const fontSize = fontSizeSelect.value;
        document.body.style.fontSize = fontSize === 'small' ? '14px' :
            fontSize === 'medium' ? '16px' : '18px';
        localStorage.setItem('fontSize', fontSize);
    });

    window.addEventListener('load', () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        document.body.className = savedTheme;
        themeSelect.value = savedTheme;
        document.body.style.fontSize = savedFontSize === 'small' ? '14px' :
            savedFontSize === 'medium' ? '16px' : '18px';
        fontSizeSelect.value = savedFontSize;
    });
}
