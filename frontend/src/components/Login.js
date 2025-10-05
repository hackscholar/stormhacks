import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const storedUser = localStorage.getItem('user_' + email);
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      if (userData.password === password) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setMessage('Invalid password!');
      }
    } else {
      setMessage('User not found! Please sign up first.');
    }
  };

  return (
    <div className="container">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      {message && <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</div>}
    </div>
  );
}

export default Login;