import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // on first load, try to fetch the user using stored token
    useEffect(() => {
        const token = localStorage.getItem('token');
        const stored = localStorage.getItem('user');
        if (token && stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                // if parsing fails just clear it
                localStorage.removeItem('user');
            }
            // also refresh from server in background
            api.get('/auth/me')
                .then(r => {
                    setUser(r.data);
                    localStorage.setItem('user', JSON.stringify(r.data));
                })
                .catch(() => {
                    // probably expired
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const r = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        setUser(r.data.user);
        return r.data.user;
    };

    const signup = async (data) => {
        const r = await api.post('/auth/signup', data);
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        setUser(r.data.user);
        return r.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
