let isSignUp = false;

const title = document.getElementById('title');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const confirmPassword = document.getElementById('confirmPassword');

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

document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert(isSignUp ? 'Sign up submitted!' : 'Sign in submitted!');
});