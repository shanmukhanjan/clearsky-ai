import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AQICard from '../components/AQICard';
import AQIChart from '../components/AQIChart';
import PollutantPanel from '../components/PollutantPanel';
import HealthCard from '../components/HealthCard';
import AQIMap from '../components/AQIMap';
import SearchAutocomplete from '../components/SearchAutocomplete';
import AQI3DScene from '../components/AQI3DScene';

import { fetchAQIData } from '../api/aqi';

const Dashboard = ({ defaultCity }) => {

    const [searchInput, setSearchInput] = useState(defaultCity || 'Hyderabad');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isWakingServer, setIsWakingServer] = useState(false);

    const loadCity = useCallback(async (city) => {

        if (!city || !city.trim()) return;

        try {

            setLoading(true);
            setError(null);

            const wakeTimer = setTimeout(() => {
                setIsWakingServer(true);
            }, 4000);

            const result = await fetchAQIData(city.trim());

            clearTimeout(wakeTimer);
            setIsWakingServer(false);

            console.log("AQI RESULT:", result);

            if (!result) {
                throw new Error("No response received");
            }

            setData(result);

            setSearchInput(
                result.city ||
                city
            );

        } catch (err) {

            console.error("LOAD CITY ERROR:", err);

            const backendMessage =
                err?.response?.data?.error ||
                err.message ||
                "Unable to fetch AQI data";

            setError(backendMessage);

        } finally {

            setLoading(false);
            setIsWakingServer(false);

        }

    }, []);

    useEffect(() => {

        if (defaultCity) {
            loadCity(defaultCity);
            return;
        }

        if (!navigator.geolocation) {
            loadCity('Hyderabad');
            return;
        }

        navigator.geolocation.getCurrentPosition(

            (position) => {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log("LOCATION:", lat, lon);

                loadCity(`${lat},${lon}`);

            },

            (geoError) => {

                console.warn("Geolocation failed:", geoError);

                loadCity('Hyderabad');

            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }

        );

    }, [defaultCity, loadCity]);

    return (
        <>
            {/* 3D Scene Background */}
            <AQI3DScene aqi={data?.currentAQI} isDarkMode={true} />
            
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-10 relative z-10">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">

                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                        Overview
                    </h1>
                </div>

                <div className="flex gap-4 items-center">

                    <div className="w-[380px]">
                        <SearchAutocomplete
                            onSelect={loadCity}
                            defaultValue={searchInput}
                            loading={loading}
                            hideButton={false}
                        />
                    </div>

                    <button
                        onClick={() => loadCity(searchInput)}
                        disabled={loading}
                        className="p-4 rounded-2xl bg-[#111827] border border-white/10 text-white hover:bg-[#1f2937] transition-all"
                    >
                        <RefreshCw
                            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                        />
                    </button>

                </div>

            </div>

            {/* ALERTS */}

            <AnimatePresence>

                {isWakingServer && (

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20"
                    >

                        <div className="flex items-center gap-3 text-yellow-400">

                            <Loader2 className="animate-spin w-5 h-5" />

                            <span>
                                Waking backend server...
                            </span>

                        </div>

                    </motion.div>

                )}

                {error && (

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20"
                    >

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3 text-red-400">

                                <AlertCircle className="w-5 h-5" />

                                <span>{error}</span>

                            </div>

                            <button
                                onClick={() => loadCity(searchInput)}
                                className="px-4 py-2 rounded-xl bg-red-500/20 text-white"
                            >
                                Retry
                            </button>

                        </div>

                    </motion.div>

                )}

            </AnimatePresence>

            {/* CONTENT */}

            {loading && !data ? (

                <div className="text-center text-white py-20">
                    Loading AQI data...
                </div>

            ) : data ? (

                <>

                    {/* TOP SECTION */}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        <div className="lg:col-span-5">

                            <AQICard data={data} />

                        </div>

                        <div className="lg:col-span-7 h-[450px] rounded-[2rem] overflow-hidden border border-white/10">

                            <AQIMap
                                data={data}
                                onMapClick={(coords) => {

                                    if (!coords) return;

                                    loadCity(
                                        `${coords.lat},${coords.lng}`
                                    );

                                }}
                            />

                        </div>

                    </div>

                    {/* FORECAST */}

                    <div className="rounded-[2rem] p-10 bg-[#0f172a] border border-white/10">

                        <h2 className="text-2xl font-black mb-8 text-white">
                            72-Hour Forecast
                        </h2>

                        <AQIChart
                            data={data?.prediction}
                            currentAQI={data?.currentAQI}
                        />

                    </div>

                    {/* BOTTOM */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <HealthCard
                            health={data?.health}
                            category={data?.category}
                        />

                        <div className="lg:col-span-2">

                            <PollutantPanel
                                pollutants={data?.pollutants}
                                subIndices={data?.subIndices}
                                dominantPollutant={data?.dominantPollutant}
                            />

                        </div>

                    </div>

                </>

            ) : (

                <div className="text-center text-red-400 py-20">
                    No AQI data available
                </div>

            )}

        </div>
        </>

    );

};

export default Dashboard;