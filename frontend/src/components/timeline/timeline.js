import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectTimeline() {
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showCompletionPopup, setShowCompletionPopup] = useState(null);
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
    assignedMembers: '',
    tasks: []
  });

  const [tempTask, setTempTask] = useState({ title: '', assignee: '', responsibility: '' });

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
    if (!milestoneForm.startDate) {
      alert('Please select a start date.');
      return;
    }
    if (milestoneForm.tasks.length === 0) {
      alert('Please add at least one task to the milestone.');
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/project/${projectData.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestoneForm.title,
          startDate: milestoneForm.startDate,
          endDate: milestoneForm.endDate,
          assignedMembers: milestoneForm.assignedMembers.split(',').map(m => m.trim()),
          tasks: milestoneForm.tasks
        })
      });
      const result = await response.json();
      if (result.success) {
        loadMilestones(projectData.id);
        setMilestoneForm({ title: '', startDate: '', endDate: '', assignedMembers: '', tasks: [] });
        setTempTask({ title: '', assignee: '', responsibility: '' });
        setShowMilestoneForm(false);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const addTaskToMilestone = () => {
    if (!tempTask.title.trim()) return;
    setMilestoneForm({
      ...milestoneForm,
      tasks: [...milestoneForm.tasks, { ...tempTask, id: Date.now() }]
    });
    setTempTask({ title: '', assignee: '', responsibility: '' });
  };

  const removeTaskFromMilestone = (taskId) => {
    setMilestoneForm({
      ...milestoneForm,
      tasks: milestoneForm.tasks.filter(task => task.id !== taskId)
    });
  };

  const deleteMilestone = async (milestoneId, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Are you sure you want to delete this milestone?')) return;
    
    // Immediately remove from UI
    setMilestones(prev => prev.filter(m => m.id !== milestoneId));
    
    // Try to delete from backend
    try {
      await fetch(`http://127.0.0.1:5000/api/milestone/${milestoneId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      // Reload milestones if backend delete failed
      loadMilestones(projectData.id);
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
        await loadMilestones(projectData.id);
        
        // Check if all tasks in milestone are completed
        const milestone = milestones.find(m => m.id === milestoneId);
        if (milestone && milestone.tasks.length > 0) {
          const allCompleted = milestone.tasks.every(task => 
            task.id === taskId ? newStatus === 'Done' : task.status === 'Done'
          );
          if (allCompleted) {
            setShowCompletionPopup(milestoneId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const calculateOverallProgress = () => {
    const allTasks = milestones.flatMap(m => m.tasks || []);
    if (allTasks.length === 0) return 0;
    const totalProgress = allTasks.reduce((sum, task) => {
      if (task.status === 'Done') return sum + 100;
      if (task.status === 'In Progress') return sum + 50;
      return sum; // Not Started = 0
    }, 0);
    return totalProgress / allTasks.length;
  };

  const getProgressColor = (progress) => {
    if (progress < 40) return '#dc3545'; // Red
    if (progress < 70) return '#ffc107'; // Yellow
    // Gradual green from 70-100%
    const greenIntensity = Math.min(255, 100 + (progress - 70) * 5);
    return `rgb(40, ${greenIntensity}, 69)`; // Gradual green
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
      display: 'flex',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: '350px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)'
      }}>

        {/* Overall Progress Bar */}
        {milestones.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '1.1rem' }}>Progress</h3>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                {Math.round(calculateOverallProgress())}% Complete
              </span>
            </div>
            <div style={{
              height: '15px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: getProgressColor(calculateOverallProgress()),
                width: `${calculateOverallProgress()}%`,
                borderRadius: '10px',
                transition: 'all 0.5s ease'
              }}></div>
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '8px'
            }}>
              {milestones.filter(m => (m.progress || 0) === 100).length} of {milestones.length} completed
            </div>
          </div>
        )}

        {/* Milestones List */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '1.1rem' }}>Milestones ({milestones.length})</h3>
          {milestones.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>No milestones yet</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {milestones.map(milestone => (
                <button key={milestone.id} 
                  onClick={() => setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '2px solid #F0E68C',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                    <div 
                      style={{ color: 'white', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', position: 'relative' }}
                      onMouseEnter={() => setHoveredMilestone(milestone.id)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    >
                      {hoveredMilestone === milestone.id && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this milestone?')) {
                              setMilestones(prev => prev.filter(m => m.id !== milestone.id));
                              try {
                                await fetch(`http://127.0.0.1:5000/api/milestone/${milestone.id}`, {
                                  method: 'DELETE'
                                });
                              } catch (error) {
                                console.error('Error deleting from database:', error);
                              }
                            }
                          }}
                          style={{
                            background: 'transparent',
                            color: 'white',
                            border: 'none',
                            padding: '2px 4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                        >
                          ×
                        </button>
                      )}
                      {milestone.title}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTaskForm(milestone.id);
                      }}
                      style={{
                        background: '#470F59',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      + Task
                    </button>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '5px' }}>
                    {milestone.startDate || new Date().toISOString().split('T')[0]} → {milestone.endDate}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                    {milestone.tasks?.length || 0} tasks
                  </div>
                  {selectedMilestone === milestone.id && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                      {milestone.tasks?.length > 0 ? (
                        milestone.tasks.map(task => (
                          <div key={task.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '12px'
                          }}>
                            <span style={{
                              color: task.status === 'Done' ? 'rgba(255, 255, 255, 0.5)' : 'white',
                              textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                              cursor: 'help',
                              flex: 1
                            }}
                            onMouseEnter={(e) => {
                              setHoveredTask(task.id);
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                              if (hoveredTask === task.id) {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseLeave={() => setHoveredTask(null)}>
                              {task.title}
                            </span>
                            <select
                              value={task.status || 'Not Started'}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(milestone.id, task.id, e.target.value);
                              }}
                              style={{
                                background: task.status === 'Done' ? '#28a745' : task.status === 'In Progress' ? '#ffc107' : '#dc3545',
                                color: 'black',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 4px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                              }}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In progress</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>No tasks yet</div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => setShowMilestoneForm(true)} 
            style={{
              width: '100%',
              background: 'rgba(255, 249, 196, 0.6)',
              color: '#333',
              border: '2px solid #fffacd',
              padding: '12px 20px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            + Add Milestone
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '2rem' }}>Project Timeline</h2>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>Manage your milestones and tasks from the sidebar</p>
        </div>
      </div>

      {/* Milestone Form Popup */}
      {showMilestoneForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
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
              <select
                value={milestoneForm.assignedMembers}
                onChange={(e) => setMilestoneForm({...milestoneForm, assignedMembers: e.target.value})}
                style={{
                  padding: '15px 20px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select Collaborator</option>
                {projectData.collaborators.map((collab, index) => (
                  <option key={index} value={collab.email}>{collab.email}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>Tasks (Required - at least 1)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={tempTask.title}
                  onChange={(e) => setTempTask({...tempTask, title: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                />
                <select
                  value={`${tempTask.assignee} - ${tempTask.responsibility}`}
                  onChange={(e) => {
                    const selected = getCollaboratorOptions().find(opt => opt.display === e.target.value);
                    setTempTask({
                      ...tempTask, 
                      assignee: selected ? selected.email : '',
                      responsibility: selected ? selected.responsibility : ''
                    });
                  }}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                >
                  <option value=" - ">Select Collaborator & Responsibility</option>
                  {getCollaboratorOptions().map((option, idx) => (
                    <option key={idx} value={option.display}>
                      {option.display}
                    </option>
                  ))}
                </select>
                <button onClick={addTaskToMilestone} style={{
                  padding: '10px 15px',
                  background: '#470F59',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>+</button>
              </div>
              
              {milestoneForm.tasks.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                  {milestoneForm.tasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span style={{ fontSize: '14px' }}>{task.title} - {task.assignee}</span>
                      <button onClick={() => removeTaskFromMilestone(task.id)} style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}
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
        </div>
      )}

      {/* Completion Popup */}
      {showCompletionPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          {/* Confetti Animation */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1000
          }}>
            {Array.from({ length: 100 }).map((_, i) => {
              const startX = 50 + (Math.random() - 0.5) * 20;
              const startY = 50 + (Math.random() - 0.5) * 20;
              const endX = Math.random() * 100;
              const endY = Math.random() * 100;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: `${5 + Math.random() * 10}px`,
                    height: `${5 + Math.random() * 10}px`,
                    background: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#f093fb', '#f5576c'][i % 8],
                    left: `${startX}%`,
                    top: `${startY}%`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    animationName: `confetti-${i}`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationIterationCount: '1',
                    animationTimingFunction: 'ease-out',
                    animationFillMode: 'forwards'
                  }}
                />
              );
            })}
          </div>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '400px',
            textAlign: 'center',
            zIndex: 1002
          }}>
            <h3 style={{ color: '#28a745', marginBottom: '15px' }}>🎉 Milestone Completed!</h3>
            <p style={{ color: '#333', marginBottom: '20px' }}>All tasks are done. Would you like to delete this milestone?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => {
                deleteMilestone(showCompletionPopup);
                setShowCompletionPopup(null);
              }} style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Delete Milestone</button>
              <button onClick={() => setShowCompletionPopup(null)} style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Keep Milestone</button>
            </div>
          </div>
          <style>{`
            ${Array.from({ length: 100 }).map((_, i) => {
              const startX = 50 + (Math.random() - 0.5) * 20;
              const startY = 50 + (Math.random() - 0.5) * 20;
              const endX = Math.random() * 100;
              const endY = Math.random() * 100;
              const rotation = Math.random() * 720;
              return `
                @keyframes confetti-${i} {
                  0% {
                    transform: translate(0, 0) rotate(0deg) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translate(${endX - startX}vw, ${endY - startY}vh) rotate(${rotation}deg) scale(0.5);
                    opacity: 0;
                  }
                }
              `;
            }).join('')}
          `}</style>
        </div>
      )}

      {/* Task Tooltip */}
      {hoveredTask && (
        <div style={{
          position: 'fixed',
          left: mousePosition.x + 10,
          top: mousePosition.y - 10,
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          zIndex: 1002,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }}>
          {(() => {
            const task = milestones.flatMap(m => m.tasks).find(t => t.id === hoveredTask);
            return task ? (
              <>
                <div>Due: {task.dueDate || 'No due date'}</div>
                <div>Assignee: {task.assignee || 'Unassigned'}</div>
                <div>Responsibility: {task.responsibility || 'None'}</div>
                <div>Status: {task.status}</div>
              </>
            ) : null;
          })()
          }
        </div>
      )}

      {/* Task Form Popup */}
      {showTaskForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>Add Task</h3>
            <input
              type="text"
              placeholder="Task Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
            <label style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>Deadline</label>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                margin: '5px 0 10px 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
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
              style={{
                width: '100%',
                padding: '12px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            >
              <option value=" - ">Select Collaborator & Responsibility</option>
              {getCollaboratorOptions().map((option, idx) => (
                <option key={idx} value={option.display}>
                  {option.display}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => addTask(showTaskForm)} style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Add Task</button>
              <button onClick={() => setShowTaskForm(null)} style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTimeline;