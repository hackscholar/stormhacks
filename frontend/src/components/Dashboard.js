import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.body.className = 'dashboard-page';
    return () => {
      document.body.className = '';
    };
  }, []);

  const handleToggleClick = (toggleType) => {
    console.log(`${toggleType} clicked`);
    // Functionality to be implemented
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
    </div>
  );
}

export default Dashboard;