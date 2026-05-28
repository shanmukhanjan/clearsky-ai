import React, { useEffect, useState } from 'react';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { getAQIColor } from '../utils/aqiUtils';

const RadialGauge = ({ value, color, max = 500 }) => {
    const [progress, setProgress] = useState(0);
    const radius = 120;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    
    useEffect(() => {
        // Animate gauge on load
        const timer = setTimeout(() => {
            const target = Math.min(value, max);
            setProgress((target / max) * 100);
        }, 100);
        return () => clearTimeout(timer);
    }, [value, max]);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            {/* Glowing background blur */}
            <div 
                className="absolute inset-0 rounded-full blur-[60px] opacity-20 dark:opacity-40 transition-all duration-1000"
                style={{ backgroundColor: color, transform: `scale(${progress > 0 ? 1.2 : 0.8})` }}
            ></div>
            
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90 relative z-10"
            >
                {/* Track */}
                <circle
                    stroke="var(--glass-border)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="opacity-20"
                />
                {/* Progress Ring */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="drop-shadow-lg"
                />
            </svg>
            
            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center z-20">
                <span className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums drop-shadow-sm">
                    {value}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1">
                    AQI Score
                </span>
            </div>
        </div>
    );
};

const AQICard = ({ data }) => {
    if (!data) return null;

    const { city, currentAQI, category, color, weather } = data;
    const aqiColor = color || getAQIColor(currentAQI);

    return (
        <div className="glass-card flex-col h-full p-10 relative overflow-hidden flex items-center justify-between group shadow-2xl rounded-[2rem] border-t border-[var(--glass-highlight)]">
            
            {/* Soft Ambient Overlay */}
            <div 
                className="absolute top-0 left-0 w-full h-2 transition-all duration-1000"
                style={{ background: `linear-gradient(90deg, transparent, ${aqiColor}, transparent)` }}
            ></div>

            {/* Header: City & Category */}
            <div className="w-full flex items-start justify-between relative z-10">
                <div className="space-y-1.5">
                    <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight capitalize drop-shadow-sm">{city}</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse" style={{ backgroundColor: aqiColor, boxShadow: `0 0 12px ${aqiColor}` }}></div>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: aqiColor }}>{category}</span>
                    </div>
                </div>
            </div>

            {/* Center: Radial Gauge */}
            <div className="flex-grow flex items-center justify-center w-full py-8 relative z-10">
                <RadialGauge value={currentAQI} color={aqiColor} />
            </div>

            {/* Bottom: Weather Context */}
            <div className="w-full grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-[var(--bg-base)]/40 border border-[var(--glass-border)] backdrop-blur-md flex items-center gap-4 hover:bg-[var(--bg-base)]/60 transition-colors">
                    <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] shadow-sm border border-[var(--glass-border)]">
                        <Thermometer className="w-5 h-5 text-orange-500 drop-shadow-sm" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Temp</div>
                        <div className="text-lg font-black text-[var(--text-primary)]">{weather?.temperature}°</div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-base)]/40 border border-[var(--glass-border)] backdrop-blur-md flex items-center gap-4 hover:bg-[var(--bg-base)]/60 transition-colors">
                    <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] shadow-sm border border-[var(--glass-border)]">
                        <Wind className="w-5 h-5 text-blue-500 drop-shadow-sm" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Wind</div>
                        <div className="text-lg font-black text-[var(--text-primary)]">{weather?.windSpeed} <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">km/h</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AQICard;
