import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateProject() {
  const [projectName, setProjectName] = useState('');
  const [collaborators, setCollaborators] = useState([{ email: '', responsibilities: [''] }]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const addCollaborator = () => {
    if (collaborators.length < 32) {
      setCollaborators([...collaborators, { email: '', responsibilities: [''] }]);
    }
  };

  const updateCollaborator = (index, field, value) => {
    const updated = collaborators.map((collab, i) => 
      i === index ? { ...collab, [field]: value } : collab
    );
    setCollaborators(updated);
  };

  const addResponsibility = (collabIndex) => {
    const updated = collaborators.map((collab, i) => 
      i === collabIndex ? { ...collab, responsibilities: [...collab.responsibilities, ''] } : collab
    );
    setCollaborators(updated);
  };

  const updateResponsibility = (collabIndex, respIndex, value) => {
    const updated = collaborators.map((collab, i) => {
      if (i === collabIndex) {
        const newResp = collab.responsibilities.map((resp, j) => 
          j === respIndex ? value : resp
        );
        return { ...collab, responsibilities: newResp };
      }
      return collab;
    });
    setCollaborators(updated);
  };

  const removeResponsibility = (collabIndex, respIndex) => {
    const updated = collaborators.map((collab, i) => {
      if (i === collabIndex) {
        return { ...collab, responsibilities: collab.responsibilities.filter((_, j) => j !== respIndex) };
      }
      return collab;
    });
    setCollaborators(updated);
  };

  const removeCollaborator = (index) => {
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const projectData = {
      name: projectName,
      creator: localStorage.getItem('currentUser') || 'user@example.com',
      collaborators: collaborators.filter(c => c.email)
    };

    try {
      const response = await fetch('http://localhost:5000/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedCode(result.project.code);
        setStatus('success');
        
        // Store locally
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects.push(result.project);
        localStorage.setItem('projects', JSON.stringify(projects));
        
        // Store collaborator responsibilities locally
        collaborators.forEach(collab => {
          if (collab.email) {
            localStorage.setItem(`responsibilities_${collab.email}`, JSON.stringify({
              projectId: result.project.id,
              responsibilities: collab.responsibilities.filter(r => r.trim())
            }));
          }
        });
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="container">
      <h2>Create Project</h2>
      
      {status === 'success' ? (
        <div className="success-message">
          <h3>Success</h3>
          <p>Project created! Code: <strong>{generatedCode}</strong></p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      ) : status === 'failed' ? (
        <div className="error-message">
          <h3>Failed</h3>
          <p>Project creation failed. Please try again.</p>
          <button onClick={() => setStatus('')}>Try Again</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          
          <div className="collaborators-header">
            <h3>Collaborators ({collaborators.length}/32)</h3>
            <button 
              type="button" 
              onClick={addCollaborator} 
              className="add-collaborator-btn"
              disabled={collaborators.length >= 32}
            >
              + Add Collaborator
            </button>
          </div>
          
          <div className="collaborators-grid">
            {collaborators.map((collab, collabIndex) => (
              <div key={collabIndex} className="collaborator-section">
                <input
                  type="email"
                  placeholder="Email"
                  value={collab.email}
                  onChange={(e) => updateCollaborator(collabIndex, 'email', e.target.value)}
                />
                
                <div className="responsibilities-section">
                  <h4>Responsibilities:</h4>
                  {collab.responsibilities.map((resp, respIndex) => (
                    <div key={respIndex} className="responsibility-row">
                      <input
                        type="text"
                        placeholder="Responsibility"
                        value={resp}
                        onChange={(e) => updateResponsibility(collabIndex, respIndex, e.target.value)}
                      />
                      <button type="button" onClick={() => removeResponsibility(collabIndex, respIndex)}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addResponsibility(collabIndex)}>+ Add Responsibility</button>
                </div>
                
                <button type="button" onClick={() => removeCollaborator(collabIndex)} className="remove-collaborator-btn">× Remove</button>
              </div>
            ))}
          </div>
          <button type="submit">Create Project</button>
        </form>
      )}
      
      <button onClick={() => navigate('/dashboard')}>Back</button>
    </div>
  );
}

export default CreateProject;