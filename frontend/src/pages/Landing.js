import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Landing() {
    const { user } = useAuth();
    if (user) return <Navigate to="/dashboard" />;

    return (
        <div className="container">
            <div className="hero">
                <h1>Team Task Manager</h1>
                <p>Organize projects, assign tasks, track progress with your team.</p>
                <Link to="/signup" className="btn">Get started</Link>
                <Link to="/login" className="btn btn-secondary">Login</Link>
            </div>
        </div>
    );
}

export default Landing;
