// Add Quiz
addQuizForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = document.getElementById('quizQuestion').value;
    const options = document.getElementById('quizOptions').value.split(',');
    const correctOption = parseInt(document.getElementById('quizCorrectOption').value);

    const quizId = Date.now().toString(); // Simple ID generation for demo
    await setDoc(doc(db, 'quizzes', quizId), {
        question: question,
        options: options,
        correctOption: correctOption
    });

    alert('Quiz added successfully!');
    addQuizForm.reset();
});

// Add Poll
addPollForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = document.getElementById('pollQuestion').value;
    const options = document.getElementById('pollOptions').value.split(',');

    const pollId = Date.now().toString(); // Simple ID generation for demo
    await setDoc(doc(db, 'polls', pollId), {
        question: question,
        options: options.reduce((acc, option, index) => {
            acc[`option${index + 1}`] = option;
            return acc;
        }, {}),
        votes: {}
    });

    alert('Poll added successfully!');
    addPollForm.reset();
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Admin signed out');
    } catch (error) {
        console.error('Error signing out:', error);
    }
});
