import { db, collection, addDoc, getDocs, doc, runTransaction, updateDoc } from './firebase-config.js';

// Function to create a new poll
window.createPoll = async function() {
    const question = document.getElementById('poll-question').value;
    const option1 = document.getElementById('poll-option1').value;
    const option2 = document.getElementById('poll-option2').value;

    if (question && option1 && option2) {
        try {
            await addDoc(collection(db, 'polls'), {
                question: question,
                options: [option1, option2],
                votes: [0, 0]
            });
            alert('Poll created successfully!');
            loadPolls();
        } catch (error) {
            console.error('Error adding poll: ', error);
        }
    } else {
        alert('Please fill out all fields.');
    }
}

// Function to load polls from Firestore
window.loadPolls = async function() {
    const pollsContainer = document.getElementById('polls');
    pollsContainer.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'polls'));
        querySnapshot.forEach(doc => {
            const pollData = doc.data();
            const pollElement = document.createElement('div');
            pollElement.innerHTML = `
                <h3>${pollData.question}</h3>
                <button onclick="vote('${doc.id}', 0)">Vote for "${pollData.options[0]}" (${pollData.votes[0]})</button>
                <button onclick="vote('${doc.id}', 1)">Vote for "${pollData.options[1]}" (${pollData.votes[1]})</button>
            `;
            pollsContainer.appendChild(pollElement);
        });
    } catch (error) {
        console.error('Error loading polls: ', error);
    }
}

// Function to vote on a poll
window.vote = async function(pollId, optionIndex) {
    const pollRef = doc(db, 'polls', pollId);

    try {
        await runTransaction(db, async (transaction) => {
            const pollDoc = await transaction.get(pollRef);
            if (!pollDoc.exists()) {
                throw "Document does not exist!";
            }

            const data = pollDoc.data();
            const newVotes = [...data.votes];
            newVotes[optionIndex] += 1;

            transaction.update(pollRef, { votes: newVotes });
        });
        alert('Vote recorded!');
        loadPolls();
    } catch (error) {
        console.error('Error voting: ', error);
    }
}

// Load polls when the page loads
window.onload = loadPolls;
