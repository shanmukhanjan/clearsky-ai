import React from 'react';
import { getAQIColor } from '../utils/aqiUtils';

const AQIGauge = ({ aqi = 0 }) => {
    const size = 220;
    const cx = size / 2;
    const cy = size / 2 + 10;
    const r = 85;
    const strokeWidth = 14;

    const zones = [
        { max: 50,  color: '#10b981' }, // Good
        { max: 100, color: '#eab308' }, // Moderate
        { max: 150, color: '#f97316' }, // Unhealthy SG
        { max: 200, color: '#ef4444' }, // Unhealthy
        { max: 300, color: '#8b5cf6' }, // Very Unhealthy
        { max: 500, color: '#7f1d1d' }, // Hazardous
    ];

    const totalRange = 500;
    const startAngle = -210;
    const sweepDegrees = 240;

    const polarToXY = (angleDeg, radius) => {
        const rad = (angleDeg * Math.PI) / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    };

    const arcPath = (fromAQI, toAQI) => {
        const fromAngle = startAngle + (fromAQI / totalRange) * sweepDegrees;
        const toAngle   = startAngle + (toAQI   / totalRange) * sweepDegrees;
        const from = polarToXY(fromAngle, r);
        const to   = polarToXY(toAngle,   r);
        const large = toAngle - fromAngle > 180 ? 1 : 0;
        return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y}`;
    };

    const needleAngle = startAngle + (Math.min(aqi, 500) / totalRange) * sweepDegrees;
    const needleTip   = polarToXY(needleAngle, r - 15);
    const aqiColor = getAQIColor(aqi);

    return (
        <div className="relative group">
            <svg width={size} height={size - 40} viewBox={`0 0 ${size} ${size - 40}`}>
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {zones.map((zone, i) => (
                        <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={zone.color} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={zone.color} stopOpacity="1" />
                        </linearGradient>
                    ))}
                </defs>

                {/* Background track */}
                <path
                    d={arcPath(0, 500)}
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={strokeWidth + 8}
                    strokeLinecap="round"
                />

                {/* Color zones */}
                {zones.map((zone, i) => {
                    const prevMax = i === 0 ? 0 : zones[i - 1].max;
                    return (
                        <path
                            key={zone.max}
                            d={arcPath(prevMax, zone.max)}
                            fill="none"
                            stroke={zone.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            opacity={aqi >= prevMax ? 1 : 0.15}
                            filter={aqi >= prevMax && aqi < zone.max ? "url(#glow)" : ""}
                            className="transition-all duration-1000"
                        />
                    );
                })}

                {/* Needle */}
                <g transform={`rotate(${needleAngle + 90}, ${cx}, ${cy})`}>
                    <path
                        d={`M ${cx-4} ${cy} L ${cx+4} ${cy} L ${cx} ${cy - r + 10} Z`}
                        fill={aqiColor}
                        filter="url(#glow)"
                        className="transition-all duration-1000"
                    />
                </g>
                <circle cx={cx} cy={cy} r={8} fill={aqiColor} filter="url(#glow)" stroke="#1e293b" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={4} fill="#1e293b" />

                {/* Value Display */}
                <text x={cx} y={cy + 60} textAnchor="middle" className="fill-white font-black text-5xl tracking-tighter shadow-2xl">
                    {aqi}
                </text>
                <text x={cx} y={cy + 85} textAnchor="middle" className="fill-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
                    AQI INDEX
                </text>
            </svg>
            
            {/* Value Glow */}
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-4 w-20 h-20 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-1000"
                style={{ backgroundColor: aqiColor }}
            ></div>
        </div>
    );
};

export default AQIGauge;
