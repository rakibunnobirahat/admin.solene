/**
 * API client methods for spa treatments management.
 */

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
            },
            body: JSON.stringify({ name, description, price, icon })
        });

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
            }
        });

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
