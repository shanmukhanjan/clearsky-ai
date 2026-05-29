import React from 'react';
import { Heart, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const HealthCard = ({ health, category }) => {
    if (!health) return null;

    const isGood = category === 'Good';
    const isModerate = category === 'Moderate';
    const isPoor = category === 'Poor';
    
    const accentColor = isGood ? 'bg-green-500' : isModerate ? 'bg-yellow-500' : isPoor ? 'bg-orange-500' : 'bg-red-500';
    const shadowColor = isGood ? 'shadow-[0_0_30px_rgba(34,197,94,0.1)]' : isModerate ? 'shadow-[0_0_30px_rgba(234,179,8,0.1)]' : isPoor ? 'shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'shadow-[0_0_30px_rgba(239,68,68,0.1)]';

    return (
        <div className={`glass-card p-8 flex flex-col h-full relative overflow-hidden ${shadowColor} transition-all duration-700 hover:shadow-xl rounded-[2rem]`}>
            {/* Subtle top accent bar */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${accentColor} opacity-80`}></div>

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[var(--bg-base)]/50 border border-[var(--glass-border)] rounded-2xl shadow-sm">
                    <Heart className="w-6 h-6 text-blue-500 drop-shadow-sm" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Health Advice</h2>
                </div>
            </div>

            <div className="space-y-6 flex-grow">
                <div className="p-5 bg-[var(--bg-base)]/40 border border-[var(--glass-border)] rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <p className="text-[var(--text-primary)] font-semibold text-[15px] leading-relaxed relative z-10">
                        {health.recommendation || "Air quality is generally acceptable for most individuals."}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4 p-4 bg-[var(--bg-base)]/20 border border-transparent hover:border-[var(--glass-border)] rounded-2xl transition-all duration-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">Outdoor activity is {isGood ? 'ideal' : 'permissible with caution'}.</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-[var(--bg-base)]/20 border border-transparent hover:border-[var(--glass-border)] rounded-2xl transition-all duration-300">
                        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">Mask usage recommended for sensitive groups.</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-[var(--bg-base)]/20 border border-transparent hover:border-[var(--glass-border)] rounded-2xl transition-all duration-300">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">Consider air filtration indoors if AQI rises.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthCard;
