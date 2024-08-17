// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication and User Management
document.addEventListener('DOMContentLoaded', () => {
  const signInButton = document.getElementById('sign-in');
  const signUpButton = document.getElementById('sign-up');
  const signOutButton = document.getElementById('sign-out');
  const pollForm = document.getElementById('poll-form');
  const submitPollButton = document.getElementById('submit-poll');
  
  const profilePage = window.location.pathname.includes('profile.html');
  const indexPage = window.location.pathname.includes('index.html');
  const settingsPage = window.location.pathname.includes('settings.html');
  
  // Handle Sign In
  if (signInButton) {
    signInButton.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Welcome back!');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error signing in: ', error);
        alert('Failed to sign in. Check your credentials.');
      }
    });
  }
  
  // Handle Sign Up
  if (signUpButton) {
    signUpButton.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully!');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error signing up: ', error);
        alert('Failed to sign up. Check your details.');
      }
    });
  }

  // Handle Sign Out
  if (signOutButton) {
    signOutButton.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'profile.html';
      } catch (error) {
        console.error('Error signing out: ', error);
      }
    });
  }

  // Poll Interaction
  if (indexPage) {
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

    submitPollButton.addEventListener('click', async () => {
      const pollQuestion = document.getElementById('poll-question').value;
      const pollOptions = document.getElementById('poll-options').value.split('\n');
      const user = auth.currentUser;

      if (!user) {
        alert('You must be logged in to create a poll.');
        return;
      }

      if (pollQuestion.trim() === '' || pollOptions.length === 0) {
        alert('Poll question and options cannot be empty.');
        return;
      }

      try {
        const pollData = {
          question: pollQuestion,
          options: pollOptions.reduce((acc, option) => {
            acc[option] = { votes: 0 };
            return acc;
          }, {}),
          creator: user.uid,
          timestamp: serverTimestamp(),
          users: {}
        };
        await addDoc(collection(db, 'polls'), pollData);
        document.getElementById('poll-question').value = '';
        document.getElementById('poll-options').value = '';
        alert('Poll created successfully!');
        displayPolls();
      } catch (error) {
        console.error('Error creating poll: ', error);
      }
    });
  }

  // Display Polls
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
        const pollId = doc.id;

        pollDiv.innerHTML = `
          <h3>${poll.question}</h3>
          <div class="poll-options">
            ${Object.keys(poll.options).map(optionKey => `
              <button class="poll-button" data-poll-id="${pollId}" data-option="${optionKey}">${optionKey}</button>
            `).join('')}
          </div>
          <div id="poll-${pollId}-results" class="poll-results"></div>
        `;

        pollList.appendChild(pollDiv);
        displayPollResults(pollId);
      });

      // Add event listeners for poll buttons
      document.querySelectorAll('.poll-button').forEach(button => {
        button.addEventListener('click', async (event) => {
          const pollId = event.target.dataset.pollId;
          const option = event.target.dataset.option;

          if (!auth.currentUser) {
            alert('You must be logged in to vote.');
            return;
          }

          try {
            const pollRef = doc(db, 'polls', pollId);
            const pollSnapshot = await getDoc(pollRef);
            const pollData = pollSnapshot.data();

            await updateDoc(pollRef, {
              [`options.${option}.votes`]: (pollData.options[option].votes || 0) + 1,
              [`users.${auth.currentUser.uid}`]: option
            });

            alert('Your vote has been recorded.');
            displayPollResults(pollId);
          } catch (error) {
            console.error('Error voting in poll:', error);
          }
        });
      });
    } catch (error) {
      console.error('Error getting polls: ', error);
    }
  }

  // Display Poll Results
  async function displayPollResults(pollId) {
    const pollResultsDiv = document.getElementById(`poll-${pollId}-results`);
    if (!pollResultsDiv) return;

    try {
      const pollRef = doc(db, 'polls', pollId);
      const pollSnapshot = await getDoc(pollRef);
      const pollData = pollSnapshot.data();

      pollResultsDiv.innerHTML = '';
      const totalVotes = Object.values(pollData.options).reduce((acc, opt) => acc + (opt.votes || 0), 0);

      Object.keys(pollData.options).forEach(optionKey => {
        const option = pollData.options[optionKey];
        const votes = option.votes || 0;
        const percentage = totalVotes ? (votes / totalVotes * 100).toFixed(2) : 0;

        const optionDiv = document.createElement('div');
        optionDiv.classList.add('poll-option-result');
        optionDiv.innerHTML = `
          <span>${optionKey}</span>
          <div class="progress-bar">
            <div class="progress-bar-inner" style="width: ${percentage}%"></div>
          </div>
          <span>${votes} votes (${percentage}%)</span>
          ${pollData.users[auth.currentUser?.uid] === optionKey ? '<span class="user-vote">Your vote</span>' : ''}
        `;

        pollResultsDiv.appendChild(optionDiv);
      });
    } catch (error) {
      console.error('Error displaying poll results:', error);
    }
  }

  // Settings Page
  if (settingsPage) {
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
});
