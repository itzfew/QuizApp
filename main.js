import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const db = getFirestore(app);

window.addEventListener('load', async () => {
    const examContainer = document.getElementById('exam-container');
    const querySnapshot = await getDocs(collection(db, "exams"));

    querySnapshot.forEach((doc) => {
        const examData = doc.data();
        const examElement = document.createElement('div');
        examElement.innerHTML = `<h2>${examData.title}</h2>`;
        examData.questions.forEach((question, index) => {
            examElement.innerHTML += `<p>${index + 1}. ${question.text}</p>`;
            question.options.forEach(option => {
                examElement.innerHTML += `<input type="radio" name="q${index}" value="${option}"> ${option}<br>`;
            });
        });
        examContainer.appendChild(examElement);
    });

    document.getElementById('submit-exam').addEventListener('click', async () => {
        // Collect user responses and handle submission logic
        // e.g., submitAnswersToServer(userAnswers);
    });
});
