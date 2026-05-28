import React from 'react';
import { motion } from 'framer-motion';
import { Wind, ArrowRight } from 'lucide-react';

const WelcomePage = ({ onStart }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col bg-[var(--bg-base)]">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
                    backgroundSize: '36px 36px'
                }} />
                <div className="absolute top-[-15%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-blue-500/8 blur-[140px]" />
                <div className="absolute bottom-[-25%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/7 blur-[160px]" />
            </div>

            {/* Minimal Nav */}
            <nav className="relative z-10 w-full flex items-center justify-between px-8 py-5 border-b border-white/5 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Wind className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tight text-[var(--text-primary)]">ClearSky</span>
                </div>
            </nav>

            {/* Hero — fully centered */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

                {/* Live badge */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/6 backdrop-blur-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 tracking-wide">Live worldwide air quality</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[clamp(3.5rem,10vw,7rem)] font-black text-[var(--text-primary)] tracking-tighter leading-[1.0] mb-0"
                >
                    Know your air.{' '}
                    <span className="block" style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 55%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Anywhere.
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.25 }}
                    className="mt-8 text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed"
                >
                    Real-time AQI data and 72-hour forecasts<br className="hidden sm:block" /> for every location on earth.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.38 }}
                    className="mt-12 flex flex-col sm:flex-row items-center gap-4"
                >
                    {/* Primary */}
                    <button
                        onClick={onStart}
                        className="group relative overflow-hidden flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            boxShadow: '0 8px 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'}
                    >
                        Check My AQI
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>

                    {/* Secondary */}
                    <button
                        onClick={onStart}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(148,163,184,0.2)',
                            background: 'rgba(255,255,255,0.04)',
                            backdropFilter: 'blur(12px)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'}
                    >
                        Explore the Map
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default WelcomePage;
