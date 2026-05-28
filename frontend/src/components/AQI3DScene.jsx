import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Points, PointMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

// AQI Color mapping for 3D lighting
const getAQIColors = (aqi) => {
    if (!aqi || aqi <= 50) return { primary: '#00B050', secondary: '#00E400', ambient: '#00B050' }; // Good (Green)
    if (aqi <= 100) return { primary: '#92D050', secondary: '#ADFF2F', ambient: '#92D050' }; // Satisfactory (Light Green)
    if (aqi <= 200) return { primary: '#FFFF00', secondary: '#FFD700', ambient: '#FFFF00' }; // Moderate (Yellow)
    if (aqi <= 300) return { primary: '#FF9900', secondary: '#FF8C00', ambient: '#FF9900' }; // Poor (Orange)
    if (aqi <= 400) return { primary: '#FF0000', secondary: '#DC143C', ambient: '#FF0000' }; // Very Poor (Red)
    return { primary: '#C00000', secondary: '#8B0000', ambient: '#C00000' }; // Severe (Maroon)
};

const FloatingParticles = ({ aqi, colors }) => {
    const points = useRef();
    
    // Generate random particles
    const particleCount = useMemo(() => {
        // More particles for higher AQI
        const base = 500;
        if (!aqi) return base;
        return Math.min(base + aqi * 5, 5000);
    }, [aqi]);

    const positions = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            // Spherical distribution
            const r = 4 + Math.random() * 8;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [particleCount]);

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y -= delta * 0.05;
            points.current.rotation.x -= delta * 0.02;
        }
    });

    return (
        <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color={colors.secondary}
                size={0.05}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.6}
            />
        </Points>
    );
};

const AnimatedCore = ({ colors, isDarkMode }) => {
    const sphereRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (sphereRef.current) {
            sphereRef.current.rotation.y = time * 0.2;
            sphereRef.current.position.y = Math.sin(time * 0.5) * 0.2;
        }
    });

    return (
        <Sphere ref={sphereRef} args={[2.5, 64, 64]}>
            <MeshDistortMaterial
                color={colors.primary}
                envMapIntensity={isDarkMode ? 0.5 : 1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                metalness={0.8}
                roughness={0.2}
                distort={0.3}
                speed={2}
                emissive={colors.primary}
                emissiveIntensity={isDarkMode ? 0.4 : 0.2}
            />
        </Sphere>
    );
};

export default function AQI3DScene({ aqi = 50, isDarkMode = true }) {
    const colors = useMemo(() => getAQIColors(aqi), [aqi]);

    return (
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-60 mix-blend-screen transition-opacity duration-1000">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
                <ambientLight intensity={isDarkMode ? 0.2 : 0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} color={colors.primary} />
                <pointLight position={[-10, -10, -5]} intensity={1} color={colors.secondary} />
                
                <AnimatedCore colors={colors} isDarkMode={isDarkMode} />
                <FloatingParticles aqi={aqi} colors={colors} />
                
                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
