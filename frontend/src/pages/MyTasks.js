import React, { useEffect, useState } from 'react';
import api from '../api';

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const r = await api.get('/tasks?mine=true');
            setTasks(r.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put('/tasks/' + id, { status });
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'failed');
        }
    };

    const filtered = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'overdue') {
            return t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();
        }
        return t.status === filter;
    });

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <div className="section-header">
                <h2>My tasks</h2>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                    style={{ padding: '7px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                    <option value="all">All ({tasks.length})</option>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="empty">No tasks here.</div>
            ) : (
                <div className="task-list">
                    {filtered.map(t => {
                        const isOverdue = t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();
                        return (
                            <div key={t._id} className="task-item">
                                <div className="info">
                                    <h4>{t.title}</h4>
                                    <div className="desc">in {t.project?.name || '?'}</div>
                                    <div className="tags">
                                        <span className={'tag ' + t.status}>{t.status}</span>
                                        <span className={'tag ' + t.priority}>{t.priority}</span>
                                        {t.dueDate &&
                                            <span className={'tag ' + (isOverdue ? 'overdue' : '')}>
                                                Due {new Date(t.dueDate).toLocaleDateString()}
                                            </span>}
                                    </div>
                                </div>
                                <div className="task-actions">
                                    <select value={t.status}
                                        onChange={(e) => updateStatus(t._id, e.target.value)}
                                        style={{ padding: '5px', borderRadius: '5px', border: '1px solid #d1d5db', fontSize: '12px' }}>
                                        <option value="todo">todo</option>
                                        <option value="in-progress">in-progress</option>
                                        <option value="done">done</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyTasks;
