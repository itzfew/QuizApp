import React, { useState, useEffect } from 'react';
import SignIn from './components/SignIn';
import AdminDashboard from './components/AdminDashboard';
import Polls from './components/Polls';
import { auth } from './firebase-config';

const App = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return unsubscribe;
    }, []);

    const handleSignIn = () => {
        // Check if user is admin based on your criteria
        // Here assuming that admin's email contains 'admin'
        if (user && user.email.includes('admin')) {
            setIsAdmin(true);
        }
    };

    return (
        <div className="app">
            {!user ? (
                <SignIn onSignIn={handleSignIn} />
            ) : isAdmin ? (
                <AdminDashboard />
            ) : (
                <Polls />
            )}
        </div>
    );
};

export default App;
