import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Hidden admin-provisioning page.
 *
 * This route is intentionally NOT linked anywhere in the app. It only works if
 * the correct Setup Key (server-side ADMIN_SETUP_KEY) is supplied — the real
 * protection lives on the backend, not in this page being unlisted.
 */
const RegisterPage = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [setupKey, setSetupKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const result = await register(API_BASE_URL, email, password, setupKey);
            setSuccess(`Account created for ${result.user?.email || email}. Redirecting to sign in…`);
            setTimeout(() => navigate('/login', { replace: true }), 1400);
        } catch (err) {
            setError(err.message || 'Registration failed');
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
                    <h1 className="text-2xl font-serif tracking-wide text-text-dark">Create Admin</h1>
                    <p className="text-xs text-text-muted mt-1 font-medium">
                        Provision a new dashboard account
                    </p>
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                        <span className="font-icon text-base leading-none mt-0.5">error</span>
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-accent/60 border border-primary/20 px-3 py-2.5 text-sm text-primary">
                        <span className="font-icon text-base leading-none mt-0.5">check_circle</span>
                        <span>{success}</span>
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
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="w-full rounded-xl border border-primary/15 bg-bg-cream/40 px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="setupKey" className="block text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                            Setup Key
                        </label>
                        <input
                            id="setupKey"
                            type="password"
                            autoComplete="off"
                            required
                            value={setupKey}
                            onChange={(e) => setSetupKey(e.target.value)}
                            placeholder="Server provisioning secret"
                            className="w-full rounded-xl border border-primary/15 bg-bg-cream/40 px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                        />
                        <p className="mt-1.5 text-[11px] text-text-muted/70">
                            Matches <code className="font-mono">ADMIN_SETUP_KEY</code> on the server.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <span className="font-icon text-base leading-none animate-spin">progress_activity</span>
                                Creating…
                            </>
                        ) : (
                            <>
                                <span className="font-icon text-base leading-none">person_add</span>
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-[11px] text-text-muted/70">
                    Restricted · requires the server setup key
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
