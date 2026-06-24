import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const LoginPage = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Already signed in? Skip the form.
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(API_BASE_URL, email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-cream px-4 animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-primary/10 p-8">
                {/* Brand */}
                <div className="mb-7 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                        <img src="/logo/logoicon.svg" className="w-8 h-8" alt="Med Spa logo" />
                    </div>
                    <h1 className="text-2xl font-serif tracking-wide text-text-dark">Admin Portal</h1>
                    <p className="text-xs text-text-muted mt-1 font-medium">
                        Sign in to manage bookings &amp; treatments
                    </p>
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                        <span className="font-icon text-base leading-none mt-0.5">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@medspa.com"
                            className="w-full rounded-xl border border-primary/15 bg-bg-cream/40 px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-primary/15 bg-bg-cream/40 px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <span className="font-icon text-base leading-none animate-spin">progress_activity</span>
                                Signing in…
                            </>
                        ) : (
                            <>
                                <span className="font-icon text-base leading-none">login</span>
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-[11px] text-text-muted/70">
                    Authorized staff only · access is provisioned by the administrator
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
