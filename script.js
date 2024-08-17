const auth = firebase.auth();
const database = firebase.database();

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('login-status').textContent = 'Login successful!';
            loadQuiz();
            loadPolls();
        })
        .catch((error) => {
            document.getElementById('login-status').textContent = `Error: ${error.message}`;
        });
});

function loadQuiz() {
    database.ref('quizzes').once('value').then(snapshot => {
        const quizzes = snapshot.val();
        const quizContainer = document.getElementById('quiz-container');
        
        quizContainer.innerHTML = '';

        Object.keys(quizzes).forEach(quizId => {
            const quiz = quizzes[quizId];
            const quizElement = document.createElement('div');
            quizElement.innerHTML = `
                <h2>${quiz.question}</h2>
                ${quiz.options.map((option, index) => `
                    <div>
                        <input type="radio" name="option${quizId}" value="${index}">
                        <label>${option}</label>
                    </div>
                `).join('')}
                <button onclick="submitAnswer('${quizId}', ${quiz.correctOption})">Submit</button>
                <p id="result${quizId}"></p>
            `;
            quizContainer.appendChild(quizElement);
        });
    });
}

function submitAnswer(quizId, correctOption) {
    const selectedOption = document.querySelector(`input[name="option${quizId}"]:checked`);
    const resultElement = document.getElementById(`result${quizId}`);
    
    if (selectedOption) {
        const answer = parseInt(selectedOption.value);
        if (answer === correctOption) {
            resultElement.textContent = 'Correct!';
            resultElement.style.color = 'green';
        } else {
            resultElement.textContent = 'Incorrect!';
            resultElement.style.color = 'red';
        }
    } else {
        resultElement.textContent = 'Please select an answer.';
        resultElement.style.color = 'orange';
    }
}

function loadPolls() {
    database.ref('polls').once('value').then(snapshot => {
        const polls = snapshot.val();
        const pollsContainer = document.getElementById('polls-container');
        
        pollsContainer.innerHTML = '';

        Object.keys(polls).forEach(pollId => {
            const poll = polls[pollId];
            const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
            const pollElement = document.createElement('div');
            pollElement.innerHTML = `
                <h2>${poll.question}</h2>
                ${Object.keys(poll.options).map(optionId => `
                    <div>
                        <input type="radio" name="poll${pollId}" value="${optionId}">
                        <label>${poll.options[optionId]}</label>
                        <div class="progress-bar" style="width: ${poll.votes[optionId] / totalVotes * 100}%"></div>
                    </div>
                `).join('')}
                <button onclick="submitPoll('${pollId}')">Vote</button>
                <p id="poll-result${pollId}"></p>
            `;
            pollsContainer.appendChild(pollElement);
        });
    });
}

function submitPoll(pollId) {
    const selectedOption = document.querySelector(`input[name="poll${pollId}"]:checked`);
    const resultElement = document.getElementById(`poll-result${pollId}`);
    
    if (selectedOption) {
        const optionId = selectedOption.value;
        
        database.ref(`polls/${pollId}/votes/${optionId}`).transaction(votes => (votes || 0) + 1, (error, committed) => {
            if (committed) {
                resultElement.textContent = 'Vote recorded!';
                resultElement.style.color = 'green';
                loadPolls();
            } else {
                resultElement.textContent = `Error: ${error.message}`;
                resultElement.style.color = 'red';
            }
        });
    } else {
        resultElement.textContent = 'Please select an option.';
        resultElement.style.color = 'orange';
    }
}
