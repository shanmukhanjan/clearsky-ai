import React, { useState } from 'react';
import { Wind, Search, Globe, Shield, Activity, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import SearchAutocomplete from '../components/SearchAutocomplete';

const LandingPage = ({ onCitySelect }) => {
    const [loading, setLoading] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-[#020617] overflow-hidden relative selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-50"></div>
                <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <nav className="relative z-50 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Wind className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight uppercase">ClearSky AI</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    {['Features', 'AI Model', 'Global Data', 'Compare'].map(item => (
                        <a key={item} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-cyan-400 transition-colors">{item}</a>
                    ))}
                </div>
                <button className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                    <Github className="w-4 h-4" />
                    Github
                </button>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            <Activity className="w-3 h-3" />
                            Next-Gen Environmental Intelligence
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                            Predicting the <span className="gradient-text">Atmosphere</span> <br /> 
                            with Global Precision.
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            Advanced XGBoost AI forecasting for 72h air quality metrics. <br />
                            Experience production-grade environmental insights for any location worldwide.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                        <SearchAutocomplete 
                            onSelect={onCitySelect} 
                            loading={loading} 
                            placeholder="Enter any global city to begin..."
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 pt-4">
                         <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden shadow-xl">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <p className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                            Join <span className="text-white">10,000+</span> users tracking global AQI daily
                        </p>
                    </motion.div>

                    {/* Feature Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
                        {[
                            { 
                                icon: Globe, 
                                title: 'Global Coverage', 
                                desc: 'Instant atmospheric data for any city on the planet using Nominatim geolocation.',
                                color: 'cyan'
                            },
                            { 
                                icon: Shield, 
                                title: 'Neural Forecasts', 
                                desc: 'High-accuracy 72h predictions powered by a worldwide-trained XGBoost regressor.',
                                color: 'blue'
                            },
                            { 
                                icon: Activity, 
                                title: 'Compare Mode', 
                                desc: 'Side-by-side location analysis with comprehensive health & safety recommendations.',
                                color: 'indigo'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group glass-card rounded-[2.5rem] p-10 text-left hover:scale-[1.02] transition-all duration-500 cursor-default">
                                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">{feature.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm">{feature.desc}</p>
                                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    Learn More <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default LandingPage;
