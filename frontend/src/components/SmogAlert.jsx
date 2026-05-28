import React from 'react';
import { ShieldAlert } from 'lucide-react';

const SmogAlert = ({ smog }) => {
    if (!smog) return null;

    const { risk, score, factors } = smog;
    
    const getRiskStyles = (level) => {
        if (level === 'Low') return 'text-green-600 bg-green-500/5 border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]';
        if (level === 'Moderate') return 'text-amber-600 bg-amber-500/5 border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]';
        return 'text-red-600 bg-red-500/5 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]';
    };

    return (
        <div className={`p-8 rounded-[2rem] border transition-all duration-500 backdrop-blur-xl relative overflow-hidden group ${getRiskStyles(risk)}`}>
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-base)]/50 border border-current/20">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Smog Level</span>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="flex flex-col">
                    <span className="text-5xl font-black tracking-tighter text-current drop-shadow-sm">{risk}</span>
                </div>

                {factors && factors.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-current/10">
                        {factors.map((factor, i) => (
                            <span 
                                key={i} 
                                className="px-3 py-1.5 rounded-lg bg-[var(--bg-base)]/40 border border-current/10 text-[10px] font-bold uppercase tracking-widest text-current backdrop-blur-md shadow-sm"
                            >
                                {factor}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmogAlert;
