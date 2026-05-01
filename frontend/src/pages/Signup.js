import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Signup() {
    const { user, signup } = useAuth();
    const nav = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to="/dashboard" />;

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setErr('');

        // simple client side check
        if (form.password.length < 6) {
            setErr('password must be at least 6 chars');
            return;
        }

        setBusy(true);
        try {
            await signup(form);
            nav('/dashboard');
        } catch (ex) {
            const msg = ex.response?.data?.message
                || ex.response?.data?.errors?.[0]?.msg
                || 'signup failed';
            setErr(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="form-card">
            <h2>Sign up</h2>
            {err && <div className="error">{err}</div>}
            <form onSubmit={submit}>
                <div className="form-group">
                    <label>Name</label>
                    <input name="name" value={form.name} onChange={change} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} onChange={change} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" value={form.password} onChange={change} required />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select name="role" value={form.role} onChange={change}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                    <small style={{ color: '#9ca3af', fontSize: '12px' }}>
                        First user becomes admin automatically
                    </small>
                </div>
                <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
                    {busy ? 'Creating...' : 'Create account'}
                </button>
            </form>
            <p style={{ marginTop: '14px', fontSize: '13px', color: '#6b7280' }}>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default Signup;
