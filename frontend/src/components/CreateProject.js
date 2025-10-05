import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateProject() {
  const [projectName, setProjectName] = useState('');
  const [collaborators, setCollaborators] = useState([{ email: '', responsibilities: [''] }]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = '#8178A1';
    return () => {
      document.body.style.background = '';
    };
  }, []);

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
      const response = await fetch('http://127.0.0.1:5000/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store project data for timeline access
        localStorage.setItem('currentProject', JSON.stringify(result.project));
        
        // Redirect to timeline
        navigate(`/project/${result.project.id}/timeline`);
        
        // Send email invitations
        try {
          const emailResponse = await fetch('http://127.0.0.1:5000/api/send-invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_name: projectName,
              project_code: result.project.code,
              creator_email: localStorage.getItem('currentUser') || 'creator@example.com',
              collaborators: collaborators.filter(c => c.email)
            })
          });
          
          const emailResult = await emailResponse.json();
          console.log('Email invitations:', emailResult);
        } catch (emailError) {
          console.error('Failed to send email invitations:', emailError);
        }
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setStatus('failed');
    }
  };

  return (
    <div>
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background: '#470F59',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontFamily: 'Archivo',
          fontWeight: '700'
        }}>← Back to Dashboard</button>
      </div>
      <div className="container">
        <h2>Create Project</h2>
        
        {status === 'failed' ? (
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
                style={{ marginLeft: '20px' }}
              >
                + Add Collaborator
              </button>
            </div>
            
            <div className="collaborators-grid">
              {collaborators.map((collab, collabIndex) => (
                <div key={collabIndex} className="collaborator-section" style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => removeCollaborator(collabIndex)} 
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >×</button>
                  
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
                        <button type="button" onClick={() => removeResponsibility(collabIndex, respIndex)} style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          width: '25px',
                          height: '25px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>-</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addResponsibility(collabIndex)}>+ Add Responsibility</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="submit">Create Project</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateProject;