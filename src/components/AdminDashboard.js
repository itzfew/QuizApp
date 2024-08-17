import React, { useState } from 'react';
import { firestore } from '../firebase-config';
import { collection, addDoc } from 'firebase/firestore';

const AdminDashboard = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['']);

    const handleAddPoll = async () => {
        try {
            await addDoc(collection(firestore, 'polls'), {
                question,
                options: options.map(name => ({ name, count: 0 }))
            });
            setQuestion('');
            setOptions(['']);
        } catch (error) {
            console.error('Error adding poll:', error);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, '']);

    return (
        <div className="admin-container">
            <h2>Add Poll</h2>
            <input type="text" placeholder="Poll Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
            {options.map((option, index) => (
                <input
                    key={index}
                    type="text"
                    placeholder="Option"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                />
            ))}
            <button onClick={addOption}>Add Option</button>
            <button onClick={handleAddPoll}>Save Poll</button>
        </div>
    );
};

export default AdminDashboard;
