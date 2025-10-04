import React, { useState } from 'react';
import './App.css';

function App() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="app">
      <div className="auth-container">
        <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
        
        <form className="auth-form">
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          {isSignUp && <input type="password" placeholder="Confirm Password" required />}
          
          <button type="submit">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <p>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            className="toggle-btn" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;