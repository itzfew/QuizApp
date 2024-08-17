import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase-config';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';

const Polls = () => {
    const [polls, setPolls] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, 'polls'), (snapshot) => {
            const pollsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPolls(pollsData);
        });
        return unsubscribe;
    }, []);

    const handleVote = async (pollId, optionIndex) => {
        const pollRef = doc(firestore, 'polls', pollId);
        await updateDoc(pollRef, {
            [`options.${optionIndex}.count`]: firebase.firestore.FieldValue.increment(1)
        });
    };

    return (
        <div className="polls-container">
            <h2>Polls</h2>
            {polls.map(poll => (
                <div key={poll.id} className="poll">
                    <h3>{poll.question}</h3>
                    {poll.options.map((option, index) => (
                        <div key={index} className="poll-option">
                            <button onClick={() => handleVote(poll.id, index)}>{option.name}</button>
                            <progress value={option.count} max={100}></progress>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Polls;
