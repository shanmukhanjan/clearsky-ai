import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomePage from './pages/WelcomePage';
import { Wind, LayoutDashboard, ArrowLeftRight, Moon, Sun } from 'lucide-react';

// Lazy load components for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CompareView = lazy(() => import('./components/CompareView'));

const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
);

function App() {
    const [view, setView] = useState('welcome');
    const [city, setCity] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleStart = () => {
        setView('dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col relative z-0">
            {/* Cinematic Background Engine */}
            <div className="cinematic-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'welcome' ? (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[100]"
                    >
                        <WelcomePage onStart={handleStart} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="main-app"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col min-h-screen relative z-10"
                    >
                        {/* Floating Navigation Bar */}
                        <header className="sticky top-6 z-[100] px-6 mx-auto w-full max-w-7xl pointer-events-none">
                            <div className="glass-card px-6 py-4 flex items-center justify-between pointer-events-auto shadow-2xl">
                                <div 
                                    className="flex items-center gap-4 cursor-pointer group" 
                                    onClick={() => setView('welcome')}
                                >
                                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-500 transform group-hover:scale-105">
                                        <Wind className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                        ClearSky
                                    </span>
                                </div>

                                <div className="flex items-center gap-6">
                                    <nav className="flex items-center gap-2 p-1 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--glass-border)]">
                                        <button 
                                            onClick={() => setView('dashboard')}
                                            className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                view === 'dashboard' ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span className="hidden md:inline">Dashboard</span>
                                        </button>
                                        <button 
                                            onClick={() => setView('compare')}
                                            className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                view === 'compare' ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <ArrowLeftRight className="w-4 h-4" />
                                            <span className="hidden md:inline">Compare</span>
                                        </button>
                                    </nav>

                                    <div className="w-px h-8 bg-[var(--glass-border)] hidden md:block"></div>

                                    <button 
                                        onClick={toggleTheme}
                                        className="p-3 rounded-xl bg-[var(--bg-base)]/50 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-highlight)] transition-all duration-300 shadow-sm"
                                        aria-label="Toggle Theme"
                                    >
                                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </header>

                        <main className="relative z-10 flex-grow pt-10 pb-20">
                            <Suspense fallback={<LoadingFallback />}>
                                <AnimatePresence mode="wait">
                                    {view === 'compare' ? (
                                        <motion.div
                                            key="compare"
                                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            <CompareView defaultCity={city} onClose={() => setView('dashboard')} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="dashboard"
                                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            <Dashboard defaultCity={city} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Suspense>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
