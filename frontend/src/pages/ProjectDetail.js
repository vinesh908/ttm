import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function ProjectDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const nav = useNavigate();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '', description: '', assignedTo: '',
        priority: 'medium', status: 'todo', dueDate: ''
    });
    const [err, setErr] = useState('');
    const [memberSelect, setMemberSelect] = useState('');

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [id]);

    const load = async () => {
        try {
            const [p, t, u] = await Promise.all([
                api.get('/projects/' + id),
                api.get('/tasks?project=' + id),
                api.get('/users')
            ]);
            setProject(p.data);
            setTasks(t.data);
            setUsers(u.data);
        } catch (e) {
            console.log('load proj err', e);
            if (e.response?.status === 403 || e.response?.status === 404) {
                nav('/projects');
            }
        }
        setLoading(false);
    };

    const isAdminOrOwner = user.role === 'admin' ||
        (project && project.owner && project.owner._id === user._id);

    const openCreate = () => {
        setEditingTask(null);
        setTaskForm({
            title: '', description: '', assignedTo: '',
            priority: 'medium', status: 'todo', dueDate: ''
        });
        setErr('');
        setShowTaskModal(true);
    };

    const openEdit = (t) => {
        setEditingTask(t);
        setTaskForm({
            title: t.title,
            description: t.description || '',
            assignedTo: t.assignedTo?._id || '',
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate ? t.dueDate.substring(0, 10) : ''
        });
        setErr('');
        setShowTaskModal(true);
    };

    const saveTask = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            const payload = { ...taskForm, project: id };
            if (!payload.assignedTo) payload.assignedTo = null;
            if (!payload.dueDate) payload.dueDate = null;

            if (editingTask) {
                await api.put('/tasks/' + editingTask._id, payload);
            } else {
                await api.post('/tasks', payload);
            }
            setShowTaskModal(false);
            load();
        } catch (ex) {
            setErr(ex.response?.data?.message || 'save failed');
        }
    };

    const updateStatus = async (task, status) => {
        try {
            await api.put('/tasks/' + task._id, { status });
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'update failed');
        }
    };

    const removeTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete('/tasks/' + taskId);
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'delete failed');
        }
    };

    const addMember = async () => {
        if (!memberSelect) return;
        try {
            await api.post('/projects/' + id + '/members', { userId: memberSelect });
            setMemberSelect('');
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'failed');
        }
    };

    const removeMember = async (uid) => {
        if (!window.confirm('Remove this member?')) return;
        try {
            await api.delete('/projects/' + id + '/members/' + uid);
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'failed');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!project) return <div className="empty">Project not found</div>;

    // people who arent already members + arent the owner
    const availableUsers = users.filter(u =>
        u._id !== project.owner._id &&
        !project.members.some(m => m._id === u._id)
    );

    return (
        <div className="container">
            <div className="section-header">
                <div>
                    <h2>{project.name}</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        {project.description || 'No description'}
                    </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => nav('/projects')}>
                    ← Back
                </button>
            </div>

            {/* members section */}
            <div style={{ background: 'white', padding: '18px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ marginBottom: '10px' }}>Team members</h4>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                    Owner: {project.owner.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {project.members.map(m => (
                        <span key={m._id} className="tag" style={{ padding: '5px 10px' }}>
                            {m.name}
                            {isAdminOrOwner && (
                                <button onClick={() => removeMember(m._id)}
                                    style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                    ×
                                </button>
                            )}
                        </span>
                    ))}
                    {project.members.length === 0 && <span style={{ color: '#9ca3af', fontSize: '13px' }}>No members yet</span>}
                </div>

                {isAdminOrOwner && availableUsers.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={memberSelect} onChange={(e) => setMemberSelect(e.target.value)}
                            style={{ padding: '7px', border: '1px solid #d1d5db', borderRadius: '6px', flex: 1 }}>
                            <option value="">Add a member...</option>
                            {availableUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        <button className="btn btn-sm" onClick={addMember}>Add</button>
                    </div>
                )}
            </div>

            <div className="section-header">
                <h3>Tasks ({tasks.length})</h3>
                <button className="btn" onClick={openCreate}>+ New task</button>
            </div>

            {tasks.length === 0 ? (
                <div className="empty">No tasks yet. Create one above.</div>
            ) : (
                <div className="task-list">
                    {tasks.map(t => {
                        const isOverdue = t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();
                        const canEdit = isAdminOrOwner;
                        const canChangeStatus = canEdit ||
                            (t.assignedTo && t.assignedTo._id === user._id);

                        return (
                            <div key={t._id} className="task-item">
                                <div className="info">
                                    <h4>{t.title}</h4>
                                    {t.description && <div className="desc">{t.description}</div>}
                                    <div className="tags">
                                        <span className={'tag ' + t.status}>{t.status}</span>
                                        <span className={'tag ' + t.priority}>{t.priority}</span>
                                        {t.assignedTo && <span className="tag">→ {t.assignedTo.name}</span>}
                                        {t.dueDate && (
                                            <span className={'tag ' + (isOverdue ? 'overdue' : '')}>
                                                Due {new Date(t.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="task-actions">
                                    {canChangeStatus && (
                                        <select value={t.status}
                                            onChange={(e) => updateStatus(t, e.target.value)}
                                            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #d1d5db', fontSize: '12px' }}>
                                            <option value="todo">todo</option>
                                            <option value="in-progress">in-progress</option>
                                            <option value="done">done</option>
                                        </select>
                                    )}
                                    {canEdit && (
                                        <>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>Edit</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => removeTask(t._id)}>×</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showTaskModal && (
                <div className="modal-bg" onClick={() => setShowTaskModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingTask ? 'Edit task' : 'New task'}</h3>
                        {err && <div className="error">{err}</div>}
                        <form onSubmit={saveTask}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Assign to</label>
                                <select value={taskForm.assignedTo}
                                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    <option value={project.owner._id}>{project.owner.name} (owner)</option>
                                    {project.members.map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={taskForm.status}
                                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                                    <option value="todo">Todo</option>
                                    <option value="in-progress">In progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Due date</label>
                                <input type="date" value={taskForm.dueDate}
                                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button type="submit" className="btn">
                                    {editingTask ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;
