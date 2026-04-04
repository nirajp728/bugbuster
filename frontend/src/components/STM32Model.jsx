import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function STM32Model({ temp, isSending }) {
    const meshRef = useRef();

    // Determine the board color based on temperature
    // Cold (20°C) = Emerald, Hot (70°C) = Bright Red
    const heatIntensity = Math.min(Math.max((temp - 20) / 50, 0), 1);
    const boardColor = new THREE.Color().lerpColors(
        new THREE.Color('#10b981'), // Emerald Green
        new THREE.Color('#ef4444'), // Danger Red
        heatIntensity
    );

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Constant gentle rotation so it looks alive
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.4;
            meshRef.current.rotation.z = Math.sin(t * 1) * 0.05;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            {/* Main PCB Board */}
            <RoundedBox 
                ref={meshRef} 
                args={[4, 0.2, 1.5]} // Dimensions similar to an STM32 Bluepill
                radius={0.05} 
                smoothness={4}
            >
                <meshStandardMaterial 
                    color={boardColor} 
                    emissive={boardColor}
                    emissiveIntensity={isSending ? 1.5 : heatIntensity * 0.5} 
                    metalness={0.6}
                    roughness={0.3}
                />
            </RoundedBox>
            
            {/* The Main Microcontroller Chip on top */}
            <Box args={[0.8, 0.4, 0.8]} position={[0, 0.15, 0]}>
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </Box>

            {/* GPIO Pins Simulation (Left Side) */}
            <Box args={[3.5, 0.3, 0.1]} position={[0, 0, -0.65]}>
                <meshStandardMaterial color="#fbbf24" metalness={1} />
            </Box>

            {/* GPIO Pins Simulation (Right Side) */}
            <Box args={[3.5, 0.3, 0.1]} position={[0, 0, 0.65]}>
                <meshStandardMaterial color="#fbbf24" metalness={1} />
            </Box>

            {/* Visual Pulse when sending command */}
            {isSending && (
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[2.5, 32, 32]} />
                    <meshBasicMaterial color="#34d399" transparent opacity={0.3} wireframe />
                </mesh>
            )}
        </Float>
    );
}