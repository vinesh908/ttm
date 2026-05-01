import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { user, login } = useAuth();
    const nav = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to="/dashboard" />;

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        setBusy(true);
        try {
            await login(email, password);
            nav('/dashboard');
        } catch (ex) {
            setErr(ex.response?.data?.message || 'login failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="form-card">
            <h2>Login</h2>
            {err && <div className="error">{err}</div>}
            <form onSubmit={submit}>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
                    {busy ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '14px', fontSize: '13px', color: '#6b7280' }}>
                No account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}

export default Login;
