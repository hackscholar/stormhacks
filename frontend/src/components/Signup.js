import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const userData = {
      email: email,
      password: password
    };
    
    localStorage.setItem('user_' + email, JSON.stringify(userData));
    
    setMessage('Account created successfully! Redirecting to login...');
    
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="container">
      <h2>Sign Up</h2>
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
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/">Sign In</Link></p>
      {message && <div className="message success">{message}</div>}
    </div>
  );
}

export default Signup;