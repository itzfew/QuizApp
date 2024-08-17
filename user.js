import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

document.getElementById('sign-out').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out: ', error);
    }
});

async function displayExams() {
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
                <button class="start-exam-btn" onclick="startExam('${doc.id}')">Start Exam</button>
            `;
            examList.appendChild(examDiv);
        });
    } catch (error) {
        console.error('Error displaying exams: ', error);
    }
}

async function startExam(examId) {
    // Redirect to the exam page or show quiz interface
    window.location.href = `quiz.html?examId=${examId}`;
}

// Initial display of exams
displayExams();
