import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    profilePhoto: null
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const userEmail = localStorage.getItem('currentUser');
    if (userEmail) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/user-profile/${userEmail}`);
        const result = await response.json();
        if (result.success) {
          setUserProfile({
            name: result.profile.name || userEmail.split('@')[0],
            email: result.profile.email || userEmail,
            profilePhoto: result.profile.profilePhoto
          });
        } else {
          // Fallback if API fails
          setUserProfile({
            name: userEmail.split('@')[0],
            email: userEmail,
            profilePhoto: null
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback if API fails
        setUserProfile({
          name: userEmail.split('@')[0],
          email: userEmail,
          profilePhoto: null
        });
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      setMessage('Uploading photo...');
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('email', localStorage.getItem('currentUser'));

      try {
        const response = await fetch('http://127.0.0.1:5000/api/upload-profile-photo', {
          method: 'POST',
          body: formData
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.success) {
          setUserProfile(prev => ({ ...prev, profilePhoto: result.photoUrl }));
          setMessage('Profile photo updated successfully!');
        } else {
          setMessage(result.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage('Error uploading photo: ' + error.message);
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localStorage.getItem('currentUser'),
          name: userProfile.name,
          newPassword: newPassword || undefined
        })
      });
      const result = await response.json();
      if (result.success) {
        setMessage('Profile updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  return (
    <div className="desktop settings">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="back-button"
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 1000 }}
      >
        ← Back
      </button>
      
      <div className="title">Settings</div>
      <div className="subtitle">Manage your account settings</div>
      
      <div className="form-container">
        <div className="rounded-rectangle"></div>

        
        <form onSubmit={handleUpdateProfile}>
          <div className="profile-photo-section">
            <div 
              className="current-photo"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => document.getElementById('photo-upload').click()}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {userProfile.profilePhoto ? (
                <img 
                  src={`http://127.0.0.1:5000${userProfile.profilePhoto}`} 
                  alt="Profile" 
                  className="profile-photo-display"
                  style={{ 
                    filter: isHovering ? 'brightness(0.7)' : 'none',
                    transition: 'filter 0.3s ease'
                  }}
                />
              ) : (
                <div className="default-photo" style={{ 
                  backgroundColor: isHovering ? '#ccc' : '#f5f5f5',
                  transition: 'background-color 0.3s ease'
                }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="#7C7171">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              {isHovering && (
                <div className="photo-hover-overlay">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="photo-upload-input"
              id="photo-upload"
            />
          </div>

          <input
            type="text"
            className="name-input"
            placeholder="Full Name"
            value={userProfile.name}
            onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <input
            type="email"
            className="email-input"
            placeholder="Email"
            value={userProfile.email}
            readOnly
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          
          <input
            type="password"
            className="password-input"
            placeholder="New Password (leave blank to keep current)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          
          <input
            type="password"
            className="confirm-password-input"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          
          <button 
            type="submit" 
            className="signin-button"
            disabled={newPassword !== confirmPassword && newPassword !== ''}
          >
            Update Profile
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;