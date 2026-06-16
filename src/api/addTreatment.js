const addTreatment = async (BASE_URL, endpoint, name, description = '', price = '', icon = '') => {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description, price, icon })
        });

        if (!response.ok) {
            throw new Error(`POST request failed! Status: ${response.status}`);
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error(`Error posting data to ${endpoint}:`, error);
        throw error;
    }
}

export default addTreatment;