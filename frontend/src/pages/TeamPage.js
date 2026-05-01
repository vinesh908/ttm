import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function TeamPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'admin') load();
        // eslint-disable-next-line
    }, []);

    const load = async () => {
        try {
            const r = await api.get('/users');
            setUsers(r.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const changeRole = async (id, role) => {
        try {
            await api.put('/users/' + id + '/role', { role });
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'failed');
        }
    };

    const removeUser = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await api.delete('/users/' + id);
            load();
        } catch (ex) {
            alert(ex.response?.data?.message || 'failed');
        }
    };

    if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <h2 style={{ marginBottom: '20px' }}>Team</h2>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Role</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px' }}>{u.name}</td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>{u.email}</td>
                                <td style={{ padding: '12px' }}>
                                    <select value={u.role}
                                        onChange={(e) => changeRole(u._id, e.target.value)}
                                        disabled={u._id === user._id}
                                        style={{ padding: '5px', border: '1px solid #d1d5db', borderRadius: '5px' }}>
                                        <option value="member">member</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {u._id !== user._id && (
                                        <button className="btn btn-sm btn-danger" onClick={() => removeUser(u._id)}>
                                            Delete
                                        </button>
                                    )}
                                    {u._id === user._id && <span style={{ color: '#9ca3af', fontSize: '12px' }}>(you)</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TeamPage;
