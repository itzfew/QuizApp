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
    try {
        const response = await fetch('https://raw.githubusercontent.com/itzfew/QuizApp/refs/heads/main/questions.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const questions = data[subject];

        if (questions.length < num) {
            alert(`Not enough questions available in ${subject}. Showing ${questions.length} questions instead.`);
            num = questions.length;
        }

        const shuffled = questions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
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
    const averageTime = ((numQuestions * 60) / numQuestions); // Average time per question in seconds
    const averageTimeDisplay = `${Math.floor(averageTime / 60)}:${(averageTime % 60 < 10 ? '0' : '')}${averageTime % 60} mins`;

    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = `
        <h2>Results</h2>
        <p><strong>Total Questions:</strong> ${numQuestions}</p>
        <p><strong>Correct:</strong> ${correctCount}</p>
        <p><strong>Incorrect:</strong> ${incorrectCount}</p>
        <p><strong>Missed:</strong> ${missedCount}</p>
        <p><strong>Total Marks Obtained:</strong> ${score} / ${totalMarks}</p>
        <p><strong>Percentage:</strong> ${percentage.toFixed(2)}%</p>
        <p><strong>Average Time Taken per Question:</strong> ${averageTimeDisplay}</p>
        <h3>Detailed Results:</h3>
        ${selectedQuestions.map((question, i) => `
            <div class="result-item">
                <p><strong>Question ${i + 1}:</strong> ${question.question}</p>
                <p class="${userAnswers[i] === question.correct ? 'correct' : 'wrong'}">
                    Your answer: ${userAnswers[i] !== null ? question.options[userAnswers[i]] : 'No answer'}
                    ${userAnswers[i] !== null && userAnswers[i] !== question.correct ? `<br>Correct answer: ${question.options[question.correct]}` : ''}
                </p>
            </div>
        `).join('')}
    `;

    document.getElementById('quiz').style.display = 'none';
    resultContainer.style.display = 'block';

    // Save the result to history
    const quizResult = {
        date: new Date().toLocaleString(),
        questions: selectedQuestions,
        answers: userAnswers,
        score: score
    };
    quizHistory.push(quizResult);
    localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
    displayHistory();
}

function displayHistory() {
    const historyContainer = document.getElementById('history');
    historyContainer.innerHTML = '<h2>History</h2>';
    quizHistory.forEach((quiz, index) => {
        const historyItem = document.createElement('div');
        historyItem.innerHTML = `
            <p><strong>Quiz ${index + 1}</strong> - ${quiz.date} - Score: ${quiz.score}</p>
            <button class="button" onclick="viewHistory(${index})"><i class="fas fa-eye"></i> View</button>
        `;
        historyContainer.appendChild(historyItem);
    });
    historyContainer.style.display = 'block';
}

function viewHistory(index) {
    const quiz = quizHistory[index];
    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = `<h2>Quiz on ${quiz.date}</h2>`;
    quiz.questions.forEach((question, i) => {
        const userAnswer = quiz.answers[i];
        const isCorrect = userAnswer === question.correct;
        const result = document.createElement('div');
        result.className = 'result-item';
        result.innerHTML = `
            <p><strong>Question ${i + 1}:</strong> ${question.question}</p>
            <p class="${isCorrect ? 'correct' : 'wrong'}">
                Your answer: ${userAnswer !== null ? question.options[userAnswer] : 'No answer'}
                ${!isCorrect ? `<br>Correct answer: ${question.options[question.correct]}` : ''}
            </p>
        `;
        resultContainer.appendChild(result);
    });
    document.getElementById('quiz').style.display = 'none';
    resultContainer.style.display = 'block';
}

// Initialize history display
displayHistory();
