// User Authentication Functions
function register(email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('User registered:', userCredential.user);
    })
    .catch((error) => {
      console.error('Error registering:', error);
    });
}

function login(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('User logged in:', userCredential.user);
    })
    .catch((error) => {
      console.error('Error logging in:', error);
    });
}

function logout() {
  auth.signOut()
    .then(() => {
      console.log('User logged out');
    })
    .catch((error) => {
      console.error('Error logging out:', error);
    });
}

// Fetch and Display Quiz
function displayQuiz(quizId) {
  db.collection('quizzes').doc(quizId).get()
    .then((doc) => {
      if (doc.exists) {
        const quiz = doc.data();
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `<h2>${quiz.title}</h2>`;
        quiz.questions.forEach((q, index) => {
          appDiv.innerHTML += `<p>${q.question}</p>`;
          q.options.forEach((option, i) => {
            appDiv.innerHTML += `<label><input type="radio" name="${q.id}" value="${option}">${option}</label><br>`;
          });
        });
        appDiv.innerHTML += '<button onclick="submitQuiz()">Submit</button>';
      } else {
        console.log('No such quiz!');
      }
    })
    .catch((error) => {
      console.error('Error fetching quiz:', error);
    });
}

// Handle Quiz Submission
function submitQuiz() {
  // Implement quiz submission logic here
}

// Add Quiz Function
function addQuiz(title, questions) {
  db.collection('quizzes').add({
    title: title,
    questions: questions
  })
  .then((docRef) => {
    console.log('Quiz added with ID:', docRef.id);
  })
  .catch((error) => {
    console.error('Error adding quiz:', error);
  });
}
