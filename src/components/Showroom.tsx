"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const InteriorViewer = dynamic(() => import("./InteriorViewer"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-white/20 uppercase tracking-widest text-xs">Initializing Cabin View...</div>
});



// ─── Data — exact images from github.com/vanshitavarma/porshe ─────────────────
const MODELS = [
    {
        id: 0,
        name: "Porsche 911",
        tagline: "Timeless Machine.",
        // car-placeholder.png is the 911 image from the repo
        frameImg: "/car-placeholder.png",
        interiorImg: "/int-red.png",
        stats: { hp: 379, acc: "4.2", top: 293 },
        color: "#8a1010",
    },
    {
        id: 1,
        name: "Taycan",
        tagline: "Soul, Electrified.",
        // car-taycan.png from the repo
        frameImg: "/car-taycan.png",
        interiorImg: "/int-black.png",
        stats: { hp: 408, acc: "4.8", top: 230 },
        color: "#1040a0",
    },
    {
        id: 2,
        name: "Cayenne",
        tagline: "Together.",
        // car-cayenne.png from the repo
        frameImg: "/car-cayenne.png",
        interiorImg: "/int-beige.png",
        stats: { hp: 353, acc: "6.0", top: 248 },
        color: "#1a6e30",
    },
];

type Pos = "center" | "left" | "right" | "hidden";

const getAnimate = (pos: Pos) => {
    const spring = { type: "spring" as const, stiffness: 50, damping: 22 };
    switch (pos) {
        case "center": return { animate: { x: "0%", scale: 1, opacity: 1, filter: "brightness(1) blur(0px)", rotateY: 0, zIndex: 10 }, transition: spring };
        case "left": return { animate: { x: "-52%", scale: 0.82, opacity: 0.45, filter: "brightness(0.25) blur(5px)", rotateY: -18, zIndex: 5 }, transition: spring };
        case "right": return { animate: { x: "52%", scale: 0.82, opacity: 0.45, filter: "brightness(0.25) blur(5px)", rotateY: 18, zIndex: 5 }, transition: spring };
        default: return { animate: { x: "0%", scale: 0.3, opacity: 0, filter: "brightness(0) blur(20px)", zIndex: 1 }, transition: { duration: 0.4 } };
    }
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Showroom({ onClose }: { onClose?: () => void }) {
    const [index, setIndex] = useState(0);
    const [interiorMode, setInteriorMode] = useState(false);
    const lastWheel = useRef(0);

    const paginate = useCallback((dir: number) => {
        setIndex((prev) => {
            let next = prev + dir;
            if (next < 0) next = MODELS.length - 1;
            if (next > MODELS.length - 1) next = 0;
            return next;
        });
    }, []);

    // Keyboard nav
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") paginate(1);
            if (e.key === "ArrowLeft") paginate(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [paginate]);

    const bind = useGesture({
        onDrag: ({ movement: [mx], active, tap }) => {
            if (tap || interiorMode) return;
            if (!active) {
                if (mx > 60) paginate(-1);
                else if (mx < -60) paginate(1);
            }
        },
        onWheel: ({ movement: [, my], last }) => {
            if (interiorMode || !last) return;
            const now = Date.now();
            if (now - lastWheel.current < 900) return;
            if (my > 40) { paginate(1); lastWheel.current = now; }
            else if (my < -40) { paginate(-1); lastWheel.current = now; }
        },
    }, { drag: { filterTaps: true, threshold: 10 } });

    const getPos = (i: number) => {
        if (i === index) return "center";
        if (i === (index - 1 + MODELS.length) % MODELS.length) return "left";
        if (i === (index + 1) % MODELS.length) return "right";
        return "hidden";
    };

    const model = MODELS[index];

    return (
        <section
            className="relative w-full overflow-hidden bg-black"
            style={{ height: "100svh" }}
        >
            {/* ── Environment ── */}
            {/* Ambient glow per model */}
            <div
                className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
                style={{ background: `radial-gradient(circle at 50% 60%, ${model.color}28 0%, transparent 65%)` }}
            />
            {/* Perspective studio floor */}
            <div
                className="absolute pointer-events-none z-[1]"
                style={{
                    bottom: "-20%", left: "-50%", width: "200vw", height: "55vh",
                    background: "radial-gradient(ellipse at top center, rgba(25,25,25,0.85) 0%, rgba(0,0,0,1) 70%)",
                    transform: "rotateX(85deg)",
                }}
            />
            {/* Floor grid */}
            <div
                className="absolute pointer-events-none z-[1]"
                style={{
                    bottom: "-20%", left: "-50%", width: "200vw", height: "55vh",
                    transform: "rotateX(85deg)",
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to top, rgba(255,255,255,0.015) 1px, transparent 1px)",
                    backgroundSize: "80px 80px",
                }}
            />
            {/* Central spotlight */}
            <div
                className="absolute pointer-events-none z-[2]"
                style={{
                    top: "-30%", left: "50%", transform: "translateX(-50%)",
                    width: "50vw", height: "100vh",
                    background: "radial-gradient(ellipse at top center, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)",
                    mixBlendMode: "screen",
                }}
            />

            {/* ── Carousel (gesture zone) ── */}
            <div
                className="absolute inset-0 flex items-center justify-center z-[5]"
                style={{
                    perspective: 1500,
                    transformStyle: "preserve-3d",
                    touchAction: "none",   // Required for @use-gesture/react v10 touch capture
                    userSelect: "none",
                    cursor: "grab",
                }}
                {...(bind() as object)}
            >
                <AnimatePresence initial={false}>
                    {MODELS.map((m, i) => {
                        const pos = getPos(i);
                        const isCenter = pos === "center";
                        const isSide = pos === "left" || pos === "right";
                        return (
                            <motion.div
                                key={m.id}
                                initial={{ x: "0%", scale: 0.3, opacity: 0 }}
                                {...getAnimate(pos as Pos)}
                                onClick={() => {
                                    if (pos === "left") paginate(-1);
                                    if (pos === "right") paginate(1);
                                }}
                                className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center"
                                style={{ width: "55%", minWidth: 580, height: "60vh" }}
                            >
                                <motion.div
                                    style={{ width: "100%", height: "100%", position: "relative" }}
                                    animate={isCenter ? { y: ["-1%", "1.5%", "-1%"] } : { y: "0%" }}
                                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={m.frameImg}
                                        alt={m.name}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            mixBlendMode: "screen",
                                            pointerEvents: "none",
                                            filter: isCenter ? "drop-shadow(0px 30px 40px rgba(0,0,0,0.9))" : "none",
                                        }}
                                    />
                                    {isCenter && (
                                        <motion.div
                                            className="absolute bottom-[5%] left-[10%] right-[10%] rounded-[100%]"
                                            style={{ height: 16, background: `radial-gradient(ellipse, ${m.color}80, transparent 70%)`, filter: "blur(14px)" }}
                                            animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
                                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                        />
                                    )}
                                    {/* Hover hint for side models */}
                                    {isSide && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                            <div className="w-10 h-10 rounded-full border border-white/30 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                                {pos === "left" ? <ChevronLeft size={16} className="text-white" /> : <ChevronRight size={16} className="text-white" />}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* ── UI Overlay ── */}
            <div className="absolute inset-0 z-[20] pointer-events-none flex flex-col justify-between px-6 py-10">
                {/* Top label */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] tracking-[0.4em] uppercase text-white/25 mb-1">Lineup</p>
                        <h2 className="text-lg font-extralight tracking-[0.3em] uppercase text-white/70" style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}>
                            Select Your Model
                        </h2>
                    </div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 hidden md:block">
                        Drag · Arrow Keys · Click Arrows
                    </p>
                </div>

                {/* Left / Right arrow buttons — always visible, pointer-events-auto */}
                <div className="absolute inset-y-0 left-4 flex items-center z-[30] pointer-events-auto">
                    <button
                        onClick={() => paginate(-1)}
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                    >
                        <ChevronLeft size={18} className="text-white/70" />
                    </button>
                </div>
                <div className="absolute inset-y-0 right-4 flex items-center z-[30] pointer-events-auto">
                    <button
                        onClick={() => paginate(1)}
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                    >
                        <ChevronRight size={18} className="text-white/70" />
                    </button>
                </div>

                {/* Bottom row: stats + CTA */}
                <div className="flex items-end justify-between">
                    {/* Stats */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
                            className="flex gap-8 pointer-events-auto"
                            style={{
                                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)",
                                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12,
                                padding: "18px 28px",
                            }}
                        >
                            {[
                                { v: `${model.stats.hp}`, l: "HP" },
                                { v: `${model.stats.acc}s`, l: "0–100" },
                                { v: `${model.stats.top}`, l: "km/h max" },
                            ].map(({ v, l }) => (
                                <div key={l}>
                                    <p className="text-2xl font-light text-white" style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}>{v}</p>
                                    <p className="text-[9px] tracking-widest uppercase text-white/35 mt-1">{l}</p>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Model name + CTA */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`title-${index}`}
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
                            className="text-right flex flex-col items-end gap-4 pointer-events-auto"
                        >
                            <div>
                                <p className="text-3xl md:text-4xl font-extralight tracking-[0.15em] text-white uppercase" style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}>
                                    {model.name}
                                </p>
                                <p className="text-[11px] tracking-[0.3em] text-white/40 uppercase mt-2">{model.tagline}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setInteriorMode(true)}
                                    className="px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium border border-white/20 rounded backdrop-blur-sm bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-white/70"
                                >
                                    Interior View
                                </button>
                                <Link
                                    href={`/configure?model=${index}`}
                                    onClick={onClose}
                                    className="px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium rounded bg-white text-black hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Configure →
                                </Link>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav dots */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-2 z-[25]">
                {MODELS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => paginate(i > index ? 1 : -1)}
                        className="transition-all duration-300 rounded-full"
                        style={{
                            width: i === index ? 24 : 6, height: 6,
                            background: i === index ? "white" : "rgba(255,255,255,0.2)",
                        }}
                    />
                ))}
            </div>

            {/* ── Interior Overlay — 360 Interactive ── */}
            <AnimatePresence>
                {interiorMode && (
                    <motion.div
                        key="interior"
                        className="fixed inset-0 z-[200] bg-black"
                        initial={{ opacity: 0, scale: 1.15 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.15 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <InteriorViewer onClose={() => setInteriorMode(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
