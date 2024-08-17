import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase configuration and initialization
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

// Main index page logic
if (window.location.pathname.includes('index.html')) {
    const pollForm = document.getElementById('poll-form');
    const signOutButton = document.getElementById('sign-out');

    onAuthStateChanged(auth, user => {
        if (user) {
            pollForm.style.display = 'block';
            signOutButton.style.display = 'inline';
            displayPolls();
        } else {
            pollForm.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('submit-poll').addEventListener('click', async () => {
        const pollQuestion = document.getElementById('poll-question').value;
        const pollOptions = Array.from(document.querySelectorAll('.poll-option')).map(option => option.value);
        if (pollQuestion.trim() === '' || pollOptions.some(option => option.trim() === '')) {
            alert('Poll question and options cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'polls'), {
                    question: pollQuestion,
                    options: pollOptions,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    responses: {}
                });
                document.getElementById('poll-question').value = '';
                document.querySelectorAll('.poll-option').forEach(option => option.value = '');
                displayPolls();
                alert('Poll added successfully!');
            } catch (error) {
                console.error('Error adding poll: ', error);
            }
        } else {
            alert('You must be logged in to create a poll.');
        }
    });

    document.getElementById('add-option').addEventListener('click', () => {
        const optionDiv = document.createElement('div');
        optionDiv.innerHTML = `<input type="text" class="poll-option" placeholder="New Option" />`;
        document.getElementById('poll-options').appendChild(optionDiv);
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

                // Check if poll creator is the current user
                const isCreator = auth.currentUser && auth.currentUser.uid === poll.uid;

                // Calculate progress percentages
                const totalVotes = Object.keys(poll.responses).length;
                const optionCounts = poll.options.map((_, index) => 
                    Object.values(poll.responses).filter(response => response === index.toString()).length
                );
                const optionPercentages = optionCounts.map(count => totalVotes === 0 ? 0 : (count / totalVotes * 100).toFixed(2));

                pollDiv.innerHTML = `
                    <div class="question">${poll.question}</div>
                    <div class="options">
                        ${poll.options.map((option, index) => `
                            <div class="option">
                                <label>
                                    <input type="radio" name="poll-${doc.id}" value="${index}" ${poll.responses[auth.currentUser?.uid] == index.toString() ? 'checked' : ''}> ${option}
                                </label>
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${optionPercentages[index]}%">${optionPercentages[index]}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="actions">
                        ${isCreator ? `
                            <button class="edit-btn" onclick="editPoll('${doc.id}', '${poll.question}', ${JSON.stringify(poll.options)})"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deletePoll('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                        ` : ''}
                        <button class="vote-btn" onclick="votePoll('${doc.id}')"><i class="fa fa-vote"></i> Vote</button>
                    </div>
                    <div class="date">Created on: ${formattedDate}</div>
                `;
                pollList.appendChild(pollDiv);
            });
        } catch (error) {
            console.error('Error getting polls: ', error);
        }
    }

    window.editPoll = async function(pollId, currentQuestion, currentOptions) {
        const newQuestion = prompt('Edit your poll question:', currentQuestion);
        if (newQuestion !== null && newQuestion.trim() !== '') {
            const newOptions = prompt('Edit your options (comma separated):', currentOptions.join(','));
            if (newOptions !== null) {
                const optionsArray = newOptions.split(',').map(option => option.trim());
                try {
                    const pollRef = doc(db, 'polls', pollId);
                    await updateDoc(pollRef, {
                        question: newQuestion,
                        options: optionsArray
                    });
                    displayPolls();
                } catch (error) {
                    console.error('Error updating poll: ', error);
                }
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

    window.votePoll = async function(pollId) {
        const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);
        if (selectedOption) {
            const selectedValue = selectedOption.value;
            try {
                const pollRef = doc(db, 'polls', pollId);
                await updateDoc(pollRef, {
                    [`responses.${auth.currentUser.uid}`]: selectedValue
                });
                displayPolls();
                alert('Your vote has been recorded!');
            } catch (error) {
                console.error('Error voting on poll: ', error);
            }
        } else {
            alert('Please select an option before voting.');
        }
    };
}
