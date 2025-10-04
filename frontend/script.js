let isSignUp = false;
const API_BASE = 'http://localhost:5001';

const title = document.getElementById('title');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const confirmPassword = document.getElementById('confirmPassword');
const googleBtn = document.getElementById('googleBtn');

toggleBtn.addEventListener('click', () => {
    isSignUp = !isSignUp;
    
    if (isSignUp) {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
        confirmPassword.style.display = 'block';
    } else {
        title.textContent = 'Sign In';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Sign Up';
        confirmPassword.style.display = 'none';
    }
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const endpoint = isSignUp ? '/signup' : '/login';
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        
        const response = await fetch(API_BASE + endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            if (isSignUp) {
                alert('Account created! Please sign in.');
                toggleBtn.click(); // Switch to sign in
            } else {
                window.location.href = API_BASE + '/';
            }
        } else {
            const error = await response.text();
            alert(error);
        }
    } catch (error) {
        alert('Connection error. Make sure the Flask app is running on port 5001.');
    }
});

googleBtn.addEventListener('click', () => {
    window.location.href = API_BASE + '/login/google';
});