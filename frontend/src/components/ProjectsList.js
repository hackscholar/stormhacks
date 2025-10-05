import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProjects();
  }, []);

  const fetchUserProjects = async () => {
    const userEmail = localStorage.getItem('currentUser');
    if (userEmail) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/user-projects/${userEmail}`);
        const result = await response.json();
        setProjects(result.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }
  };

  return (
    <div className="projects-page">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="back-button"
      >
        ← Back to Dashboard
      </button>
      
      <h2>Your Projects ({projects.length})</h2>
      
      {projects.length > 0 ? (
        <div className="projects-layout">
          <div className="projects-list">
            {projects.map(project => (
              <div 
                key={project.id} 
                className={`project-list-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <h4>{project.name}</h4>
                <p>Code: {project.code}</p>
              </div>
            ))}
          </div>
          <div className="project-preview">
            {selectedProject ? (
              <div>
                <h3>{selectedProject.name}</h3>
                <p><strong>Code:</strong> {selectedProject.code}</p>
                <p><strong>Creator:</strong> {selectedProject.creator}</p>
                <p><strong>Collaborators:</strong> {selectedProject.collaborators.length}</p>
                
                <div className="collaborators-preview">
                  <h4>Team Members:</h4>
                  {selectedProject.collaborators.map((collab, index) => (
                    <div key={index} className="collab-preview">
                      <strong>{collab.email}</strong>
                      <ul>
                        {collab.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => navigate(`/project/${selectedProject.id}`)}
                  className="open-project-btn"
                >
                  Open Project
                </button>
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a project to see details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-projects">
          <p>No projects yet. Create or join a project to get started!</p>
          <button onClick={() => navigate('/create-project')}>Create Project</button>
        </div>
      )}
    </div>
  );
}

export default ProjectsList;