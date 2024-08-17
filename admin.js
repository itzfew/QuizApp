import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

document.getElementById('create-exam-button').addEventListener('click', async () => {
    const title = document.getElementById('exam-title').value;
    const description = document.getElementById('exam-description').value;

    if (title.trim() === '' || description.trim() === '') {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const docRef = await addDoc(collection(db, 'exams'), {
            title: title,
            description: description,
            timestamp: new Date()
        });
        alert('Exam created successfully!');
        document.getElementById('exam-title').value = '';
        document.getElementById('exam-description').value = '';
        displayExamsAdmin();
    } catch (error) {
        console.error('Error creating exam: ', error);
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
                    <button class="manage-questions-btn" onclick="manageQuestions('${doc.id}')">Manage Questions</button>
                </div>
            `;
            examList.appendChild(examDiv);
        });
    } catch (error) {
        console.error('Error displaying exams: ', error);
    }
}

async function editExam(examId) {
    // Implement the logic to edit exam details if needed
    console.log('Edit exam', examId);
}

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

function manageQuestions(examId) {
    document.getElementById('manage-exams').style.display = 'none';
    document.getElementById('manage-questions').style.display = 'block';
    document.getElementById('add-question-button').setAttribute('data-exam-id', examId);
    displayQuestions(examId);
}

document.getElementById('add-question-button').addEventListener('click', async () => {
    const examId = document.getElementById('add-question-button').getAttribute('data-exam-id');
    const questionText = document.getElementById('question-text').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    const option3 = document.getElementById('option3').value;
    const option4 = document.getElementById('option4').value;
    const correctOption = document.getElementById('correct-option').value;

    if (questionText.trim() === '' || option1.trim() === '' || option2.trim() === '' || option3.trim() === '' || option4.trim() === '') {
        alert('Please fill in all fields.');
        return;
    }

    try {
        await addDoc(collection(db, 'questions'), {
            examId: examId,
            questionText: questionText,
            options: {
                option1: option1,
                option2: option2,
                option3: option3,
                option4: option4,
                correctOption: correctOption
            }
        });
        alert('Question added successfully!');
        document.getElementById('question-text').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        document.getElementById('option3').value = '';
        document.getElementById('option4').value = '';
        displayQuestions(examId); // Refresh questions list
    } catch (error) {
        console.error('Error adding question: ', error);
    }
});

async function displayQuestions(examId) {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';

    try {
        const q = query(collection(db, 'questions'), where('examId', '==', examId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const question = doc.data();
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <h5>${question.questionText}</h5>
                <ul>
                    <li>${question.options.option1}</li>
                    <li>${question.options.option2}</li>
                    <li>${question.options.option3}</li>
                    <li>${question.options.option4}</li>
                </ul>
                <p>Correct Answer: ${question.options.correctOption}</p>
            `;
            questionsList.appendChild(questionDiv);
        });
    } catch (error) {
        console.error('Error displaying questions: ', error);
    }
}

// Initial display of exams
displayExamsAdmin();
