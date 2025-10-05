import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Uploads from './uploads/uploads';

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
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
      <div className="project-info">
        <p><strong>Project Code:</strong> {project.code}</p>
        <p><strong>Creator:</strong> {project.creator}</p>
        <p><strong>Collaborators:</strong> {project.collaborators.length}</p>
      </div>
      
      <div className="collaborators-section">
        <h3>Team Members</h3>
        {project.collaborators.map((collab, index) => (
          <div key={index} className="collaborator-card">
            <h4>{collab.email}</h4>
            <ul>
              {collab.responsibilities.map((resp, i) => (
                <li key={i}>{resp}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="project-workspace">
        <h3>Project Workspace</h3>
        <p>Project content will go here...</p>
        <Uploads />
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