import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectTimeline() {
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedProject = localStorage.getItem('currentProject');
    if (storedProject) {
      setProjectData(JSON.parse(storedProject));
    }
  }, []);

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

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now(),
      ...milestoneForm,
      assignedMembers: milestoneForm.assignedMembers.split(',').map(m => m.trim()),
      tasks: [],
      progress: 0
    };
    setMilestones([...milestones, newMilestone]);
    setMilestoneForm({ title: '', startDate: '', endDate: '', assignedMembers: '' });
    setShowMilestoneForm(false);
  };

  const addTask = (milestoneId) => {
    const newTask = {
      id: Date.now(),
      ...taskForm
    };
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, tasks: [...m.tasks, newTask] }
        : m
    ));
    setTaskForm({ title: '', dueDate: '', assignee: '', responsibility: '', status: 'To Do' });
    setShowTaskForm(null);
    updateProgress(milestoneId);
  };

  const updateTaskStatus = (milestoneId, taskId, newStatus) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { 
            ...m, 
            tasks: m.tasks.map(t => 
              t.id === taskId ? { ...t, status: newStatus } : t
            )
          }
        : m
    ));
    setTimeout(() => updateProgress(milestoneId), 0);
  };

  const updateProgress = (milestoneId) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const completedTasks = m.tasks.filter(t => t.status === 'Done').length;
        const progress = m.tasks.length > 0 ? (completedTasks / m.tasks.length) * 100 : 0;
        return { ...m, progress };
      }
      return m;
    }));
  };

  if (!projectData) {
    return (
      <div className="project-workspace">
        <h2>No Project Data</h2>
        <p>Please create a project first.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="project-workspace">
      <div className="timeline-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <h2>{projectData.name} - Timeline</h2>
        <p>Project Code: <strong>{projectData.code}</strong></p>
      </div>
      
      <button 
        onClick={() => setShowMilestoneForm(true)} 
        className="add-milestone-btn"
      >
        + Add Milestone
      </button>

      {showMilestoneForm && (
        <div className="milestone-form">
          <h3>Add Milestone</h3>
          <input
            type="text"
            placeholder="Milestone Title"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
          />
          <input
            type="date"
            placeholder="Start Date"
            value={milestoneForm.startDate}
            onChange={(e) => setMilestoneForm({...milestoneForm, startDate: e.target.value})}
          />
          <input
            type="date"
            placeholder="End Date"
            value={milestoneForm.endDate}
            onChange={(e) => setMilestoneForm({...milestoneForm, endDate: e.target.value})}
          />
          <input
            type="text"
            placeholder="Assigned Members (comma separated emails)"
            value={milestoneForm.assignedMembers}
            onChange={(e) => setMilestoneForm({...milestoneForm, assignedMembers: e.target.value})}
          />
          <div className="form-buttons">
            <button onClick={addMilestone}>Add Milestone</button>
            <button onClick={() => setShowMilestoneForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="empty-state">
          <p>No milestones yet. Click + Add Milestone to get started.</p>
        </div>
      ) : (
        <div className="milestones-list">
          {milestones.map(milestone => (
            <div key={milestone.id} className="milestone">
                <div className="milestone-header">
                  <h3>{milestone.title}</h3>
                  <div className="milestone-dates">
                    {milestone.startDate} - {milestone.endDate}
                  </div>
                </div>
                
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${milestone.progress}%`}}
                    ></div>
                  </div>
                  <span>{Math.round(milestone.progress)}% Complete</span>
                </div>

                <div className="assigned-members">
                  <strong>Assigned:</strong> {Array.isArray(milestone.assignedMembers) ? milestone.assignedMembers.join(', ') : milestone.assignedMembers}
                </div>

                <button 
                  onClick={() => setShowTaskForm(milestone.id)}
                  className="add-task-btn"
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
  );
}

export default ProjectTimeline;