/**
 * Auth API client + token storage.
 *
 * Note: the token is kept in localStorage so it can be attached as a Bearer
 * header on cross-origin fetches (matching the existing API pattern). This is
 * convenient but readable by any script on the page — i.e. exposed to XSS. For
 * a hardened deployment, prefer an httpOnly cookie set by the server instead.
 */

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
};

export const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Authorization header for protected requests ({} when not logged in).
 */
export const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Called by protected API methods when the server returns 401 — clears the
 * stale session and notifies the app so it can redirect to /login.
 */
export const handleUnauthorized = () => {
    clearSession();
    window.dispatchEvent(new Event('auth:unauthorized'));
};

/**
 * Create a new admin account. Requires the secret setup key configured on the
 * server (ADMIN_SETUP_KEY) — without it the server refuses. Does not log in.
 */
export const register = async (API_BASE_URL, email, password, setupKey) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, setupKey })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || `Registration failed (status ${response.status})`);
    }
    return result;
};

/**
 * Exchange email + password for a JWT. Stores the session on success.
 */
export const login = async (API_BASE_URL, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || `Login failed (status ${response.status})`);
    }

    setSession(result.token, result.user);
    return result;
};
