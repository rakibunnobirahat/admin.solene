/**
 * API client methods for booking management.
 */

export const getBookings = async (API_BASE_URL) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`GET request failed! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error getting bookings:`, error);
        throw error;
    }
};

export const createBooking = async (API_BASE_URL, bookingData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const errResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errResult.error || `POST request failed! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error creating booking:`, error);
        throw error;
    }
};

export const updateBookingStatus = async (API_BASE_URL, id, status, extraFields = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, ...extraFields })
        });

        if (!response.ok) {
            const errResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errResult.error || `PATCH request failed! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error updating booking status:`, error);
        throw error;
    }
};

export const getBooking = async (API_BASE_URL, id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errResult = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(errResult.error || `GET request failed! Status: ${response.status}`);
        }

        return await response.json(); // Returns { success: true, data: booking }
    } catch (error) {
        console.error(`Error getting single booking:`, error);
        throw error;
    }
};
