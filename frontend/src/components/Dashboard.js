import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    document.body.className = 'dashboard-page';
    return () => {
      document.body.className = '';
    };
  }, []);



  const handleToggleClick = (toggleType) => {
    if (toggleType === 'Create Project') {
      navigate('/create-project');
    } else if (toggleType === 'Join Project') {
      setShowJoinModal(true);
    } else {
      console.log(`${toggleType} clicked`);
      // Functionality to be implemented
    }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/join-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowJoinModal(false);
        setJoinCode('');
        fetchUserProjects(); // Refresh projects
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error joining project');
    }
  };

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="profile-dropdown">
        <button 
          className="profile-btn"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          Profile ▼
        </button>
        <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
          <a onClick={() => console.log('Settings clicked')}>Settings</a>
          <a onClick={() => console.log('Profile clicked')}>Profile</a>
          <a onClick={handleSignOut}>Sign Out</a>
        </div>
      </div>
      
      <h2 className="dashboard-title">Project Dashboard</h2>
      
      <div className="toggles-container">
        <div className="toggle-item" onClick={() => handleToggleClick('Create Project')}>
          <h3>Create Project</h3>
          <p>Start a new project</p>
        </div>
        <div className="toggle-item" onClick={() => handleToggleClick('Join Project')}>
          <h3>Join Project</h3>
          <p>Join an existing project</p>
        </div>
        <div className="toggle-item" onClick={() => handleToggleClick('View Projects')}>
          <h3>View Projects</h3>
          <p>See all your projects</p>
        </div>
      </div>
      
      {showJoinModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Join Project</h3>
            <form onSubmit={handleJoinProject}>
              <input
                type="text"
                placeholder="Enter project code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />
              <div className="modal-buttons">
                <button type="submit">Join</button>
                <button type="button" onClick={() => setShowJoinModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      

    </div>
  );
}

export default Dashboard;