import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
    authDomain: "quizapp-1ae20.firebaseapp.com",
    projectId: "quizapp-1ae20",
    storageBucket: "quizapp-1ae20.appspot.com",
    messagingSenderId: "626886802317",
    appId: "1:626886802317:web:df08c307697ca235c45bc4",
    measurementId: "G-NKJTC5C1X7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Check authentication state
onAuthStateChanged(auth, (user) => {
    const postForm = document.getElementById('post-form');
    const signOutBtn = document.getElementById('sign-out');
    if (user) {
        postForm.style.display = 'block';
        signOutBtn.style.display = 'block';
    } else {
        postForm.style.display = 'none';
        signOutBtn.style.display = 'none';
    }
});

window.signOutUser = async function() {
    try {
        await signOut(auth);
        window.location.href = 'index.html'; // Redirect to the home page
    } catch (error) {
        console.error('Error signing out: ', error);
    }
}

window.submitPost = async function() {
    const displayName = document.getElementById('display-name').value;
    const postContent = document.getElementById('post-content').value;
    if (postContent.trim() === '') {
        alert('Post content cannot be empty.');
        return;
    }

    if (auth.currentUser) {
        try {
            await addDoc(collection(db, 'posts'), {
                content: postContent,
                timestamp: serverTimestamp(),
                uid: auth.currentUser.uid,
                displayName: displayName || auth.currentUser.email.split('@')[0]
            });
            document.getElementById('display-name').value = '';
            document.getElementById('post-content').value = '';
            displayPosts();
        } catch (error) {
            console.error('Error adding post: ', error);
        }
    } else {
        alert('You must be logged in to post.');
    }
}

window.sharePost = function(postId) {
    alert(`Post ${postId} shared!`);
}

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
            postDiv.id = `post-${doc.id}`;

            const timestamp = post.timestamp.toDate();
            const formattedDate = timestamp.toLocaleString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
            });

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
                    ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                        <button class="edit-btn" onclick="editPost('${doc.id}', '${post.content}')"><i class="fa fa-edit"></i> Edit</button>
                        <button class="delete-btn" onclick="deletePost('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                    ` : ''}
                </div>
                <div class="replies">
                    <textarea id="reply-content-${doc.id}" placeholder="Write a reply..."></textarea>
                    <button onclick="submitReply('${doc.id}')">Reply</button>
                    <div id="replies-list-${doc.id}"></div>
                </div>
            `;
            postList.appendChild(postDiv);
            await displayReplies(doc.id); // Load replies for this post
        });
    } catch (error) {
        console.error('Error getting posts: ', error);
    }
}

async function displayReplies(postId) {
    const repliesList = document.getElementById(`replies-list-${postId}`);
    repliesList.innerHTML = '';

    try {
        const q = query(collection(db, 'posts', postId, 'replies'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const reply = doc.data();
            const replyDiv = document.createElement('div');
            replyDiv.classList.add('reply');

            const timestamp = reply.timestamp.toDate();
            const formattedDate = timestamp.toLocaleString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
            });

            replyDiv.innerHTML = `
                <div class="author">${reply.displayName}</div>
                <div class="content">${reply.content}</div>
                <div class="date">Replied on: ${formattedDate}</div>
            `;
            repliesList.appendChild(replyDiv);
        });
    } catch (error) {
        console.error('Error getting replies: ', error);
    }
}

window.submitReply = async function(postId) {
    const replyContent = document.getElementById(`reply-content-${postId}`).value;
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
            document.getElementById(`reply-content-${postId}`).value = '';
            displayReplies(postId);
        } catch (error) {
            console.error('Error adding reply: ', error);
        }
    } else {
        alert('You must be logged in to reply.');
    }
};

window.editPost = async function(postId, currentContent) {
    const newContent = prompt('Edit your post:', currentContent);
    if (newContent !== null && newContent.trim() !== '') {
        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                content: newContent
            });
            displayPosts();
        } catch (error) {
            console.error('Error updating post: ', error);
        }
    }
};

window.deletePost = async function(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            displayPosts();
        } catch (error) {
            console.error('Error deleting post: ', error);
        }
    }
};

document.getElementById('submit-post').addEventListener('click', submitPost);
document.getElementById('sign-out').addEventListener('click', signOutUser);

displayPosts();
