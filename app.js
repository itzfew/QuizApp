// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

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

                // Add poll question
                pollDiv.innerHTML = `
                    <h3>${poll.question}</h3>
                    <div id="poll-options-${doc.id}" class="poll-options">
                        ${poll.options.map((option, index) => `
                            <button onclick="vote('${doc.id}', ${index})">${option}</button>
                        `).join('')}
                    </div>
                    <div id="progress-${doc.id}" class="progress-bar"></div>
                `;
                pollList.appendChild(pollDiv);

                // Listen to real-time updates
                onSnapshot(doc.ref, (updatedDoc) => {
                    updatePollDisplay(updatedDoc);
                });
            });
        } catch (error) {
            console.error('Error getting polls: ', error);
        }
    }

    function updatePollDisplay(updatedDoc) {
        const poll = updatedDoc.data();
        const totalVotes = poll.votes.reduce((acc, val) => acc + val, 0);
        const progressDiv = document.getElementById(`progress-${updatedDoc.id}`);
        const optionsDiv = document.getElementById(`poll-options-${updatedDoc.id}`);

        progressDiv.innerHTML = poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (poll.votes[index] / totalVotes * 100).toFixed(2) : 0;
            return `
                <div class="progress-option">
                    <span>${option}</span>
                    <div class="progress-bar-inner" style="width: ${percentage}%"></div>
                    <span>${percentage}%</span>
                </div>
            `;
        }).join('');
    }

    window.vote = async function(pollId, optionIndex) {
        if (auth.currentUser) {
            try {
                const pollRef = doc(db, 'polls', pollId);
                const pollDoc = await getDoc(pollRef);
                const poll = pollDoc.data();

                // Update poll votes
                const updatedVotes = [...poll.votes];
                updatedVotes[optionIndex] += 1;

                await updateDoc(pollRef, { votes: updatedVotes });

                // Record user's vote
                await addDoc(collection(db, 'pollResponses'), {
                    pollId: pollId,
                    optionIndex: optionIndex,
                    uid: auth.currentUser.uid,
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error('Error voting: ', error);
            }
        } else {
            alert('You must be logged in to vote.');
        }
    }

    displayPolls();
}
