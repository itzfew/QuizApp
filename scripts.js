import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';

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

// Handle user authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('sign-out').style.display = 'inline';
        document.getElementById('admin-link').style.display = 'inline';
    } else {
        document.getElementById('sign-out').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';
    }
});

// Sign out function
document.getElementById('sign-out').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out: ', error);
    }
});

// Create New Exam
document.getElementById('create-exam-button').addEventListener('click', async () => {
    const title = document.getElementById('exam-title').value.trim();
    const description = document.getElementById('exam-description').value.trim();

    if (title === '' || description === '') {
        alert('Title and description cannot be empty.');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to create an exam.');
            return;
        }

        const examRef = await addDoc(collection(db, 'exams'), {
            title: title,
            description: description,
            timestamp: serverTimestamp(),
            creatorId: user.uid
        });

        alert('Exam created successfully!');
        document.getElementById('exam-title').value = '';
        document.getElementById('exam-description').value = '';
        displayExamsAdmin(); // Refresh exams list
        displayManageQuestions(examRef.id); // Show manage questions section
    } catch (error) {
        console.error('Error creating exam: ', error);
        alert('An error occurred while creating the exam.');
    }
});

// Display Exams for Admin
async function displayExamsAdmin() {
    const examList = document.getElementById('exam-list');
    examList.innerHTML = '';

    try {
        const q = query(collection(db, 'exams'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const exam = doc.data();
            const examDiv = document.createElement('div');
            examDiv.className = 'exam';
            examDiv.innerHTML = `
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <div class="actions">
                    <button class="edit-btn" onclick="editExam('${doc.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteExam('${doc.id}')">Delete</button>
                </div>
            `;
            examList.appendChild(examDiv);
        });
    } catch (error) {
        console.error('Error displaying exams: ', error);
    }
}

// Edit Exam (Admin)
async function editExam(examId) {
    // Logic to edit exam (e.g., show form with current exam details)
    console.log('Edit exam', examId);
}

// Delete Exam
async function deleteExam(examId) {
    try {
        await deleteDoc(doc(db, 'exams', examId));
        alert('Exam deleted successfully!');
        displayExamsAdmin(); // Refresh exams list
    } catch (error) {
        console.error('Error deleting exam: ', error);
        alert('An error occurred while deleting the exam.');
    }
}

// Manage Questions for Exam
async function displayManageQuestions(examId) {
    // Add logic to manage questions for the given exam ID
    console.log('Manage questions for exam', examId);
}

// Display Exams for Users
async function displayExamsUser() {
    const examsList = document.getElementById('exams-list');
    examsList.innerHTML = '';

    try {
        const q = query(collection(db, 'exams'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const exam = doc.data();
            const examDiv = document.createElement('div');
            examDiv.className = 'exam';
            examDiv.innerHTML = `
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <button onclick="startExam('${doc.id}')">Start Exam</button>
            `;
            examsList.appendChild(examDiv);
        });
    } catch (error) {
        console.error('Error displaying exams for users: ', error);
    }
}

// Start Exam
async function startExam(examId) {
    // Logic to start the exam and display questions
    console.log('Starting exam', examId);
}

// Initialize page based on user role
window.onload = function() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'admin.html') {
        displayExamsAdmin();
    } else if (currentPage === 'index.html') {
        displayExamsUser();
    }
};
