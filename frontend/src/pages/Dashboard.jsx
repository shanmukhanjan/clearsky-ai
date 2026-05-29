import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AQICard from '../components/AQICard';
import AQIChart from '../components/AQIChart';
import PollutantPanel from '../components/PollutantPanel';
import SmogAlert from '../components/SmogAlert';
import HealthCard from '../components/HealthCard';
import AQIMap from '../components/AQIMap';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { fetchAQIData } from '../api/aqi';

const Dashboard = ({ defaultCity }) => {
    const [searchInput, setSearchInput] = useState(defaultCity || 'Hyderabad');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isWakingServer, setIsWakingServer] = useState(false);

    const loadCity = useCallback(async (city) => {
        if (!city?.trim()) return;
        setLoading(true);
        setError(null);
        setIsWakingServer(false);

        // Start a timer to warn the user if the server is sleeping (Render cold start)
        const wakeTimer = setTimeout(() => {
            setIsWakingServer(true);
        }, 4500);

        try {
            const result = await fetchAQIData(city.trim());
            clearTimeout(wakeTimer);
            setIsWakingServer(false);
            // Prefer the resolved city name from backend (important for map clicks)
            if (!result.city) result.city = city.trim();
            setData(result);
            // Always update the search bar to show the proper resolved name
            setSearchInput(result.city);
        } catch (err) {
            clearTimeout(wakeTimer);
            setIsWakingServer(false);
            const msg = err.response?.data?.error || err.message || '';
            if (msg.includes('not found') || msg.includes('City not found')) {
                setError(`Unable to find AQI data for "${city.trim()}" — try a nearby city or a different spelling.`);
            } else if (err.code === 'ECONNABORTED' || msg.includes('timeout')) {
                setError('Request timed out — the server may be busy or still spinning up. Please try again.');
            } else {
                setError('Unable to fetch AQI for this area. Please try a different location.');
            }
        } finally {
            clearTimeout(wakeTimer);
            setIsWakingServer(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (defaultCity) {
            loadCity(defaultCity);
            setSearchInput(defaultCity);
            return;
        }

        // Auto-geolocation on first load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = `${position.coords.latitude},${position.coords.longitude}`;
                    loadCity(coords);
                    setSearchInput("Current Location");
                },
                (err) => {
                    console.warn("Geolocation blocked or failed. Using default.", err);
                    loadCity('London');
                    setSearchInput('London');
                },
                { timeout: 10000 }
            );
        } else {
            loadCity('London');
            setSearchInput('London');
        }
    }, [loadCity, defaultCity]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-10">
            {/* Minimal Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                        Overview
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-[1000]">
                    <div className="w-full sm:w-96 shadow-xl">
                        <SearchAutocomplete 
                            onSelect={loadCity} 
                            defaultValue={searchInput} 
                            loading={loading} 
                            hideButton={false}
                        />
                    </div>
                    {data && (
                        <button
                            onClick={() => loadCity(data?.city || searchInput)}
                            disabled={loading}
                            className="p-4 rounded-2xl glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50 shadow-md"
                            aria-label="Refresh Data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Waking Server Alert & Error Messages */}
            <AnimatePresence mode="wait">
                {isWakingServer && (
                    <motion.div
                        key="wake-alert"
                        initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                        className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-md border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 p-5 rounded-2xl flex items-center gap-4 shadow-xl relative z-0"
                    >
                        <Loader2 className="w-6 h-6 flex-shrink-0 animate-spin text-amber-500" />
                        <span className="font-semibold flex-grow">Waking up the server (Render free-tier servers may take up to a minute to start)...</span>
                    </motion.div>
                )}
                {error && !isWakingServer && (
                    <motion.div
                        key="error-alert"
                        initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                        className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 p-5 rounded-2xl flex items-center gap-4 shadow-xl relative z-0"
                    >
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <span className="font-bold flex-grow">{error}</span>
                        <button onClick={() => loadCity(searchInput)} className="px-4 py-2 bg-red-100 dark:bg-red-800/30 rounded-xl text-sm font-bold transition-colors hover:bg-red-200 dark:hover:bg-red-800/50">Retry</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Primary Grid: Hero Gauge and Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-0">
                {/* AQI Overview Hero Card */}
                <div className="lg:col-span-5 flex flex-col min-h-[450px]">
                    {loading && !data ? (
                        <div className="flex-grow skeleton rounded-[2rem] shadow-xl" />
                    ) : (
                        <AQICard data={data} />
                    )}
                </div>
                
                {/* Map Container */}
                <div className="lg:col-span-7 glass-card rounded-[2rem] overflow-hidden flex flex-col min-h-[450px] shadow-xl relative group">
                    <div className="flex-grow relative">
                        {loading && !data ? (
                            <div className="absolute inset-0 skeleton" />
                        ) : (
                            <AQIMap data={data} onMapClick={(coords) => loadCity(`${coords.lat},${coords.lng}`)} />
                        )}
                    </div>
                </div>
            </div>

            {/* Analytics Chart */}
            <div className="glass-card rounded-[2rem] p-10 relative z-0 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">72-Hour Forecast</h2>
                </div>
                <div className="w-full relative z-10">
                    {loading && !data ? (
                        <div className="h-[350px] skeleton rounded-2xl" />
                    ) : (
                        <AQIChart data={data?.prediction} currentAQI={data?.currentAQI} />
                    )}
                </div>
            </div>

            {/* Detail Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
                {/* Health Section */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    {loading && !data ? (
                        <div className="flex-grow skeleton rounded-[2rem] min-h-[300px] shadow-xl" />
                    ) : (
                        <HealthCard health={data?.health} category={data?.category} />
                    )}
                </div>

                {/* Pollutant & Environmental Context */}
                <div className="lg:col-span-2 space-y-8 flex flex-col">
                    {loading && !data ? (
                        <div className="flex-grow skeleton rounded-[2rem] min-h-[300px] shadow-xl" />
                    ) : (
                        <div className="flex flex-col gap-8 flex-grow">
                            <div className="flex-grow">
                                <PollutantPanel
                                    pollutants={data?.pollutants}
                                    subIndices={data?.subIndices}
                                    dominantPollutant={data?.dominantPollutant}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
