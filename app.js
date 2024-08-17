import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDLKPOqok8VS3gR4TAEGCEH4IEJL8kKpvw",
    authDomain: "ind-edu-f63b0.firebaseapp.com",
    projectId: "ind-edu-f63b0",
    storageBucket: "ind-edu-f63b0.appspot.com",
    messagingSenderId: "405906160405",
    appId: "1:405906160405:web:7040d4f0118fa01d13071c",
    measurementId: "G-EPQM943Y2V"
};

// Initialize Firebase
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
    const viewPollsButton = document.getElementById('view-polls');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Welcome back!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing in: ', error);
        }
    });

    document.getElementById('sign-up').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Welcome to Ind Edu!');
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing up: ', error);
        }
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

    viewPollsButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Main index page logic for polls
if (window.location.pathname.includes('index.html')) {
    const pollForm = document.getElementById('poll-form');
    const signOutButton = document.getElementById('sign-out');

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
        const pollQuestion = document.getElementById('poll-question').value;
        const options = document.getElementById('poll-options').value.split(',').map(opt => opt.trim());

        if (pollQuestion.trim() === '' || options.length === 0) {
            alert('Poll question and options cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'polls'), {
                    question: pollQuestion,
                    options: options,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid
                });
                document.getElementById('poll-question').value = '';
                document.getElementById('poll-options').value = '';
                displayPolls();
                alert('Poll added successfully!');
            } catch (error) {
                console.error('Error adding poll: ', error);
            }
        } else {
            alert('You must be logged in to create a poll.');
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    async function displayPolls() {
        const pollList = document.getElementById('poll-list');
        pollList.innerHTML = '';

        try {
            const q = query(collection(db, 'polls'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                const poll = doc.data();
                const pollDiv = document.createElement('div');
                pollDiv.classList.add('poll');

                // Format timestamp
                const timestamp = poll.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                pollDiv.innerHTML = `
                    <div class="question">${poll.question}</div>
                    <div class="options">
                        ${poll.options.map(option => `<button onclick="vote('${doc.id}', '${option}')">${option}</button>`).join('')}
                    </div>
                    <div class="date">Published on: ${formattedDate}</div>
                    <div class="actions">
                        ${auth.currentUser && auth.currentUser.uid === poll.uid ? `
                            <button class="edit-btn" onclick="editPoll('${doc.id}', '${poll.question}', '${poll.options.join(',')}')"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deletePoll('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                        ` : ''}
                    </div>
                `;
                pollList.appendChild(pollDiv);
            });
        } catch (error) {
            console.error('Error getting polls: ', error);
        }
    }

    window.editPoll = async function(pollId, currentQuestion, currentOptions) {
        const newQuestion = prompt('Edit your poll question:', currentQuestion);
        const newOptions = prompt('Edit your poll options (comma separated):', currentOptions);
        if (newQuestion !== null && newOptions !== null && newQuestion.trim() !== '' && newOptions.trim() !== '') {
            try {
                const pollRef = doc(db, 'polls', pollId);
                await updateDoc(pollRef, {
                    question: newQuestion,
                    options: newOptions.split(',').map(opt => opt.trim())
                });
                displayPolls();
            } catch (error) {
                console.error('Error updating poll: ', error);
            }
        }
    };

    window.deletePoll = async function(pollId) {
        if (confirm('Are you sure you want to delete this poll?')) {
            try {
                await deleteDoc(doc(db, 'polls', pollId));
                displayPolls();
            } catch (error) {
                console.error('Error deleting poll: ', error);
            }
        }
    };

    function vote(pollId, option) {
        if (auth.currentUser) {
            try {
                addDoc(collection(db, 'pollResponses'), {
                    pollId: pollId,
                    option: option,
                    uid: auth.currentUser.uid,
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error('Error submitting vote: ', error);
            }
        } else {
            alert('You must be logged in to vote.');
        }
    }

    displayPolls();
}
