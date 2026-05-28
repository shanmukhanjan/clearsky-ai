import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAQIColor } from '../utils/aqiUtils';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const color = getAQIColor(val);
        return (
            <div className="bg-[var(--glass-bg)] p-4 rounded-2xl border border-[var(--glass-border)] min-w-[120px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-[20px] opacity-20 pointer-events-none" style={{ backgroundColor: color }}></div>
                
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-2">{payload[0].payload.time}</p>
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <span className="text-2xl font-black text-[var(--text-primary)]">{val}</span>
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]" style={{ backgroundColor: color }}></div>
                </div>
                <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mt-1">Predicted AQI</p>
            </div>
        );
    }
    return null;
};

const AQIChart = ({ data, currentAQI }) => {
    const safeData = data || {};
    
    // Ensure we always have valid numbers
    const parseAQI = (val, fallback) => {
        const num = parseInt(val, 10);
        return isNaN(num) ? fallback : num;
    };

    const baseAQI = parseAQI(currentAQI, 0);

    const chartData = [
        { time: 'Now', aqi: baseAQI },
        { time: '+6h', aqi: parseAQI(safeData.next6Hours, baseAQI) },
        { time: '+12h', aqi: parseAQI(safeData.next12Hours, baseAQI) },
        { time: '+24h', aqi: parseAQI(safeData.next24Hours, baseAQI) },
        { time: '+48h', aqi: parseAQI(safeData.next48Hours, parseAQI(safeData.next24Hours, baseAQI)) },
        { time: '+72h', aqi: parseAQI(safeData.next72Hours, parseAQI(safeData.next48Hours, baseAQI)) },
    ];

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="80%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }}
                        dy={15}
                    />
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--text-secondary)' }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        isAnimationActive={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="aqi"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAqi)"
                        animationDuration={1500}
                        activeDot={{ r: 6, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AQIChart;
