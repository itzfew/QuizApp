import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLgqLgIcMW4H4pLN3gkFj9BxlV5sFfP0Y",
  authDomain: "quiz-app-6e2d9.firebaseapp.com",
  projectId: "quiz-app-6e2d9",
  storageBucket: "quiz-app-6e2d9.appspot.com",
  messagingSenderId: "332558194676",
  appId: "1:332558194676:web:9b946ac840f8c2630875b2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Update UI based on authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('sign-out').style.display = 'inline';
        document.getElementById('admin-link').style.display = user.email === "admin@example.com" ? 'inline' : 'none';
        if (document.getElementById('admin-link').style.display === 'inline') {
            displayExamsAdmin();
        } else {
            displayQuizzes();
        }
    } else {
        document.getElementById('sign-out').style.display = 'none';
        document.getElementById('admin-link').style.display = 'none';
        window.location.href = 'index.html';
    }
});

// Handle Sign Out
document.getElementById('sign-out').addEventListener('click', () => {
    signOut(auth).then(() => {
        alert('Signed out successfully.');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Sign out error: ', error);
    });
});

// Display Quizzes on Main Page
async function displayQuizzes() {
    const quizzesDiv = document.getElementById('quizzes');
    quizzesDiv.innerHTML = '';
    
    const q = query(collection(db, 'exams'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
        const exam = doc.data();
        const examDiv = document.createElement('div');
        examDiv.className = 'quiz';
        examDiv.innerHTML = `
            <h3>${exam.title}</h3>
            <p>${exam.description}</p>
            <button onclick="startExam('${doc.id}')">Start Exam</button>
        `;
        quizzesDiv.appendChild(examDiv);
    });
}

// Start Exam
function startExam(examId) {
    window.location.href = `exam.html?examId=${examId}`;
}

// Display Exam Content on Exam Page
async function displayExamContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    const examContentDiv = document.getElementById('exam-content');
    examContentDiv.innerHTML = '';

    if (!examId) {
        alert('Invalid exam ID.');
        return;
    }

    const examDoc = doc(db, 'exams', examId);
    const examSnapshot = await getDocs(examDoc);
    const questionsSnapshot = await getDocs(collection(examDoc, 'questions'));

    if (examSnapshot.exists()) {
        const exam = examSnapshot.data();
        examContentDiv.innerHTML += `<h2>${exam.title}</h2><p>${exam.description}</p>`;

        questionsSnapshot.forEach((questionDoc) => {
            const question = questionDoc.data();
            examContentDiv.innerHTML += `
                <div class="question">
                    <p>${question.questionText}</p>
                    ${question.options.map((option, index) => `
                        <label>
                            <input type="radio" name="${questionDoc.id}" value="${index}"> ${option}
                        </label>
                    `).join('<br>')}
                </div>
            `;
        });
    } else {
        examContentDiv.innerHTML = '<p>Exam not found.</p>';
    }
}

// Handle Exam Submission
document.getElementById('submit-answers').addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    const questionsSnapshot = await getDocs(collection(doc(db, 'exams', examId), 'questions'));

    let score = 0;
    let totalQuestions = 0;

    questionsSnapshot.forEach((questionDoc) => {
        const question = questionDoc.data();
        const selectedOption = document.querySelector(`input[name="${questionDoc.id}"]:checked`);
        if (selectedOption) {
            if (parseInt(selectedOption.value) === question.correctOption) {
                score++;
            }
            totalQuestions++;
        }
    });

    const user = auth.currentUser;
    if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
            results: { ...user.results, [examId]: { score, totalQuestions } }
        });
        alert(`Exam submitted! You scored ${score}/${totalQuestions}.`);
        window.location.href = 'index.html';
    } else {
        alert('User not authenticated.');
    }
});

// Display Exams in Admin Dashboard
async function displayExamsAdmin() {
    const examsDiv = document.getElementById('exams');
    examsDiv.innerHTML = '';

    const q = query(collection(db, 'exams'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const exam = doc.data();
        const examDiv = document.createElement('div');
        examDiv.className = 'exam';
        examDiv.innerHTML = `
            <h3>${exam.title}</h3>
            <p>${exam.description}</p>
            <button onclick="editExam('${doc.id}')">Edit</button>
            <button onclick="deleteExam('${doc.id}')">Delete</button>
        `;
        examsDiv.appendChild(examDiv);
    });
}

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
    }
});

// Edit Exam (Show manage questions section)
function editExam(examId) {
    displayManageQuestions(examId);
}

// Show Manage Questions Section
async function displayManageQuestions(examId) {
    document.getElementById('manage-questions').style.display = 'block';
    document.getElementById('create-exam').style.display = 'none';
    document.getElementById('exam-list').style.display = 'none';

    // Handle Add Question
    document.getElementById('add-question').addEventListener('click', async () => {
        const questionText = document.getElementById('question-text').value.trim();
        const options = [
            document.getElementById('option-1').value.trim(),
            document.getElementById('option-2').value.trim(),
            document.getElementById('option-3').value.trim(),
            document.getElementById('option-4').value.trim()
        ];
        const correctOption = parseInt(document.getElementById('correct-option').value.trim());

        if (questionText === '' || options.some(option => option === '') || isNaN(correctOption) || correctOption < 0 || correctOption >= options.length) {
            alert('Invalid question or options.');
            return;
        }

        try {
            await addDoc(collection(db, 'exams', examId, 'questions'), {
                questionText: questionText,
                options: options,
                correctOption: correctOption,
                timestamp: serverTimestamp()
            });
            alert('Question added successfully!');
            document.getElementById('question-text').value = '';
            document.getElementById('option-1').value = '';
            document.getElementById('option-2').value = '';
            document.getElementById('option-3').value = '';
            document.getElementById('option-4').value = '';
            document.getElementById('correct-option').value = '';
        } catch (error) {
            console.error('Error adding question: ', error);
        }
    });
}

// Delete Exam
async function deleteExam(examId) {
    try {
        await deleteDoc(doc(db, 'exams', examId));
        alert('Exam deleted successfully!');
        displayExamsAdmin(); // Refresh exams list
    } catch (error) {
        console.error('Error deleting exam: ', error);
    }
}

// Initialize page based on URL
if (window.location.pathname.endsWith('exam.html')) {
    displayExamContent();
} else if (window.location.pathname.endsWith('admin.html')) {
    displayExamsAdmin();
}
