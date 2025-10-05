import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectTimeline() {
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.background = '#8178A1';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.body.style.background = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  useEffect(() => {
    const storedProject = localStorage.getItem('currentProject');
    if (storedProject) {
      const project = JSON.parse(storedProject);
      setProjectData(project);
      loadMilestones(project.id);
    }
  }, []);

  const loadMilestones = async (projectId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/project/${projectId}/milestones`);
      const result = await response.json();
      setMilestones(result.milestones || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  };

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    assignedMembers: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    assignee: '',
    responsibility: '',
    status: 'To Do'
  });

  const getCollaboratorEmails = () => {
    if (!projectData) return [];
    return projectData.collaborators.map(collab => collab.email);
  };

  const getCollaboratorOptions = () => {
    if (!projectData) return [];
    const options = [];
    projectData.collaborators.forEach(collab => {
      collab.responsibilities.forEach(resp => {
        if (resp.trim()) {
          options.push({
            email: collab.email,
            responsibility: resp.trim(),
            display: `${collab.email} - ${resp.trim()}`
          });
        }
      });
    });
    return options;
  };

  const addMilestone = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/project/${projectData.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestoneForm.title,
          startDate: milestoneForm.startDate,
          endDate: milestoneForm.endDate,
          assignedMembers: milestoneForm.assignedMembers.split(',').map(m => m.trim())
        })
      });
      const result = await response.json();
      if (result.success) {
        loadMilestones(projectData.id);
        setMilestoneForm({ title: '', startDate: '', endDate: '', assignedMembers: '' });
        setShowMilestoneForm(false);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const addTask = async (milestoneId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/milestone/${milestoneId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      const result = await response.json();
      if (result.success) {
        loadMilestones(projectData.id);
        setTaskForm({ title: '', dueDate: '', assignee: '', responsibility: '', status: 'To Do' });
        setShowTaskForm(null);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTaskStatus = async (milestoneId, taskId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/task/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        loadMilestones(projectData.id);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };



  if (!projectData) {
    return (
      <div className="timeline-container">
        <h2>No Project Data</h2>
        <p>Please create a project first.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#8178A1',
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: '#470F59',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>← Back to Dashboard</button>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
            <h1 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{projectData.name}</h1>
            <p style={{ color: '#666', margin: 0, fontSize: '18px' }}>Project Code: <strong style={{ color: '#470F59' }}>{projectData.code}</strong></p>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button 
            onClick={() => setShowMilestoneForm(true)} 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            + Add Milestone
          </button>
        </div>

        {showMilestoneForm && (
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '15px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#333', marginBottom: '20px', fontSize: '1.5rem' }}>Add Milestone</h3>
            <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Milestone Title"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                style={{
                  padding: '15px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '16px'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="date"
                  placeholder="Start Date"
                  value={milestoneForm.startDate}
                  onChange={(e) => setMilestoneForm({...milestoneForm, startDate: e.target.value})}
                  style={{
                    padding: '15px 20px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '16px'
                  }}
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={milestoneForm.endDate}
                  onChange={(e) => setMilestoneForm({...milestoneForm, endDate: e.target.value})}
                  style={{
                    padding: '15px 20px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Assigned Members (comma separated emails)"
                value={milestoneForm.assignedMembers}
                onChange={(e) => setMilestoneForm({...milestoneForm, assignedMembers: e.target.value})}
                style={{
                  padding: '15px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={addMilestone} style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}>Add Milestone</button>
              <button onClick={() => setShowMilestoneForm(false)} style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}>Cancel</button>
            </div>
          </div>
        )}

        {milestones.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
            fontSize: '18px'
          }}>
            <p>No milestones yet. Click + Add Milestone to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '25px' }}>
          {milestones.map(milestone => (
            <div key={milestone.id} style={{
              background: 'white',
              border: '2px solid #e9ecef',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '15px'
                }}>
                  <h3 style={{ color: '#333', margin: 0, fontSize: '1.5rem' }}>{milestone.title}</h3>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {milestone.startDate} - {milestone.endDate}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '20px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: '8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: milestone.progress > 0 ? 'linear-gradient(90deg, #28a745, #20c997)' : '#e9ecef',
                        width: `${milestone.progress}%`,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: milestone.progress > 0 ? '#28a745' : '#6c757d',
                    minWidth: '80px',
                    textAlign: 'right'
                  }}>{Math.round(milestone.progress)}% Complete</span>
                </div>

                <div style={{
                  background: '#e3f2fd',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid #bbdefb'
                }}>
                  <strong style={{ color: '#1976d2', fontSize: '14px' }}>Assigned Members:</strong>
                  <div style={{ color: '#333', marginTop: '5px', fontSize: '15px' }}>
                    {Array.isArray(milestone.assignedMembers) ? 
                      milestone.assignedMembers.join(', ') || 'No members assigned' : 
                      milestone.assignedMembers || 'No members assigned'
                    }
                  </div>
                </div>

                <button 
                  onClick={() => setShowTaskForm(milestone.id)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(102, 126, 234, 0.3)',
                    transition: 'transform 0.2s ease',
                    marginBottom: '15px'
                  }}
                >
                  + Add Task
                </button>

                {showTaskForm === milestone.id && (
                  <div className="task-form">
                    <input
                      type="text"
                      placeholder="Task Title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    />
                    <input
                      type="date"
                      placeholder="Deadline"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                    />
                    <select
                      value={`${taskForm.assignee} - ${taskForm.responsibility}`}
                      onChange={(e) => {
                        const selected = getCollaboratorOptions().find(opt => opt.display === e.target.value);
                        setTaskForm({
                          ...taskForm, 
                          assignee: selected ? selected.email : '',
                          responsibility: selected ? selected.responsibility : ''
                        });
                      }}
                    >
                      <option value=" - ">Select Collaborator & Responsibility</option>
                      {getCollaboratorOptions().map((option, idx) => (
                        <option key={idx} value={option.display}>
                          {option.display}
                        </option>
                      ))}
                    </select>
                    <div className="form-buttons">
                      <button onClick={() => addTask(milestone.id)}>Add Task</button>
                      <button onClick={() => setShowTaskForm(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="tasks-list">
                  {milestone.tasks.map(task => (
                    <div key={task.id} className="task">
                      <div className="task-info">
                        <strong>{task.title}</strong>
                        <div className="task-details">
                          Due: {task.dueDate} | {task.assignee} - {task.responsibility}
                        </div>
                      </div>
                      <select 
                        value={task.status}
                        onChange={(e) => updateTaskStatus(milestone.id, task.id, e.target.value)}
                        className={`status-select ${task.status.toLowerCase().replace(' ', '-')}`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  ))}
                </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectTimeline;