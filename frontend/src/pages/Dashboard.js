import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line
    }, []);

    const loadData = async () => {
        try {
            const [s, t] = await Promise.all([
                api.get('/tasks/dashboard'),
                api.get('/tasks?mine=true')
            ]);
            setStats(s.data);
            setRecentTasks(t.data.slice(0, 5));
        } catch (e) {
            console.log('dashboard load fail', e);
        }
        setLoading(false);
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <h2 style={{ marginBottom: '6px' }}>Hi {user.name}</h2>
            <p style={{ color: '#6b7280', marginBottom: '22px', fontSize: '14px' }}>
                Here's what's on your plate.
            </p>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="label">Total tasks</div>
                        <div className="value">{stats.total}</div>
                    </div>
                    <div className="stat-card">
                        <div className="label">My tasks</div>
                        <div className="value">{stats.myTasks}</div>
                    </div>
                    <div className="stat-card">
                        <div className="label">In progress</div>
                        <div className="value">{stats.inProgress}</div>
                    </div>
                    <div className="stat-card done">
                        <div className="label">Done</div>
                        <div className="value">{stats.done}</div>
                    </div>
                    <div className="stat-card overdue">
                        <div className="label">Overdue</div>
                        <div className="value">{stats.overdue}</div>
                    </div>
                </div>
            )}

            <div className="section-header">
                <h3>My recent tasks</h3>
                <Link to="/my-tasks" className="btn btn-sm btn-secondary">View all</Link>
            </div>

            {recentTasks.length === 0 ? (
                <div className="empty">No tasks assigned to you yet.</div>
            ) : (
                <div className="task-list">
                    {recentTasks.map(t => (
                        <div key={t._id} className="task-item">
                            <div className="info">
                                <h4>{t.title}</h4>
                                <div className="desc">
                                    {t.project?.name || 'no project'}
                                </div>
                                <div className="tags">
                                    <span className={'tag ' + t.status}>{t.status}</span>
                                    <span className={'tag ' + t.priority}>{t.priority}</span>
                                    {t.dueDate && t.status !== 'done' &&
                                        new Date(t.dueDate) < new Date() &&
                                        <span className="tag overdue">overdue</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
