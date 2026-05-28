import { useState, useCallback } from 'react';
import { fetchAQIData } from '../api/aqi';

export const useAQI = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAQI = useCallback(async (city) => {
        if (!city) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAQIData(city);
            setData(result);
        } catch (err) {
            setError(err.message);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, getAQI };
};
