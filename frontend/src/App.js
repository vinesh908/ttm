import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import MyTasks from './pages/MyTasks';
import TeamPage from './pages/TeamPage';
import Landing from './pages/Landing';

function App() {
    return (
        <div className="app">
            <Navbar />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
                <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
                <Route path="/my-tasks" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
                <Route path="/team" element={<PrivateRoute><TeamPage /></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
}

export default App;
