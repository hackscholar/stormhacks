// Handle signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        // Store user data in localStorage
        const userData = {
            email: email,
            password: password
        };
        
        localStorage.setItem('user_' + email, JSON.stringify(userData));
        
        showMessage('Account created successfully! Redirecting to login...', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Check if user exists in localStorage
        const storedUser = localStorage.getItem('user_' + email);
        
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            
            if (userData.password === password) {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '../dashboard.html';
                }, 1000);
            } else {
                showMessage('Invalid password!', 'error');
            }
        } else {
            showMessage('User not found! Please sign up first.', 'error');
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
}