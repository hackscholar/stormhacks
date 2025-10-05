import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Uploads from './uploads/uploads';
import Timeline from './timeline/timeline';
import Chatroom from './chat/chatroom';

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/project/${projectId}`);
      const result = await response.json();
      if (result.success) {
        setProject(result.project);
        localStorage.setItem('currentProject', JSON.stringify(result.project));
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  if (!project) {
    return <div className="fullscreen-container">Loading project...</div>;
  }

  return (
    <div className="fullscreen-container">
      <h2>{project.name}</h2>
      <div 
        className="profile-dropdown"
        onMouseEnter={() => setShowProjectInfo(true)}
        onMouseLeave={() => setShowProjectInfo(false)}
      >
        <div className="profile-avatar" style={{border: '1px solid black', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <span className="user-name" style={{color: 'black'}}>Project Details</span>
        </div>
        <div className={`dropdown-content ${showProjectInfo ? 'show' : ''}`} style={{top: '0', marginTop: '0', minWidth: '200px', right: '0', left: 'auto'}}>
          <div style={{padding: '0.5rem', color: 'white', fontSize: '12px'}}>
            <div><strong>Code:</strong> {project.code}</div>
            <div><strong>Creator:</strong> {project.creator}</div>
            <div><strong>Team:</strong> {project.collaborators.length} members</div>
          </div>
        </div>
      </div>
      


      <div className="project-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <img src="/icons/timeline-icon.svg" alt="Timeline" style={{width: '20px', height: '20px', marginRight: '8px'}} />
            Timeline
          </button>
          <button 
            className={`tab-button ${activeTab === 'chatroom' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatroom')}
          >
            <img src="/icons/chat-icon.svg" alt="Chat" style={{width: '20px', height: '20px', marginRight: '8px'}} />
            Chatroom
          </button>
          <button 
            className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <img src="/icons/file-icon.svg" alt="Files" style={{width: '20px', height: '20px', marginRight: '8px'}} />
            File Specs
          </button>
          <button 
            className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <img src="/icons/team-icon.svg" alt="Team" style={{width: '20px', height: '20px', marginRight: '8px'}} />
            Team
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'timeline' && <Timeline />}
          {activeTab === 'chatroom' && <Chatroom />}
          {activeTab === 'files' && <Uploads />}
          {activeTab === 'team' && (
            <div>
              <h3>Team Members</h3>
              <div className="collaborators-horizontal">
                {project.collaborators.map((collab, index) => (
                  <div key={index} className="collaborator-card" style={{minWidth: '200px', flex: '0 0 auto'}}>
                    <h4 style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem'}}>{collab.email}</h4>
                    <ul style={{margin: 0, padding: '0 0 0 1rem', fontSize: '0.8rem'}}>
                      {collab.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => navigate('/dashboard')} 
        className="back-button"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default ProjectView;