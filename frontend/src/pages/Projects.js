import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Projects() {
    const { user } = useAuth();
    const nav = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [err, setErr] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const r = await api.get('/projects');
            setProjects(r.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const create = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            await api.post('/projects', form);
            setForm({ name: '', description: '' });
            setShowModal(false);
            load();
        } catch (ex) {
            setErr(ex.response?.data?.message || 'create failed');
        }
    };

    const remove = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this project? All tasks will be removed too.')) return;
        try {
            await api.delete('/projects/' + id);
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'delete failed');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <div className="section-header">
                <h2>Projects</h2>
                {user.role === 'admin' &&
                    <button className="btn" onClick={() => setShowModal(true)}>+ New project</button>}
            </div>

            {projects.length === 0 ? (
                <div className="empty">
                    No projects yet.
                    {user.role === 'admin' && ' Click "New project" to create one.'}
                </div>
            ) : (
                <div className="project-grid">
                    {projects.map(p => (
                        <div key={p._id} className="project-card" onClick={() => nav('/projects/' + p._id)}>
                            <h3>{p.name}</h3>
                            <p>{p.description || 'No description'}</p>
                            <div className="meta">
                                <span>by {p.owner?.name || '?'}</span>
                                <span>{p.members?.length || 0} members</span>
                            </div>
                            {user.role === 'admin' && (
                                <button
                                    className="btn btn-sm btn-danger"
                                    style={{ marginTop: '10px' }}
                                    onClick={(e) => remove(p._id, e)}>
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-bg" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>New project</h3>
                        {err && <div className="error">{err}</div>}
                        <form onSubmit={create}>
                            <div className="form-group">
                                <label>Name</label>
                                <input value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projects;
