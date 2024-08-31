// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
    authDomain: "quizapp-1ae20.firebaseapp.com",
    databaseURL: "https://quizapp-1ae20-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quizapp-1ae20",
    storageBucket: "quizapp-1ae20.appspot.com",
    messagingSenderId: "626886802317",
    appId: "1:626886802317:web:df08c307697ca235c45bc4",
    measurementId: "G-NKJTC5C1XW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    const createQuizButton = document.getElementById('create-quiz');
    const saveQuizButton = document.getElementById('save-quiz');
    const submitQuizButton = document.getElementById('submit-quiz');
    const addQuestionButton = document.getElementById('add-question');

    createQuizButton.addEventListener('click', () => {
        document.getElementById('create-quiz-section').style.display = 'none';
        document.getElementById('create-quiz-form').style.display = 'block';
    });

    addQuestionButton.addEventListener('click', () => {
        const questionIndex = document.querySelectorAll('#questions-container .question').length;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.innerHTML = `
            <input type="text" placeholder="Question ${questionIndex + 1}" class="question-text"><br>
            <input type="text" placeholder="Option 1" class="option"><br>
            <input type="text" placeholder="Option 2" class="option"><br>
            <input type="text" placeholder="Option 3" class="option"><br>
            <input type="text" placeholder="Option 4" class="option"><br>
        `;
        document.getElementById('questions-container').appendChild(questionDiv);
    });

    saveQuizButton.addEventListener('click', () => {
        const title = document.getElementById('quiz-title').value;
        const questions = Array.from(document.querySelectorAll('#questions-container .question')).map(qDiv => {
            const questionText = qDiv.querySelector('.question-text').value;
            const options = Array.from(qDiv.querySelectorAll('.option')).map(o => o.value);
            return { text: questionText, options };
        });

        db.collection('quizzes').add({ title, questions }).then(docRef => {
            const quizId = docRef.id;
            alert(`Quiz created with ID: ${quizId}`);
            document.getElementById('create-quiz-form').style.display = 'none';
            document.getElementById('create-quiz-section').style.display = 'block';
            fetchQuizzes(); // Refresh the quiz list
        }).catch(error => {
            console.error('Error saving quiz:', error);
        });
    });

    submitQuizButton.addEventListener('click', () => {
        submitQuiz();
    });

    fetchQuizzes(); // Fetch quizzes on load
});

function fetchQuizzes() {
    db.collection('quizzes').get().then((querySnapshot) => {
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = ''; // Clear previous list
        querySnapshot.forEach((doc) => {
            const quiz = doc.data();
            const li = document.createElement('li');
            li.textContent = quiz.title;
            li.dataset.id = doc.id;
            li.addEventListener('click', () => {
                window.location.href = `?quiz=${doc.id}`;
            });
            quizList.appendChild(li);
        });
    }).catch(error => {
        console.error('Error fetching quizzes:', error);
    });
}

function loadQuiz(quizId) {
    db.collection('quizzes').doc(quizId).get().then((doc) => {
        if (doc.exists) {
            const quiz = doc.data();
            document.getElementById('quiz-title-display').textContent = quiz.title;
            const form = document.getElementById('quiz-form');
            form.innerHTML = '';
            quiz.questions.forEach((question, index) => {
                const div = document.createElement('div');
                div.innerHTML = `<p>${question.text}</p>`;
                question.options.forEach((option, i) => {
                    div.innerHTML += `
                        <input type="radio" name="q${index}" value="${i}" id="q${index}-o${i}">
                        <label for="q${index}-o${i}">${option}</label><br>
                    `;
                });
                form.appendChild(div);
            });
            document.getElementById('quiz-container').style.display = 'block';
            document.getElementById('result-container').style.display = 'none';
            document.getElementById('quiz-results').style.display = 'none';
        }
    }).catch(error => {
        console.error('Error loading quiz:', error);
    });
}

function submitQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    if (!quizId) return;

    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    const answers = {};
    formData.forEach((value, key) => {
        answers[key] = parseInt(value);
    });

    const userName = prompt('Enter your name');

    db.collection('results').add({
        quizId: quizId,
        userName: userName,
        answers: answers,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        displayResults(quizId);
    }).catch(error => {
        console.error('Error submitting quiz:', error);
    });
}

function displayResults(quizId) {
    db.collection('results').where('quizId', '==', quizId).get().then((querySnapshot) => {
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = ''; // Clear previous results
        querySnapshot.forEach((doc) => {
            const result = doc.data();
            const li = document.createElement('li');
            li.textContent = `${result.userName}: ${JSON.stringify(result.answers)}`;
            resultsList.appendChild(li);
        });
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('result-container').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';
    }).catch(error => {
        console.error('Error fetching results:', error);
    });
}

function shareOnWhatsApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    const baseUrl = 'https://your-username.github.io/quiz-app/';
    const quizLink = `${baseUrl}?quiz=${quizId}`;
    const encodedLink = encodeURIComponent(quizLink);
    const whatsappUrl = `https://api.whatsapp.com/send?text=Check%20out%20this%20quiz:%20${encodedLink}`;
    window.open(whatsappUrl, '_blank');
}

// Handle quiz loading based on URL parameter
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    if (quizId) {
        loadQuiz(quizId);
    } else {
        document.getElementById('quiz-selection').style.display = 'block';
    }
});
