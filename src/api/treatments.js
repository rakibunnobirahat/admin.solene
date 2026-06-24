/**
 * API client methods for spa treatments management.
 */
import { authHeaders, handleUnauthorized } from './auth';

export const getTreatments = async (API_BASE_URL) => {
    try {
        const response = await fetch(`${API_BASE_URL}/treatments`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`GET request failed! Status: ${response.status}`);
        }

        const result = await response.json();
        return result; // Returns { success: true, data: [...] }
    } catch (error) {
        console.error(`Error getting treatments:`, error);
        throw error;
    }
};

export const addTreatment = async (API_BASE_URL, name, description = '', price = '', icon = '') => {
    try {
        const response = await fetch(`${API_BASE_URL}/treatments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify({ name, description, price, icon })
        });

        if (response.status === 401) handleUnauthorized();
        if (!response.ok) {
            const errResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errResult.error || `POST request failed! Status: ${response.status}`);
        }

        const result = await response.json();
        return result; // Returns { success: true, data: {...} }
    } catch (error) {
        console.error(`Error adding treatment:`, error);
        throw error;
    }
};

export const deleteTreatment = async (API_BASE_URL, id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/treatments/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
            }
        });

        if (response.status === 401) handleUnauthorized();
        if (!response.ok) {
            const errResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errResult.error || `DELETE request failed! Status: ${response.status}`);
        }

        const result = await response.json();
        return result; // Returns { success: true, data: {...} }
    } catch (error) {
        console.error(`Error deleting treatment:`, error);
        throw error;
    }
};
