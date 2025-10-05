import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CreateProject from './components/CreateProject';
import ProjectView from './components/ProjectView';
import ProjectsList from './components/ProjectsList';
import Chatroom from './components/chat/chatroom';
import ProjectTimeline from './components/timeline/timeline';
import Settings from './components/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/project/:projectId" element={<ProjectView />} />
        <Route path="/project/:projectId/timeline" element={<ProjectTimeline />} />
        <Route path="/chatroom" element={<Chatroom currentUser={{id: 1, name: 'User'}} />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;