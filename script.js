let selectedQuestions = [];
let userAnswers = [];
let currentQuestion = 0;
let numQuestions = 0;
let quizHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
let timerInterval;
let timeLeft = 0; // Total time in seconds

document.getElementById('startButton').addEventListener('click', startQuiz);
document.getElementById('prevButton').addEventListener('click', () => changeQuestion(-1));
document.getElementById('nextButton').addEventListener('click', () => changeQuestion(1));
document.getElementById('submitButton').addEventListener('click', submitQuiz);

async function startQuiz() {
    const subject = document.getElementById('subject').value;
    numQuestions = parseInt(document.getElementById('numQuestions').value) || 5;
    selectedQuestions = await getQuestions(subject, numQuestions);
    userAnswers = new Array(numQuestions).fill(null);
    currentQuestion = 0;
    timeLeft = numQuestions * 60; // Total time in seconds
    document.getElementById('setup').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    displayQuestion();
    startTimer();
    updateProgressBar();
}

async function getQuestions(subject, num) {
    const response = await fetch('questions.json');
    const data = await response.json();
    const questions = data[subject];
    
    if (questions.length < num) {
        alert(`Not enough questions available in ${subject}. Showing ${questions.length} questions instead.`);
        num = questions.length;
    }
    
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60 < 10 ? '0' : '')}${timeLeft % 60}`;
        updateProgressBar();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your quiz.");
            submitQuiz();
        }
    }, 1000);
}

function updateProgressBar() {
    const progress = ((currentQuestion + 1) / numQuestions) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

function displayQuestion() {
    const question = selectedQuestions[currentQuestion];
    document.getElementById('question').innerText = question.question;
    const options = document.getElementById('options');
    options.innerHTML = '';
    question.options.forEach((option, index) => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = index;
        if (userAnswers[currentQuestion] === index) {
            input.checked = true;
        }
        input.addEventListener('change', () => userAnswers[currentQuestion] = index);
        li.appendChild(input);
        li.appendChild(document.createTextNode(option));
        options.appendChild(li);
    });
    updateQuestionNumbers();
}

function changeQuestion(direction) {
    currentQuestion += direction;
    if (currentQuestion >= numQuestions) {
        alert("Questions ended. Please submit your answers.");
        currentQuestion = numQuestions - 1;
    } else if (currentQuestion < 0) {
        currentQuestion = 0;
    }
    displayQuestion();
}

function updateQuestionNumbers() {
    const questionNumbers = document.getElementById('questionNumbers');
    questionNumbers.innerHTML = '';
    for (let i = 0; i < numQuestions; i++) {
        const button = document.createElement('button');
        button.innerText = i + 1;
        if (userAnswers[i] !== null) {
            button.classList.add('selected');
        } else if (i === currentQuestion) {
            button.classList.add('solving');
        } else {
            button.classList.add('upcoming');
        }
        button.addEventListener('click', () => {
            currentQuestion = i;
            displayQuestion();
        });
        questionNumbers.appendChild(button);
    }
}

function submitQuiz() {
    clearInterval(timerInterval); // Stop the timer
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let missedCount = 0;

    selectedQuestions.forEach((question, i) => {
        const userAnswer = userAnswers[i];
        const isCorrect = userAnswer === question.correct;
        if (isCorrect) {
            score += 4;
            correctCount++;
        } else if (userAnswer !== null) {
            score -= 1;
            incorrectCount++;
        } else {
            missedCount++;
        }
    });

    const totalMarks = numQuestions * 4; // Maximum marks
    const percentage = (score / totalMarks) * 100;

    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = `
        <h2>Results</h2>
        <p><strong>Total Questions:</strong> ${numQuestions}</p>
        <p><strong>Correct:</strong> ${correctCount}</p>
        <p><strong>Incorrect:</strong> ${incorrectCount}</p>
        <p><strong>Missed:</strong> ${missedCount}</p>
        <p><strong>Total Marks Obtained:</strong> ${score} / ${totalMarks}</p>
        <p><strong>Percentage:</strong> ${percentage.toFixed(2)}%</p>
    `;

    document.getElementById('quiz').style.display = 'none';
    resultContainer.style.display = 'block';

    // Save quiz result to local history
    const quizResult = {
        date: new Date().toLocaleString(),
        score: score,
        totalQuestions: numQuestions,
        correct: correctCount,
        incorrect: incorrectCount,
        missed: missedCount
    };
    quizHistory.push(quizResult);
    localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
    displayHistory();
}

function displayHistory() {
    const historyContainer = document.getElementById('history');
    historyContainer.innerHTML = `<h2>Quiz History</h2>`;
    
    quizHistory.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('result-item');
        resultDiv.innerHTML = `
            <p><strong>Date:</strong> ${result.date}</p>
            <p><strong>Score:</strong> ${result.score}</p>
            <p><strong>Total Questions:</strong> ${result.totalQuestions}</p>
            <p><strong>Correct:</strong> ${result.correct}</p>
            <p><strong>Incorrect:</strong> ${result.incorrect}</p>
            <p><strong>Missed:</strong> ${result.missed}</p>
        `;
        historyContainer.appendChild(resultDiv);
    });
    historyContainer.style.display = 'block';
}
