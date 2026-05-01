import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();

    const handleLogout = () => {
        logout();
        nav('/');
    };

    return (
        <div className="navbar">
            <Link to={user ? '/dashboard' : '/'} className="logo">TTM</Link>
            <div className="nav-links">
                {user ? (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/projects">Projects</Link>
                        <Link to="/my-tasks">My Tasks</Link>
                        {user.role === 'admin' && <Link to="/team">Team</Link>}
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                            {user.name} ({user.role})
                        </span>
                        <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign up</Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default Navbar;
