import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X, Loader2, MapPin, Calendar, Activity } from 'lucide-react';
import { compareCities } from '../api/aqi';
import { getAQIColor } from '../utils/aqiUtils';
import AQIMap from './AQIMap';
import SearchAutocomplete from './SearchAutocomplete';

const CityCard = ({ cityData, isBetter }) => {
    if (!cityData) return null;
    const aqiColor = getAQIColor(cityData.currentAQI);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-8 flex-1 flex flex-col gap-6 relative overflow-hidden ${isBetter ? 'border-blue-500/40' : ''}`}
        >
            {isBetter && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-bl-xl">
                    Better Air
                </div>
            )}
            <div className="flex items-center gap-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] border border-[var(--glass-border)] flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold capitalize text-[var(--text-primary)] tracking-tight leading-none">{cityData.city}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1 block" style={{ color: aqiColor }}>{cityData.category}</span>
                </div>
            </div>

            <div className="flex flex-col items-center py-8 border-y border-[var(--glass-border)]">
                <span className="text-[5rem] font-black text-[var(--text-primary)] tracking-tighter leading-none">{cityData.currentAQI}</span>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-2">AQI</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[var(--bg-base)]/50 border border-[var(--glass-border)] rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> 24h
                    </div>
                    <div className="text-xl font-black text-[var(--text-primary)]">{cityData.prediction?.next24Hours ?? '--'}</div>
                </div>
                <div className="p-4 bg-[var(--bg-base)]/50 border border-[var(--glass-border)] rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        <Activity className="w-3.5 h-3.5 text-blue-500" /> 72h
                    </div>
                    <div className="text-xl font-black text-[var(--text-primary)]">{cityData.prediction?.next72Hours ?? '--'}</div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-auto">
                {['pm25', 'pm10', 'no2', 'o3'].map(key => {
                    const val = cityData.pollutants?.[key];
                    if (val == null) return null;
                    const labels = { pm25: 'PM2.5', pm10: 'PM10', no2: 'NO2', o3: 'O3' };
                    return (
                        <div key={key} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-2 rounded-xl">
                            <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{labels[key]}</div>
                            <div className="text-sm font-black text-[var(--text-primary)]">{val.toFixed(1)}</div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

const CompareView = ({ defaultCity, onClose }) => {
    const [city1, setCity1] = useState(defaultCity || '');
    const [city2, setCity2] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCompare = useCallback(async () => {
        if (!city1.trim() || !city2.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const result = await compareCities(city1.trim(), city2.trim());
            setData(result);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Comparison failed.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [city1, city2]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">Compare Locations</h2>
                    <p className="text-[var(--text-secondary)] text-base font-medium mt-1">Analyze air quality side-by-side.</p>
                </div>
                <button onClick={onClose}
                    className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Search Row */}
            <div className="p-6 flex flex-col md:flex-row gap-4 items-center border border-[var(--glass-border)] rounded-3xl bg-[var(--glass-bg)] backdrop-blur-[24px] shadow-lg">
                <div className="w-full">
                    <SearchAutocomplete
                        defaultValue={city1}
                        onChangeText={setCity1}
                        onSelect={(v) => setCity1(v)}
                        placeholder="First location..."
                        hideButton={true}
                    />
                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] hidden md:flex">
                    <ArrowLeftRight className="w-4 h-4" />
                </div>

                <div className="w-full">
                    <SearchAutocomplete
                        defaultValue={city2}
                        onChangeText={setCity2}
                        onSelect={(v) => setCity2(v)}
                        placeholder="Second location..."
                        hideButton={true}
                    />
                </div>

                <button
                    onClick={handleCompare}
                    disabled={loading || !city1.trim() || !city2.trim()}
                    className="btn-premium w-full md:w-auto min-h-[52px] flex items-center justify-center px-10 text-base flex-shrink-0 disabled:opacity-40"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Compare'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm font-bold">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-widest">Comparing Locations…</p>
                </div>
            )}

            {/* Results */}
            {data && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

                    {/* Two maps side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card overflow-hidden rounded-3xl h-72 relative">
                            <div className="absolute top-4 left-4 z-[1000] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest shadow-sm">
                                {data.city1?.city}
                            </div>
                            <AQIMap
                                coordinates={data.city1?.coordinates}
                                data={{ city: data.city1?.city, currentAQI: data.city1?.currentAQI, category: data.city1?.category, coordinates: data.city1?.coordinates }}
                            />
                        </div>
                        <div className="glass-card overflow-hidden rounded-3xl h-72 relative">
                            <div className="absolute top-4 left-4 z-[1000] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest shadow-sm">
                                {data.city2?.city}
                            </div>
                            <AQIMap
                                coordinates={data.city2?.coordinates}
                                data={{ city: data.city2?.city, currentAQI: data.city2?.currentAQI, category: data.city2?.category, coordinates: data.city2?.coordinates }}
                            />
                        </div>
                    </div>

                    {/* Verdict */}
                    <div className="glass-card p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        <p className="text-[var(--text-secondary)] font-medium text-xl leading-relaxed max-w-3xl mx-auto">
                            <span className="text-[var(--text-primary)] font-black text-2xl px-2">{data.comparison.betterCity}</span>
                            has better air quality, with a difference of
                            <span className="font-black text-blue-500 text-2xl px-2">{data.comparison.aqiDifference} AQI</span>.
                        </p>
                    </div>

                    {/* Side-by-side cards */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        <CityCard cityData={data.city1} isBetter={data.comparison.betterCity === data.city1?.city} />
                        <div className="flex items-center justify-center lg:py-0 py-4">
                            <div className="w-14 h-14 rounded-full bg-[var(--glass-bg)] flex items-center justify-center font-black text-[var(--text-secondary)] border border-[var(--glass-border)] text-base shadow-md">VS</div>
                        </div>
                        <CityCard cityData={data.city2} isBetter={data.comparison.betterCity === data.city2?.city} />
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default CompareView;
