"use client";

import Script from "next/script";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ARViewerPage() {
    return (
        <div className="w-full h-screen bg-black flex flex-col pt-20">
            <Script
                type="module"
                src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
            />

            {/* Header */}
            <div className="px-8 flex items-center justify-between mb-8">
                <Link href="/" className="text-white/40 hover:text-white flex items-center gap-2 transition-colors">
                    <MoveLeft size={18} />
                    <span className="text-[10px] tracking-widest uppercase mt-0.5">Back</span>
                </Link>
                <div className="text-right">
                    <h1 className="text-white text-sm tracking-[0.3em] uppercase leading-none" style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}>
                        AR Display
                    </h1>
                    <p className="text-white/20 text-[9px] tracking-[0.4em] uppercase mt-2">Porsche 911 GT3</p>
                </div>
            </div>

            {/* Viewer Container */}
            <div className="flex-1 relative mx-6 mb-20 rounded-2xl overflow-hidden bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.4)_0%,black_100%)] border border-white/5">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full h-full"
                >
                    {/* @ts-ignore - model-viewer is a custom element */}
                    <model-viewer
                        id="porsche-viewer"
                        src="/models/porsche.glb"
                        ios-src="/models/porsche.usdz"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        touch-action="pan-y"
                        autoplay
                        shadow-intensity="1"
                        auto-rotate
                        style={{ width: "100%", height: "100%", "--poster-color": "transparent" } as any}
                        onLoad={() => {
                            const viewer = document.getElementById('porsche-viewer') as any;
                            if (!viewer || !viewer.model) return;

                            // Parse color from URL (e.g., ?color=#007bc0) - default to Shark Blue
                            const params = new URLSearchParams(window.location.search);
                            const hex = params.get('color') || '#007bc0';
                            
                            // Convert HEX to RGBA (0-1 range)
                            const r = parseInt(hex.slice(1, 3), 16) / 255;
                            const g = parseInt(hex.slice(3, 5), 16) / 255;
                            const b = parseInt(hex.slice(5, 7), 16) / 255;

                            const materials = viewer.model.materials;
                            const paintMaterial = materials.find((m: any) => m.name.includes('Paint'));
                            
                            if (paintMaterial) {
                                paintMaterial.pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1]);
                            }
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-white/10 text-[10px] tracking-[1em] uppercase">Initializing 3D Space</div>
                        </div>

                        <button
                            slot="ar-button"
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-full font-bold text-[10px] tracking-[0.2em] uppercase shadow-2xl hover:bg-white/90 transition-all"
                        >
                            Place in your world
                        </button>
                    </model-viewer>
                </motion.div>
            </div>

            {/* Footer Tip */}
            <div className="px-12 pb-12 text-center">
                <p className="text-white/30 text-[9px] tracking-widest uppercase leading-loose max-w-xs mx-auto">
                    Use one finger to rotate, two fingers to zoom or pan. Tap the button to enter Augmented Reality.
                </p>
            </div>
        </div>
    );
}
