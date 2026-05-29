import React from 'react';
import { getAQIColor } from '../utils/aqiUtils';

const PollutantPanel = ({ pollutants, subIndices, dominantPollutant }) => {
    if (!pollutants) return null;

    const list = [
        { id: 'pm25', label: 'PM2.5', value: pollutants.pm25, unit: 'µg/m³', aqi: subIndices?.pm25 },
        { id: 'pm10', label: 'PM10',  value: pollutants.pm10, unit: 'µg/m³', aqi: subIndices?.pm10 },
        { id: 'no2',  label: 'NO2',   value: pollutants.no2,  unit: 'µg/m³', aqi: subIndices?.no2 },
        { id: 'so2',  label: 'SO2',   value: pollutants.so2,  unit: 'µg/m³', aqi: subIndices?.so2 },
        { id: 'o3',   label: 'O3',    value: pollutants.o3,   unit: 'µg/m³', aqi: subIndices?.o3 },
        { id: 'co',   label: 'CO',    value: pollutants.co,   unit: 'µg/m³', aqi: subIndices?.co },
    ];

    return (
        <div className="glass-card p-8 flex flex-col h-full rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Pollutant Breakdown</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 flex-grow">
                {list.map((item) => {
                    const color = getAQIColor(item.aqi || 0);
                    const isDominant = item.id === dominantPollutant;

                    return (
                        <div 
                            key={item.id} 
                            className={`p-5 rounded-[1.5rem] border transition-all duration-500 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 ${
                                isDominant ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.15)]' : 'bg-[var(--bg-base)]/50 border-[var(--glass-border)] hover:bg-[var(--glass-highlight)]'
                            }`}
                        >
                            {/* Subtle background glow for dominant pollutant */}
                            {isDominant && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-[20px] rounded-full pointer-events-none"></div>
                            )}

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDominant ? 'text-blue-500' : 'text-[var(--text-secondary)]'}`}>
                                    {item.label}
                                </span>
                            </div>
                            
                            <div className="space-y-1 relative z-10">
                                <div className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tighter">
                                    {item.value?.toFixed(1) || '0.0'}
                                </div>
                                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                                    {item.unit}
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-[var(--glass-border)] flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em]">AQI Index</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black" style={{ color }}>{item.aqi || 0}</span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PollutantPanel;
