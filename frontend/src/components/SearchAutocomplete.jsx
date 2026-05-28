import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, MapPin, Loader2, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationSearch } from '../hooks/useLocationSearch';

/**
 * Renders the suggestions list into document.body so it is never
 * clipped by any parent overflow:hidden or stacking context.
 */
const SuggestionPortal = ({ anchorEl, children }) => {
    const [rect, setRect] = useState(null);

    useLayoutEffect(() => {
        if (!anchorEl) return;
        const update = () => {
            const r = anchorEl.getBoundingClientRect();
            setRect({ top: r.bottom + 4, left: r.left, width: r.width });
        };
        update();
        window.addEventListener('resize', update, { passive: true });
        window.addEventListener('scroll', update, { passive: true, capture: true });
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [anchorEl]);

    if (!rect) return null;

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                zIndex: 2147483647, // Max z-index
                pointerEvents: 'auto',
            }}
        >
            {children}
        </div>,
        document.body
    );
};

const SearchAutocomplete = ({
    onSelect,
    loading: parentLoading,
    defaultValue = '',
    placeholder = 'Search any city worldwide...',
    hideButton = false,
    onChangeText,
}) => {
    const [query, setQuery] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputWrapperRef = useRef(null);
    const inputRef = useRef(null);

    const { results, loading, search, clear } = useLocationSearch();

    // Sync external defaultValue changes
    useEffect(() => {
        setQuery(defaultValue);
    }, [defaultValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (
                inputWrapperRef.current &&
                !inputWrapperRef.current.contains(e.target) &&
                // Also check the portal (rendered in body)
                !e.target.closest('[data-clearsky-dropdown]')
            ) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Open dropdown when results arrive
    useEffect(() => {
        if (results.length > 0) setIsOpen(true);
        else setIsOpen(false);
    }, [results]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (onChangeText) onChangeText(val);
        setActiveIndex(-1);
        search(val);
    };

    const handleSelect = (item) => {
        setQuery(item.city);
        if (onChangeText) onChangeText(item.city);
        setIsOpen(false);
        setActiveIndex(-1);
        clear();
        onSelect(item.city);
    };

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        setActiveIndex(-1);
        clear();
        if (onChangeText) onChangeText('');
        inputRef.current?.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
            handleSelect(results[activeIndex]);
        } else if (query.trim()) {
            setIsOpen(false);
            clear();
            onSelect(query.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(p => Math.min(p + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(p => Math.max(p - 1, -1));
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && results[activeIndex]) {
                handleSelect(results[activeIndex]);
            } else if (query.trim()) {
                setIsOpen(false);
                clear();
                onSelect(query.trim());
            }
        }
    };

    const showDropdown = isOpen && results.length > 0;

    return (
        <div ref={inputWrapperRef} className="relative w-full">
            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
                {/* Input row */}
                <div className={`
                    flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border transition-all duration-200
                    bg-[var(--glass-bg,white)] dark:bg-slate-900/90 backdrop-blur-xl
                    ${showDropdown
                        ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                        : 'border-[var(--glass-border,#e2e8f0)] dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                    }
                `}>
                    {loading
                        ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                        : <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    }
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                        placeholder={placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold text-sm min-w-0 py-0"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            tabIndex={-1}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    {!hideButton && (
                        <button
                            type="submit"
                            disabled={parentLoading || !query.trim()}
                            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white w-8 h-8 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
                        >
                            {parentLoading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <ArrowRight className="w-3.5 h-3.5" />
                            }
                        </button>
                    )}
                </div>
            </form>

            {/* Portal-based dropdown */}
            <SuggestionPortal anchorEl={inputWrapperRef.current}>
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            data-clearsky-dropdown="true"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-2xl overflow-hidden border border-blue-500/30 dark:border-blue-500/20"
                            style={{
                                background: 'var(--glass-bg, white)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
                            }}
                        >
                            {/* Header */}
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Locations
                                </span>
                            </div>
                            {/* Results */}
                            <div className="max-h-[280px] overflow-y-auto overscroll-contain">
                                {results.map((item, idx) => (
                                    <button
                                        key={`${item.city}-${idx}`}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3
                                            text-left transition-all duration-100 cursor-pointer
                                            border-b border-slate-100 dark:border-slate-800/60 last:border-0
                                            ${activeIndex === idx
                                                ? 'bg-blue-50 dark:bg-blue-950/40'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                                            ${activeIndex === idx
                                                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                            }
                                        `}>
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${activeIndex === idx ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {item.city}
                                            </div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                {[item.state, item.country].filter(Boolean).join(', ')}
                                            </div>
                                        </div>
                                        {activeIndex === idx && (
                                            <div className="flex-shrink-0 text-[10px] font-bold text-blue-500 dark:text-blue-400 opacity-70">
                                                ↵
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SuggestionPortal>
        </div>
    );
};

export default SearchAutocomplete;
