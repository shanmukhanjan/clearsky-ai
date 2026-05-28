import React from 'react';
import { Heart, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const HealthCard = ({ health, category }) => {
    if (!health) return null;

    const isGood = category === 'Good';
    const isSatisfactory = category === 'Satisfactory';
    const isModerate = category === 'Moderate';
    const isPoor = category === 'Poor';
    const isVeryPoor = category === 'Very Poor';
    const isSevere = category === 'Severe';
    
    let accentColor = 'bg-blue-500';
    let shadowColor = 'shadow-[0_0_30px_rgba(59,130,246,0.1)]';

    if (isGood) { accentColor = 'bg-[#00B050]'; shadowColor = 'shadow-[0_0_30px_rgba(0,176,80,0.1)]'; }
    else if (isSatisfactory) { accentColor = 'bg-[#92D050]'; shadowColor = 'shadow-[0_0_30px_rgba(146,208,80,0.1)]'; }
    else if (isModerate) { accentColor = 'bg-[#FFFF00]'; shadowColor = 'shadow-[0_0_30px_rgba(255,255,0,0.1)]'; }
    else if (isPoor) { accentColor = 'bg-[#FF9900]'; shadowColor = 'shadow-[0_0_30px_rgba(255,153,0,0.1)]'; }
    else if (isVeryPoor) { accentColor = 'bg-[#FF0000]'; shadowColor = 'shadow-[0_0_30px_rgba(255,0,0,0.1)]'; }
    else if (isSevere) { accentColor = 'bg-[#C00000]'; shadowColor = 'shadow-[0_0_30px_rgba(192,0,0,0.1)]'; }

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
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">
                            {health.action || (isGood ? 'Outdoor activity is ideal.' : 'Outdoor activity is permissible with caution.')}
                        </span>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-[var(--bg-base)]/20 border border-transparent hover:border-[var(--glass-border)] rounded-2xl transition-all duration-300">
                        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">Mask usage recommended for sensitive groups in moderate to severe conditions.</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-[var(--bg-base)]/20 border border-transparent hover:border-[var(--glass-border)] rounded-2xl transition-all duration-300">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-semibold text-[var(--text-secondary)] leading-snug">Consider air filtration indoors if AQI rises above Satisfactory.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthCard;
