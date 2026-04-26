import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(identity, password) {
        const { data } = await api.post('/login', { login: identity, password });
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        return data;
    }

    async function logout() {
        await api.post('/logout');
        localStorage.removeItem('auth_token');
        setUser(null);
    }

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.get('/user');
                setUser(data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const value = {
        user,
        setUser,
        login,
        logout
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-600">Loading App...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
