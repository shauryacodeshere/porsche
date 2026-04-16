"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// ─── Native Orbit Controls used instead ────────────────────────────────────

// ─── Panoramic Sphere ─────────────────────────────────────────────────────────
function PanoSphere() {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        new THREE.TextureLoader().load(
            "/interior_panorama.png",
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.generateMipmaps = false;
                setTexture(tex);
            },
            undefined,
            () => {
                const c = document.createElement("canvas");
                c.width = 2; c.height = 1;
                const ctx = c.getContext("2d")!;
                ctx.fillStyle = "#050508";
                ctx.fillRect(0, 0, 2, 1);
                setTexture(new THREE.CanvasTexture(c));
            }
        );
    }, []);
    if (!texture) return null;
    return (
        <mesh>
            <sphereGeometry args={[500, 64, 32]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
        </mesh>
    );
}

// ─── Hotspot ──────────────────────────────────────────────────────────────────
interface HotspotData {
    position: [number, number, number];
    title: string;
    description: string;
    stat?: string;
}

function Hotspot({ position, title, description, stat }: HotspotData) {
    const [open, setOpen] = useState(false);

    const ping = () => {
        try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.frequency.value = 1200; osc.type = "sine";
            g.gain.setValueAtTime(0.04, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(); osc.stop(ctx.currentTime + 0.2);
        } catch (_) { }
    };

    return (
        <group position={position}>
            <Html center distanceFactor={12} zIndexRange={[10, 30]}>
                <div style={{ position: "relative", width: 48, height: 48 }}>
                    {/* Outer breathe ring */}
                    <span style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.15)",
                        animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
                    }} />
                    {/* Dot button */}
                    <button
                        onClick={() => { setOpen(o => !o); ping(); }}
                        style={{
                            position: "absolute", inset: 10, borderRadius: "50%",
                            border: `1px solid ${open ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.25)"}`,
                            background: open ? "rgba(100,0,0,0.5)" : "rgba(255,255,255,0.06)",
                            backdropFilter: "blur(10px)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s ease", outline: "none",
                        }}
                    >
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: open ? "#ef4444" : "white",
                            boxShadow: open ? "0 0 16px #ef4444" : "0 0 10px rgba(255,255,255,0.9)",
                            transition: "all 0.3s ease",
                        }} />
                    </button>

                    {/* Info card */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9, filter: "blur(8px)" }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: 10, scale: 0.9, filter: "blur(8px)" }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 18px)",
                                    left: "50%", transform: "translateX(-50%)",
                                    width: 280, padding: "20px 18px",
                                    borderRadius: 18,
                                    background: "rgba(8, 8, 12, 0.85)",
                                    backdropFilter: "blur(40px) saturate(180%)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
                                    zIndex: 100, pointerEvents: "auto",
                                }}
                            >
                                {/* Gradient sheen */}
                                <div style={{
                                    position: "absolute", inset: 0, borderRadius: 18,
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
                                    pointerEvents: "none",
                                }} />
                                {stat && (
                                    <div style={{ fontSize: 28, fontWeight: 200, color: "white", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>
                                        {stat}
                                    </div>
                                )}
                                <h3 style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", color: "white", textTransform: "uppercase", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    {title}
                                </h3>
                                <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", fontWeight: 300, letterSpacing: "0.02em" }}>
                                    {description}
                                </p>
                                {/* Caret */}
                                <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, background: "rgba(8,8,12,0.85)", borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Html>
        </group>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface InteriorViewerProps {
    onClose?: () => void;
}

export default function InteriorViewer({ onClose }: InteriorViewerProps) {
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", background: "#000", touchAction: "none" }}>
            {/* Close button */}
            {onClose && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 flex items-center gap-3 group"
                    aria-label="Exit cockpit view"
                >
                    <span className="text-[10px] tracking-[0.3em] uppercase text-white/30 group-hover:text-white/60 transition-colors duration-300">Exit</span>
                    <div className="w-9 h-9 rounded-full border border-white/20 group-hover:border-white/50 flex items-center justify-center backdrop-blur-sm bg-black/30 transition-all duration-300">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </motion.button>
            )}

            {/* Cinematic section title */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute top-6 left-0 right-0 flex justify-center z-40 pointer-events-none"
            >
                <div className="flex flex-col items-center gap-2">
                    <p className="text-[9px] tracking-[0.4em] uppercase text-white/25">Porsche 911 GT3</p>
                    <h2 className="text-lg md:text-2xl font-extralight tracking-[0.35em] uppercase text-white/80">Cockpit</h2>
                </div>
            </motion.div>

            {/* Hint bar */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-6 left-0 right-0 text-center text-[9px] tracking-[0.35em] uppercase text-white/20 z-40 pointer-events-none"
            >
                Drag to explore · Click hotspots to reveal specs
            </motion.p>

            {/* Vignette */}
            <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)" }} />

            {/* 3D Canvas */}
            <Canvas
                camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.01] }}
                gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                dpr={[1, 2]}
                style={{ position: "absolute", inset: 0 }}
            >
                <PanoSphere />
                <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.6} autoRotate autoRotateSpeed={0.5} makeDefault />
                <Hotspot
                    position={[120, -80, -480]}
                    title="Engine Start"
                    stat="4.0L"
                    description="Naturally aspirated flat-six, 510 hp at 8,400 rpm. A mechanical symphony — ignite it and feel the resonance."
                />
                <Hotspot
                    position={[-10, 20, -495]}
                    title="Sport Chrono Wheel"
                    stat="GT3"
                    description="Carbon-weave Alcantara grip with embedded shift paddles and drive-mode selectors — all at the driver's fingertips."
                />
                <Hotspot
                    position={[-250, -50, -425]}
                    title="Infotainment"
                    stat={'10.9\u2033'}
                    description="Precision haptic display integrates PCM navigation, vehicle telemetry, and track timer in a single surface."
                />
                <Hotspot
                    position={[0, 200, -450]}
                    title="Instrument Cluster"
                    stat="8,400"
                    description="Analogue central rev counter flanked by configurable digital pods — maximum clarity at maximum speed."
                />
            </Canvas>

            <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.5; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
