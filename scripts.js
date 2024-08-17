import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
  authDomain: "quizapp-1ae20.firebaseapp.com",
  projectId: "quizapp-1ae20",
  storageBucket: "quizapp-1ae20.appspot.com",
  messagingSenderId: "626886802317",
  appId: "1:626886802317:web:df08c307697ca235c45bc4",
  measurementId: "G-NKJTC5C1XW"
};

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
                    likes: 0
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
            querySnapshot.forEach(async (doc) => {
                const post = doc.data();
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');

                // Format timestamp
                const timestamp = post.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                // Check if display name includes "verify"
                const isVerified = post.displayName.toLowerCase().includes('verify');
                const cleanDisplayName = post.displayName.replace(/verify/i, '').trim();
                
                postDiv.innerHTML = `
                    <div class="author">
                        ${cleanDisplayName} ${isVerified ? '<i class="fa fa-check-circle verified"></i> Verified' : ''}
                    </div>
                    <div class="content">${post.content}</div>
                    <div class="date">Published on: ${formattedDate}</div>
                    <div class="actions">
                        <button class="share-btn" onclick="sharePost('${doc.id}')"><i class="fa fa-share"></i> Share</button>
                        <button class="like-btn" onclick="likePost('${doc.id}')"><i class="fa fa-thumbs-up"></i> Like <span id="like-count-${doc.id}">${post.likes}</span></button>
                        ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                            <button class="edit-btn" onclick="editPost('${doc.id}', '${post.content}')"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deletePost('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                        ` : ''}
                    </div>
                    <div class="replies">
                        <textarea class="reply-input" placeholder="Write a reply..."></textarea>
                        <button class="submit-reply" onclick="submitReply('${doc.id}')">Reply</button>
                        <div class="reply-list" id="replies-${doc.id}"></div>
                    </div>
                `;
                postList.appendChild(postDiv);
                await displayReplies(doc.id);
            });
        } catch (error) {
            console.error('Error getting posts: ', error);
        }
    }

    async function displayReplies(postId) {
        const replyList = document.getElementById(`replies-${postId}`);
        replyList.innerHTML = '';

        try {
            const q = query(collection(db, 'posts', postId, 'replies'), orderBy('timestamp', 'asc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                const reply = doc.data();
                const replyDiv = document.createElement('div');
                replyDiv.classList.add('reply');

                // Format timestamp
                const timestamp = reply.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                replyDiv.innerHTML = `
                    <div class="author">${reply.displayName}</div>
                    <div class="content">${reply.content}</div>
                    <div class="date">Published on: ${formattedDate}</div>
                    ${auth.currentUser && auth.currentUser.uid === reply.uid ? `
                        <div class="actions">
                            <button class="edit-btn" onclick="editReply('${postId}', '${doc.id}', '${reply.content}')"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deleteReply('${postId}', '${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                        </div>
                    ` : ''}
                `;
                replyList.appendChild(replyDiv);
            });
        } catch (error) {
            console.error('Error getting replies: ', error);
        }
    }

    window.submitReply = async function(postId) {
        const replyContent = document.querySelector(`#replies-${postId} .reply-input`).value;
        if (replyContent.trim() === '') {
            alert('Reply content cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'posts', postId, 'replies'), {
                    content: replyContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.email.split('@')[0]
                });
                document.querySelector(`#replies-${postId} .reply-input`).value = '';
                displayReplies(postId);
                alert('Reply added successfully!');
            } catch (error) {
                console.error('Error adding reply: ', error);
            }
        } else {
            alert('You must be logged in to reply.');
        }
    };

    window.editReply = async function(postId, replyId, currentContent) {
        const newContent = prompt('Edit your reply:', currentContent);
        if (newContent !== null && newContent.trim() !== '') {
            try {
                const replyRef = doc(db, 'posts', postId, 'replies', replyId);
                await updateDoc(replyRef, {
                    content: newContent
                });
                displayReplies(postId);
            } catch (error) {
                console.error('Error updating reply: ', error);
            }
        }
    };

    window.deleteReply = async function(postId, replyId) {
        if (confirm('Are you sure you want to delete this reply?')) {
            try {
                await deleteDoc(doc(db, 'posts', postId, 'replies', replyId));
                displayReplies(postId);
            } catch (error) {
                console.error('Error deleting reply: ', error);
            }
        }
    };

    window.likePost = async function(postId) {
        const postRef = doc(db, 'posts', postId);
        try {
            const postDoc = await getDoc(postRef);
            const postData = postDoc.data();
            const currentLikes = postData.likes || 0;
            await updateDoc(postRef, {
                likes: currentLikes + 1
            });
            displayPosts();
        } catch (error) {
            console.error('Error liking post: ', error);
        }
    };

    document.getElementById('search-input').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            const content = post.querySelector('.content').textContent.toLowerCase();
            if (content.includes(searchTerm)) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        });
    });

    displayPosts();
}
