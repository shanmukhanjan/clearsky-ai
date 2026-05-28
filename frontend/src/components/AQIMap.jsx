import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAQIColor } from '../utils/aqiUtils';

delete L.Icon.Default.prototype._getIconUrl;

const MapBoundsHandler = ({ markers, onMapClick, setClicking }) => {
    const map = useMap();
    
    useMapEvents({
        click(e) {
            if (onMapClick) {
                setClicking(true);
                onMapClick(e.latlng);
            }
        }
    });

    useEffect(() => {
        if (!markers || markers.length === 0) return;
        if (markers.length === 1) {
            map.setView(markers[0].position, 11, { animate: true, duration: 1.2 });
        } else {
            const bounds = L.latLngBounds(markers.map(m => m.position));
            map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1.2 });
        }
        setTimeout(() => map.invalidateSize(), 300);
    }, [markers, map]);
    return null;
};

const AQIMap = ({ data, coordinates, compareData, onMapClick }) => {
    const [isReady, setIsReady] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [clicking, setClicking] = useState(false);

    // When data changes, the click was resolved — stop the loading state
    useEffect(() => { setClicking(false); }, [data]);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 300);
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') checkTheme();
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    const markers = [];
    if (compareData) {
        if (compareData.city1?.coordinates) {
            markers.push({
                position: [compareData.city1.coordinates.lat, compareData.city1.coordinates.lon],
                city: compareData.city1.city,
                aqi: compareData.city1.currentAQI,
                category: compareData.city1.category
            });
        }
        if (compareData.city2?.coordinates) {
            markers.push({
                position: [compareData.city2.coordinates.lat, compareData.city2.coordinates.lon],
                city: compareData.city2.city,
                aqi: compareData.city2.currentAQI,
                category: compareData.city2.category
            });
        }
    } else {
        const coords = coordinates || data?.coordinates;
        if (coords) {
            markers.push({
                position: [coords.lat, coords.lon],
                city: data?.city || 'Location',
                aqi: data?.currentAQI || 0,
                category: data?.category || 'Index'
            });
        }
    }

    const createPulseMarker = (aqi) => {
        const color = getAQIColor(aqi);
        return L.divIcon({
            className: 'custom-pulse-icon',
            html: `
                <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    <!-- Expanding Pulse Ring -->
                    <div style="
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background-color: ${color};
                        border-radius: 50%;
                        opacity: 0.6;
                        animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                    "></div>
                    <!-- Core Dot -->
                    <div style="
                        position: relative;
                        width: 16px;
                        height: 16px;
                        background-color: ${color};
                        border-radius: 50%;
                        box-shadow: 0 0 15px ${color}, 0 0 30px ${color};
                        border: 2px solid white;
                        z-index: 2;
                    "></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    };

    if (!isReady) return <div className="w-full h-full skeleton rounded-[2rem]" />;

    // Use dark satellite-style basemap for dark mode for that cinematic feel
    const tileUrl = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    return (
        <div className="w-full h-full relative z-0">
            {/* Click loading overlay */}
            {clicking && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-[2px] rounded-[2rem]">
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Fetching AQI…</span>
                    </div>
                </div>
            )}
            <MapContainer 
                center={markers[0]?.position || [20, 0]} 
                zoom={markers.length > 0 ? 11 : 3} 
                className="w-full h-full outline-none z-10"
                zoomControl={false}
                attributionControl={false}
                style={{ cursor: onMapClick ? 'crosshair' : 'grab' }}
            >
                <TileLayer
                    key={isDark ? 'dark' : 'light'}
                    url={tileUrl}
                    subdomains="abcd"
                    maxZoom={20}
                />
                <MapBoundsHandler markers={markers} onMapClick={onMapClick} setClicking={setClicking} />
                
                {markers.map((marker, idx) => (
                    <Marker key={idx} position={marker.position} icon={createPulseMarker(marker.aqi)}>
                        <Popup className="premium-popup" offset={[0, -10]}>
                            <div className="p-5 min-w-[180px] text-center space-y-3">
                                <h4 className="font-extrabold text-[var(--text-primary)] text-lg leading-tight capitalize">{marker.city}</h4>
                                <div className="flex flex-col items-center gap-1 border-t border-[var(--glass-border)] pt-3">
                                    <span className="text-4xl font-black text-[var(--text-primary)] leading-none">{marker.aqi}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: getAQIColor(marker.aqi) }}>
                                        {marker.category}
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default AQIMap;
