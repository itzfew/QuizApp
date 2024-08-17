import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
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

const urlParams = new URLSearchParams(window.location.search);
const examId = urlParams.get('examId');

async function displayQuiz() {
    const quizContainer = document.getElementById('quiz-container');

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
                    <li><input type="radio" name="${doc.id}" value="option1"> ${question.options.option1}</li>
                    <li><input type="radio" name="${doc.id}" value="option2"> ${question.options.option2}</li>
                    <li><input type="radio" name="${doc.id}" value="option3"> ${question.options.option3}</li>
                    <li><input type="radio" name="${doc.id}" value="option4"> ${question.options.option4}</li>
                </ul>
            `;
            quizContainer.appendChild(questionDiv);
        });
    } catch (error) {
        console.error('Error displaying questions: ', error);
    }
}

displayQuiz();
