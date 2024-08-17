import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
  authDomain: "quizapp-1ae20.firebaseapp.com",
  projectId: "quizapp-1ae20",
  storageBucket: "quizapp-1ae20.appspot.com",
  messagingSenderId: "111583315490",
  appId: "1:111583315490:web:9b0f7e2edcb5f07e02f10b",
  measurementId: "G-4T7F0Y6K6B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Display Posts Function
async function displayPosts() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = ''; // Clear current posts

    try {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (doc) => {
            const post = doc.data();
            const postId = doc.id;
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');
            postDiv.innerHTML = `
                <div class="author">${post.displayName}</div>
                <div class="content">${post.content}</div>
                <div class="actions">
                    <button class="like-btn" data-id="${postId}">
                        <i class="fa fa-thumbs-up"></i> Like (${post.likes || 0})
                    </button>
                    <button class="reply-btn" data-id="${postId}">
                        <i class="fa fa-reply"></i> Reply
                    </button>
                    <button class="edit-btn" data-id="${postId}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-id="${postId}">
                        <i class="fa fa-trash"></i> Delete
                    </button>
                </div>
                <div class="reply-form" id="reply-form-${postId}" style="display: none;">
                    <textarea placeholder="Write your reply..."></textarea>
                    <button class="submit-reply" data-id="${postId}">Submit Reply</button>
                </div>
                <div class="replies" id="replies-${postId}">
                    <!-- Replies will be dynamically inserted here -->
                </div>
            `;
            postList.appendChild(postDiv);

            // Display replies
            displayReplies(postId);

            // Add event listeners to buttons
            postDiv.querySelector('.like-btn').addEventListener('click', handleLike);
            postDiv.querySelector('.reply-btn').addEventListener('click', handleReplyToggle);
            postDiv.querySelector('.submit-reply').addEventListener('click', handleReplySubmit);
            postDiv.querySelector('.edit-btn').addEventListener('click', handleEdit);
            postDiv.querySelector('.delete-btn').addEventListener('click', handleDelete);
        });
    } catch (error) {
        console.error('Error displaying posts: ', error);
    }
}

// Handle Like Button Click
async function handleLike(e) {
    const postId = e.currentTarget.dataset.id;
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
        likes: increment(1)
    });
    displayPosts(); // Refresh posts to show updated likes
}

// Handle Reply Button Click
function handleReplyToggle(e) {
    const replyForm = document.getElementById(`reply-form-${e.currentTarget.dataset.id}`);
    replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
}

// Handle Reply Submission
async function handleReplySubmit(e) {
    const postId = e.currentTarget.dataset.id;
    const replyTextarea = e.currentTarget.previousElementSibling;
    const replyText = replyTextarea.value.trim();
    if (replyText === '') {
        alert('Reply cannot be empty.');
        return;
    }

    try {
        await addDoc(collection(db, 'posts', postId, 'replies'), {
            content: replyText,
            timestamp: serverTimestamp(),
            uid: auth.currentUser.uid
        });
        displayPosts(); // Refresh posts to show new replies
        alert('Reply added successfully!');
    } catch (error) {
        console.error('Error adding reply: ', error);
    }
}

// Handle Edit Button Click
async function handleEdit(e) {
    const postId = e.currentTarget.dataset.id;
    const newContent = prompt('Edit your post:', e.currentTarget.previousElementSibling.previousElementSibling.textContent);
    if (newContent !== null) {
        try {
            await updateDoc(doc(db, 'posts', postId), {
                content: newContent
            });
            displayPosts(); // Refresh posts to show updated content
            alert('Post updated successfully!');
        } catch (error) {
            console.error('Error updating post: ', error);
        }
    }
}

// Handle Delete Button Click
async function handleDelete(e) {
    const postId = e.currentTarget.dataset.id;
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            displayPosts(); // Refresh posts to remove deleted post
            alert('Post deleted successfully!');
        } catch (error) {
            console.error('Error deleting post: ', error);
        }
    }
}

// Display Replies Function
async function displayReplies(postId) {
    const repliesContainer = document.getElementById(`replies-${postId}`);
    repliesContainer.innerHTML = ''; // Clear existing replies

    try {
        const q = query(collection(db, 'posts', postId, 'replies'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const reply = doc.data();
            const replyDiv = document.createElement('div');
            replyDiv.classList.add('reply');
            replyDiv.innerHTML = `
                <div class="reply-content">
                    <strong>User:</strong> ${reply.content}
                </div>
            `;
            repliesContainer.appendChild(replyDiv);
        });
    } catch (error) {
        console.error('Error displaying replies: ', error);
    }
}

// Initialize the display of posts and handle authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('sign-out').style.display = 'inline';
        document.getElementById('post-form').style.display = 'block';
        displayPosts();
    } else {
        document.getElementById('sign-out').style.display = 'none';
        document.getElementById('post-form').style.display = 'none';
    }
});

// Handle Sign Out
document.getElementById('sign-out').addEventListener('click', () => {
    signOut(auth).then(() => {
        alert('Signed out successfully.');
    }).catch((error) => {
        console.error('Sign out error: ', error);
    });
});

// Handle Post Submission
document.getElementById('submit-post').addEventListener('click', async () => {
    const displayName = document.getElementById('display-name').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (displayName === '' || content === '') {
        alert('Display name and content cannot be empty.');
        return;
    }

    try {
        await addDoc(collection(db, 'posts'), {
            displayName: displayName,
            content: content,
            timestamp: serverTimestamp(),
            likes: 0,
            uid: auth.currentUser.uid
        });
        displayPosts(); // Refresh posts to show new post
        alert('Post added successfully!');
        document.getElementById('display-name').value = '';
        document.getElementById('post-content').value = '';
    } catch (error) {
        console.error('Error adding post: ', error);
    }
});
