import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
  authDomain: "quizapp-1ae20.firebaseapp.com",
  projectId: "quizapp-1ae20",
  storageBucket: "quizapp-1ae20.appspot.com",
  messagingSenderId: "626886802317",
  appId: "1:626886802317:web:df08c307697ca235c45bc4",
  measurementId: "G-NKJTC5C1XW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Profile page logic
if (window.location.pathname.includes('profile.html')) {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const signOutButton = document.getElementById('sign-out');
    const viewPostsButton = document.getElementById('view-posts');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Welcome back!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing in: ', error);
        }
    });

    document.getElementById('sign-up').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Welcome to Ind Edu!');
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing up: ', error);
        }
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            authSection.style.display = 'none';
            userInfo.style.display = 'block';
            usernameDisplay.textContent = user.email.split('@')[0];
        } else {
            authSection.style.display = 'block';
            userInfo.style.display = 'none';
        }
    });

    viewPostsButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Main index page logic
if (window.location.pathname.includes('index.html')) {
    const postForm = document.getElementById('post-form');
    const signOutButton = document.getElementById('sign-out');

    onAuthStateChanged(auth, user => {
        if (user) {
            postForm.style.display = 'block';
            signOutButton.style.display = 'inline';
        } else {
            postForm.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('submit-post').addEventListener('click', async () => {
        const postContent = document.getElementById('post-content').value;
        const displayName = document.getElementById('display-name').value;
        if (postContent.trim() === '' || displayName.trim() === '') {
            alert('Post content and display name cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'posts'), {
                    content: postContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: displayName,
                    likes: 0 // Initialize likes count
                });
                document.getElementById('post-content').value = '';
                document.getElementById('display-name').value = '';
                displayPosts();
                alert('Post added successfully!');
            } catch (error) {
                console.error('Error adding post: ', error);
            }
        } else {
            alert('You must be logged in to post.');
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    async function displayPosts() {
        const postList = document.getElementById('post-list');
        postList.innerHTML = '';

        try {
            const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async doc => {
                const post = doc.data();
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');
                postDiv.innerHTML = `
                    <div class="author">${post.displayName}</div>
                    <div class="content">${post.content}</div>
                    <div class="actions">
                        <button class="like-btn" data-id="${doc.id}">
                            <i class="fa fa-thumbs-up"></i> Like (${post.likes})
                        </button>
                        <button class="reply-btn" data-id="${doc.id}">
                            <i class="fa fa-reply"></i> Reply
                        </button>
                        <button class="edit-btn" data-id="${doc.id}">
                            <i class="fa fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" data-id="${doc.id}">
                            <i class="fa fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="reply-form" id="reply-form-${doc.id}" style="display: none;">
                        <textarea placeholder="Write your reply..."></textarea>
                        <button data-id="${doc.id}" class="submit-reply">Submit Reply</button>
                    </div>
                `;
                postList.appendChild(postDiv);

                // Like button event listener
                postDiv.querySelector('.like-btn').addEventListener('click', async (e) => {
                    const postId = e.currentTarget.dataset.id;
                    const postRef = doc(db, 'posts', postId);
                    await updateDoc(postRef, {
                        likes: increment(1)
                    });
                    displayPosts();
                });

                // Reply button event listener
                postDiv.querySelector('.reply-btn').addEventListener('click', (e) => {
                    const replyForm = document.getElementById(`reply-form-${e.currentTarget.dataset.id}`);
                    replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
                });

                // Submit reply button event listener
                postDiv.querySelector('.submit-reply').addEventListener('click', async (e) => {
                    const postId = e.currentTarget.dataset.id;
                    const replyText = e.currentTarget.previousElementSibling.value;
                    if (replyText.trim() === '') {
                        alert('Reply cannot be empty.');
                        return;
                    }

                    try {
                        await addDoc(collection(db, 'posts', postId, 'replies'), {
                            content: replyText,
                            timestamp: serverTimestamp(),
                            uid: auth.currentUser.uid
                        });
                        displayPosts();
                        alert('Reply added successfully!');
                    } catch (error) {
                        console.error('Error adding reply: ', error);
                    }
                });

                // Edit button event listener
                postDiv.querySelector('.edit-btn').addEventListener('click', async (e) => {
                    const postId = e.currentTarget.dataset.id;
                    const newContent = prompt('Edit your post:', post.content);
                    if (newContent !== null) {
                        try {
                            await updateDoc(doc(db, 'posts', postId), {
                                content: newContent
                            });
                            displayPosts();
                            alert('Post updated successfully!');
                        } catch (error) {
                            console.error('Error updating post: ', error);
                        }
                    }
                });

                // Delete button event listener
                postDiv.querySelector('.delete-btn').addEventListener('click', async (e) => {
                    const postId = e.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this post?')) {
                        try {
                            await deleteDoc(doc(db, 'posts', postId));
                            displayPosts();
                            alert('Post deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting post: ', error);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error displaying posts: ', error);
        }
    }

    // Initial display
    displayPosts();
}
