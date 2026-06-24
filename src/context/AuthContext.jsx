import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    getToken,
    getStoredUser,
    clearSession,
    login as apiLogin
} from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => getStoredUser());
    const [token, setToken] = useState(() => getToken());

    const login = async (API_BASE_URL, email, password) => {
        const result = await apiLogin(API_BASE_URL, email, password);
        setUser(result.user);
        setToken(result.token);
        return result;
    };

    const logout = () => {
        clearSession();
        setUser(null);
        setToken(null);
    };

    // When a protected request gets a 401 (expired/invalid token), the API layer
    // fires this event so the whole app drops back to the login screen.
    useEffect(() => {
        const onUnauthorized = () => {
            setUser(null);
            setToken(null);
        };
        window.addEventListener('auth:unauthorized', onUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
