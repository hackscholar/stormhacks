import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      fetchUserProfile(currentUser);
    }
  }, []);

  const fetchUserProfile = async (email) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/user-profile/${email}`);
      const result = await response.json();
      if (result.success) {
        setUserName(result.profile.name || email.split('@')[0]);
        setUserPhoto(result.profile.profilePhoto);
      } else {
        setUserName(email.split('@')[0]);
      }
    } catch (error) {
      setUserName(email.split('@')[0]);
    }
  };

  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowDropdown(false);
    }, 300);
    setHideTimeout(timeout);
  };

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
    } else if (toggleType === 'View Projects') {
      navigate('/projects');
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
        // Store project data for timeline access
        localStorage.setItem('currentProject', JSON.stringify(result.project));
        
        setShowJoinModal(false);
        setJoinCode('');
        
        // Redirect to project timeline
        navigate(`/project/${result.project.id}/timeline`);
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
      <div 
        className="profile-dropdown"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="profile-avatar">
          <div className="avatar-circle">
            {userPhoto ? (
              <img 
                src={`http://127.0.0.1:5000${userPhoto}`} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          <span className="user-name">{userName}</span>
        </div>
        <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
          <a onClick={() => navigate('/settings')}>Settings</a>
          <a onClick={handleSignOut}>Sign Out</a>
        </div>
      </div>
      
      <h2 className="dashboard-title">Project Dashboard</h2>
      
      <div className="toggles-container">
        <div className="toggle-item" onClick={() => handleToggleClick('Create Project')}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="#470F59" style={{ marginBottom: '10px' }}>
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <h3>Create Project</h3>
          <p>Start a new project</p>
        </div>
        <div className="toggle-item" onClick={() => handleToggleClick('Join Project')}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="#470F59" style={{ marginBottom: '10px' }}>
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h9v14z"/>
          </svg>
          <h3>Join Project</h3>
          <p>Join an existing project</p>
        </div>
        <div className="toggle-item" onClick={() => handleToggleClick('View Projects')}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="#470F59" style={{ marginBottom: '10px' }}>
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
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