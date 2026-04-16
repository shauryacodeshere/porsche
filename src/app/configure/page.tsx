"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Exact data from github.com/vanshitavarma/porshe ──────────────────────────
const COLORS = [
    { id: "red", name: "Guards Red", price: 300_000, hex: "#d31e28", filter: "hue-rotate(0deg) saturate(1)" },
    { id: "black", name: "Jet Black Metallic", price: 350_000, hex: "#0f0f0f", filter: "brightness(0.1) grayscale(1)" },
    { id: "yellow", name: "Racing Yellow", price: 300_000, hex: "#f2c511", filter: "hue-rotate(45deg) saturate(1.5)" },
    { id: "silver", name: "GT Silver Metallic", price: 350_000, hex: "#b3b6b7", filter: "grayscale(0.8) brightness(1.2)" },
    { id: "white", name: "Chalk White", price: 200_000, hex: "#e8e8e6", filter: "brightness(1.5) grayscale(1)" },
];

const WHEELS = [
    { id: "carrera-19", name: "19\" Carrera Wheels", price: 0, img: "/wheel-carrera.png" },
    { id: "sport-20", name: "20\" Sport Design Wheels", price: 500_000, img: "/wheel-sport.png" },
    { id: "turbo-21", name: "21\" Turbo Wheels", price: 800_000, img: "/wheel-turbo.png" },
];

const INTERIORS = [
    { id: "int-black", name: "Black Leather", price: 0, img: "/int-black.png" },
    { id: "int-red", name: "Bordeaux Red Leather", price: 200_000, img: "/int-red.png" },
    { id: "int-beige", name: "Mojave Beige Leather", price: 200_000, img: "/int-beige.png" },
    { id: "int-carbon", name: "Carbon Fiber Trim", price: 350_000, img: "/int-carbon.png" },
];

const PACKAGES = [
    { id: "pkg-chrono", name: "Sport Chrono Package", price: 400_000, badge: "+ Performance", desc: "Lap timer, Sport Response Button, track precision app" },
    { id: "pkg-brakes", name: "Ceramic Composite Brakes", price: 900_000, badge: "+ Handling", desc: "PCCB: -50% brake fade, carbon-ceramic compound" },
    { id: "pkg-turbo", name: "Turbo Power Upgrade", price: 1_500_000, badge: "+ Power", desc: "Boosted to 650PS — unlocks full performance stats" },
    { id: "pkg-sound", name: "Burmester High-End Audio", price: 300_000, badge: "+ Luxury", desc: "High-fidelity 14-speaker surround sound system" },
];

const STATS_MAX = { hp: 650, acc: 2.7, top: 330 };

const AI_TIPS: Record<string, string> = {
    red: "Guards Red pairs beautifully with Black Leather interior.",
    black: "Want a stealth look? Carbon Trim perfectly fits Jet Black.",
    yellow: "Racing Yellow shines with Beige Leather — bold contrast.",
    silver: "GT Silver with Bordeaux Red interior — timeless prestige.",
    white: "Chalk White looks stunning with Carbon Fiber Trim.",
};

const CAR_MODELS = [
    {
        name: "Porsche 911",
        subName: "Carrera 992 · 2026",
        basePrice: 18_300_000,
        img: "/car-placeholder.png",
        statsBase: { hp: 379, acc: 4.2, top: 293 },
        wheels: [
            { top: "72%", left: "24.5%", width: "16%" }, // Front
            { top: "71.5%", left: "76.5%", width: "17%" }  // Rear
        ]
    },
    {
        name: "Taycan",
        subName: "4S Cross Turismo",
        basePrice: 16_100_000,
        img: "/car-taycan.png",
        statsBase: { hp: 408, acc: 4.8, top: 230 },
        wheels: [
            { top: "72%", left: "24%", width: "16%" },
            { top: "71%", left: "75%", width: "17%" }
        ]
    },
    {
        name: "Cayenne",
        subName: "Turbo E-Hybrid",
        basePrice: 13_500_000,
        img: "/car-cayenne.png",
        statsBase: { hp: 353, acc: 6.0, top: 248 },
        wheels: [
            { top: "69%", left: "24.5%", width: "17%" },
            { top: "68%", left: "76.5%", width: "17%" }
        ]
    }
];

function formatINR(n: number) {
    return new Intl.NumberFormat("en-IN").format(n);
}

// ─── Accordion ─────────────────────────────────────────────────────────────────
function Section({
    label, icon, children, defaultOpen = false,
}: { label: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-base opacity-60">{icon}</span>
                    <span className="text-[10px] tracking-[0.25em] uppercase font-medium text-white/70 group-hover:text-white transition-colors">
                        {label}
                    </span>
                </div>
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="text-white/30 text-xl leading-none"
                >+</motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="px-6 pb-5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Content ──────────────────────────────────────────────────────────────
function ConfigureContent() {
    const searchParams = useSearchParams();
    const modelIndex = parseInt(searchParams.get("model") || "0", 10);
    const carModel = CAR_MODELS[isNaN(modelIndex) ? 0 : modelIndex] || CAR_MODELS[0];

    const [color, setColor] = useState(COLORS[0]);
    const [wheel, setWheel] = useState(WHEELS[0]);
    const [interior, setInterior] = useState(INTERIORS[0]);
    const [packages, setPackages] = useState<Set<string>>(new Set());
    const [view, setView] = useState<"exterior" | "interior">("exterior");
    const [showSummary, setShowSummary] = useState(false);

    // Dynamic rotation of wheel on change
    const [wheelRotate, setWheelRotate] = useState(0);
    useEffect(() => {
        setWheelRotate(prev => prev + 90);
    }, [wheel.id]);

    const togglePkg = useCallback((id: string) => {
        setPackages((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const hasTurbo = packages.has("pkg-turbo");
    const hp = hasTurbo ? STATS_MAX.hp : carModel.statsBase.hp;
    const acc = hasTurbo ? STATS_MAX.acc : carModel.statsBase.acc;
    const top = hasTurbo ? STATS_MAX.top : carModel.statsBase.top;

    const pkgTotal = [...packages].reduce((s, id) => {
        const p = PACKAGES.find((x) => x.id === id);
        return s + (p?.price ?? 0);
    }, 0);

    const total = carModel.basePrice + color.price + wheel.price + interior.price + pkgTotal;
    const aiTip = AI_TIPS[color.id];

    return (
        <div className="min-h-screen bg-black text-white" style={{ paddingTop: 72 }}>

            {/* Ambient glow */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: `radial-gradient(circle at 38% 55%, ${color.hex}20 0%, transparent 60%)`,
            transition: "background 0.9s ease",
                }}
            />

            <div
                className="relative z-10"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 400px",
                    minHeight: "calc(100vh - 72px)",
                }}
            >

                {/* ── LEFT: Car Viewer ── */}
                <div className="flex flex-col p-8 md:p-10 gap-6 overflow-y-auto">

                    {/* Model header */}
                    <div>
                        <motion.p
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] tracking-[0.45em] uppercase text-white/25 mb-1"
                        >
                            Build Your
                        </motion.p>
                        <motion.h1
                            key={carModel.name}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl font-extralight tracking-[0.25em] uppercase"
                            style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                        >
                            {carModel.name}
                        </motion.h1>
                        <p className="text-[10px] tracking-widest text-white/30 uppercase mt-1">{carModel.subName}</p>
                    </div>

                    {/* Exterior / Interior toggle */}
                    <div className="flex gap-2">
                        {(["exterior", "interior"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className="px-5 py-2 rounded text-[10px] tracking-[0.2em] uppercase transition-all duration-300"
                                style={{
                                    background: view === v ? "white" : "rgba(255,255,255,0.05)",
                                    color: view === v ? "black" : "rgba(255,255,255,0.5)",
                                    border: view === v ? "1px solid white" : "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Car stage */}
                    <div className="flex-1 flex items-center justify-center min-h-[280px] relative">
                        <AnimatePresence mode="wait">
                            {view === "exterior" ? (
                                <motion.div
                                    key="exterior"
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.45 }}
                                    className="relative w-full max-w-[700px]"
                                >
                                    {/* Glow halo */}
                                    <div
                                        className="absolute inset-0 rounded-2xl pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, ${color.hex}25 0%, transparent 70%)`,
                                    transition: "background 0.8s ease",
                                        }}
                                    />
                                    {/* Car image */}
                                    <div className="relative">
                                        <img
                                            src={carModel.img}
                                            alt={carModel.name}
                                            style={{
                                                width: "100%",
                                                objectFit: "contain",
                                                filter: color.filter,
                                                transition: "filter 0.7s ease",
                                                mixBlendMode: "screen",
                                                position: "relative",
                                                zIndex: 2,
                                            }}
                                        />

                                        {/* Dynamic Wheel Overlay */}
                                        {carModel.wheels && carModel.wheels.map((pos, idx) => (
                                            <div
                                                key={`wheel-${idx}`}
                                        className="absolute z-[3]"
                                        style={{
                                            top: pos.top,
                                            left: pos.left,
                                            width: pos.width,
                                            transform: "translate(-50%, -50%)",
                                            mixBlendMode: "screen",
                                        }}
                                            >
                                        <figure style={{ width: "100%", paddingTop: "100%", position: "relative", margin: 0 }}>
                                            <img
                                                src={wheel.img}
                                                alt={wheel.name}
                                                style={{
                                                    position: "absolute",
                                                    top: 0, left: 0,
                                                    width: "100%", height: "100%",
                                                    objectFit: "cover",
                                                    borderRadius: "50%",
                                                    transform: `rotate(${wheelRotate}deg)`,
                                            transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
                                                        }}
                                                    />
                                        </figure>
                                    </div>
                                        ))}
                                </div>

                                    {/* Floor reflection glow */}
                            <div
                                className="absolute bottom-0 left-[15%] right-[15%] h-4 rounded-[100%]"
                                style={{
                                    background: `radial-gradient(ellipse, ${color.hex}60, transparent 70%)`,
                            filter: "blur(10px)",
                            transition: "background 0.8s ease",
                                        }}
                                    />
                            {/* Color name badge */}
                            <div className="absolute bottom-[-28px] left-0 right-0 flex justify-center">
                                <span className="text-[9px] tracking-[0.35em] uppercase text-white/30">{color.name}</span>
                            </div>
                        </motion.div>
                        ) : (
                        <motion.div
                            key="interior"
                            initial={{ opacity: 0, x: -30, scale: 1.05 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-[700px] rounded-xl overflow-hidden relative"
                            style={{ aspectRatio: "16/9" }}
                        >
                            <img
                                src={interior.img}
                                alt={interior.name}
                                className="w-full h-full object-cover"
                                style={{ transition: "opacity 0.4s ease" }}
                            />
                            <div className="absolute bottom-4 left-4">
                                <span
                                    className="text-[9px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-full"
                                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.6)" }}
                                >
                                    {interior.name}
                                </span>
                            </div>
                        </motion.div>
                            )}
                    </AnimatePresence>
                </div>

                {/* Live performance stats */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-5 flex gap-8"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {[
                        { id: "stat-hp", label: "Horsepower", value: hp, unit: "PS", max: STATS_MAX.hp, pct: (hp / STATS_MAX.hp) * 100 },
                        { id: "stat-acc", label: "0–100 km/h", value: acc, unit: "s", max: 10, pct: 100 - (acc / 10) * 100 },
                        { id: "stat-top", label: "Top Speed", value: top, unit: "km/h", max: STATS_MAX.top, pct: (top / STATS_MAX.top) * 100 },
                    ].map(({ id, label, value, unit, pct }) => (
                        <div key={id} className="flex-1">
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span
                                    className="text-2xl font-light"
                                    style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                                >
                                    {value}
                                </span>
                                <span className="text-[10px] text-white/40">{unit}</span>
                            </div>
                            <p className="text-[9px] tracking-widest uppercase text-white/30 mb-2">{label}</p>
                            <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: hasTurbo ? "#d31e28" : "rgba(255,255,255,0.5)" }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* AI Stylist Tip */}
                <AnimatePresence>
                    {aiTip && (
                        <motion.div
                            key={color.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-start gap-3 rounded-xl px-4 py-3"
                            style={{ background: "rgba(211,30,40,0.08)", border: "1px solid rgba(211,30,40,0.2)" }}
                        >
                            <span className="text-lg mt-0.5">✦</span>
                            <p className="text-[11px] text-white/60 leading-relaxed">
                                <span className="text-red-400 font-medium">AI Stylist: </span>
                                {aiTip}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── RIGHT: Config Panel ─────────────────────────────────────────── */}
            <motion.aside
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
                style={{
                    background: "rgba(6,6,8,0.95)",
                    backdropFilter: "blur(30px)",
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    height: "calc(100vh - 72px)",
                    position: "sticky",
                    top: 72,
                    overflowY: "hidden",
                }}
            >
                {/* Price header */}
                <div
                    className="px-6 pt-7 pb-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <p className="text-[9px] tracking-[0.4em] uppercase text-white/25 mb-2">Total Build Price</p>
                    <div className="flex items-end gap-1">
                        <span className="text-white/40 text-base mb-1">₹</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={total}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="text-4xl font-light tracking-tight"
                                style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                            >
                                {formatINR(total)}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <p className="text-[10px] text-white/25 mt-1.5">
                        Base ₹{formatINR(carModel.basePrice)} + ₹{formatINR(total - carModel.basePrice)} options
                    </p>
                </div>

                {/* Scrollable config */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                    {/* ── EXTERIOR COLOR ── */}
                    <Section label="Exterior Color" icon="🎨" defaultOpen>
                        <div className="flex flex-wrap gap-3 mb-3 mt-1">
                            {COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setColor(c)}
                                    title={c.name}
                                    style={{
                                        width: 38, height: 38,
                                        borderRadius: "50%",
                                        background: c.hex,
                                        border: color.id === c.id ? "2px solid white" : "2px solid rgba(255,255,255,0.1)",
                                        boxShadow: color.id === c.id
                                            ?`0 0 0 3px rgba(255,255,255,0.15), 0 0 16px ${c.hex}80`
                            : "none",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                            flexShrink: 0,
                                        }}
                                    />
                                ))}
                        </div>
                        {/* Selected color info */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color.hex, flexShrink: 0 }} />
                                <span className="text-[11px] text-white/70">{color.name}</span>
                            </div>
                            <span className="text-[11px] text-white/40">
                                {color.price === 0 ? "Included" : `+₹${formatINR(color.price)}`}
                            </span>
                        </div>
                    </Section>

                    {/* ── WHEELS ── */}
                    <Section label="Wheels" icon="⚙️">
                        <div className="flex flex-col gap-2 mt-1">
                            {WHEELS.map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => setWheel(w)}
                                    className="flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 group"
                                    style={{
                                        border: wheel.id === w.id ? "1px solid rgba(211,30,40,0.65)" : "1px solid rgba(255,255,255,0.06)",
                                        background: wheel.id === w.id ? "rgba(211,30,40,0.07)" : "rgba(255,255,255,0.02)",
                                    }}
                                >
                                    <img
                                        src={w.img}
                                        alt={w.name}
                                        style={{
                                            width: 48, height: 48,
                                            objectFit: "contain",
                                            borderRadius: 6,
                                            background: "#0a0a0a",
                                            flexShrink: 0,
                                            transition: "transform 0.4s ease",
                                            transform: wheel.id === w.id ? "rotate(15deg)" : "none",
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium truncate">{w.name}</p>
                                    </div>
                                    <span className="text-[11px] text-white/40 flex-shrink-0">
                                        {w.price === 0 ? "Incl." : `+₹${formatINR(w.price)}`}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* ── INTERIOR ── */}
                    <Section label="Interior" icon="🪑">
                        <div className="flex flex-col gap-2 mt-1">
                            {INTERIORS.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setInterior(item); setView("interior"); }}
                                    className="flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300"
                                    style={{
                                        border: interior.id === item.id ? "1px solid rgba(211,30,40,0.65)" : "1px solid rgba(255,255,255,0.06)",
                                        background: interior.id === item.id ? "rgba(211,30,40,0.07)" : "rgba(255,255,255,0.02)",
                                    }}
                                >
                                    <img
                                        src={item.img}
                                        alt={item.name}
                                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                                    />
                                    <p className="flex-1 text-[11px] font-medium text-left">{item.name}</p>
                                    <span className="text-[11px] text-white/40 flex-shrink-0">
                                        {item.price === 0 ? "Incl." : `+₹${formatINR(item.price)}`}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* ── PACKAGES ── */}
                    <Section label="Performance Packages" icon="🏁">
                        <div className="flex flex-col gap-2 mt-1">
                            {PACKAGES.map((p) => {
                                const active = packages.has(p.id);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => togglePkg(p.id)}
                                        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 select-none"
                                        style={{
                                            border: active ? "1px solid rgba(211,30,40,0.65)" : "1px solid rgba(255,255,255,0.06)",
                                            background: active ? "rgba(211,30,40,0.07)" : "rgba(255,255,255,0.02)",
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[11px] font-medium">{p.name}</p>
                                                <span
                                                    className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                                    style={{ background: "rgba(211,30,40,0.7)", color: "white" }}
                                                >
                                                    {p.badge}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/35 leading-relaxed">{p.desc}</p>
                                            <p className="text-[10px] text-white/45 mt-1">+₹{formatINR(p.price)}</p>
                                        </div>
                                        {/* Toggle slider */}
                                        <div
                                            className="flex-shrink-0 mt-0.5"
                                            style={{
                                                width: 36, height: 20,
                                                borderRadius: 10,
                                                background: active ? "#d31e28" : "rgba(255,255,255,0.1)",
                                                position: "relative",
                                                transition: "background 0.3s ease",
                                            }}
                                        >
                                            <motion.div
                                                animate={{ x: active ? 16 : 2 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                style={{
                                                    position: "absolute",
                                                    top: 2, width: 16, height: 16,
                                                    borderRadius: "50%",
                                                    background: "white",
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </div>

                {/* Footer CTA */}
                <div
                    className="px-6 py-5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.5)" }}
                >
                    <button
                        onClick={() => setShowSummary(true)}
                        className="w-full py-4 rounded text-[11px] font-medium tracking-[0.22em] uppercase transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ background: "white", color: "black" }}
                    >
                        Save My Configuration
                    </button>
                    <Link
                        href="/"
                        className="block mt-3 text-center text-[9px] tracking-widest uppercase text-white/25 hover:text-white/50 transition-colors duration-300"
                    >
                        ← Back to Showroom
                    </Link>
                </div>
            </motion.aside>
        </div>

            {/* ── Summary Modal ───────────────────────────────── */ }
    <AnimatePresence>
        {showSummary && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)" }}
                onClick={() => setShowSummary(false)}
            >
                <motion.div
                    initial={{ scale: 0.88, y: 24 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.88, y: 24 }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(8,8,10,0.98)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-7 py-5"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <h2
                            className="text-lg font-extralight tracking-[0.25em] uppercase"
                            style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                        >
                            Your {carModel.name.split(" ")[1] || carModel.name}
                        </h2>
                        <button
                            onClick={() => setShowSummary(false)}
                            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Car thumbnail */}
                    <div className="flex justify-center py-6 relative" style={{ background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                        <div className="relative w-[280px]">
                            <img
                                src={carModel.img}
                                alt="Your Porsche"
                                style={{
                                    width: "100%",
                                    objectFit: "contain",
                                    filter: color.filter,
                                    mixBlendMode: "screen",
                                    transition: "filter 0.7s ease",
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            />
                            {/* Modal Wheel Overlay */}
                            {carModel.wheels && carModel.wheels.map((pos, idx) => (
                                <div
                                    key={`modal-wheel-${idx}`}
                            className="absolute z-[3]"
                            style={{
                                top: pos.top,
                                left: pos.left,
                                width: pos.width,
                                transform: "translate(-50%, -50%)",
                                mixBlendMode: "screen",
                            }}
                                        >
                            <figure style={{ width: "100%", paddingTop: "100%", position: "relative", margin: 0 }}>
                                <img
                                    src={wheel.img}
                                    alt={wheel.name}
                                    style={{
                                        position: "absolute",
                                        top: 0, left: 0,
                                        width: "100%", height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                    }}
                                />
                            </figure>
                        </div>
                                    ))}
                    </div>
                </div>

                {/* Summary rows */}
                <div className="px-7 py-4">
                    {[
                        ["Base Model", carModel.name],
                        ["Exterior Color", color.name],
                        ["Wheels", wheel.name],
                        ["Interior", interior.name],
                        ...(packages.size > 0
                            ? [[
                                "Packages",
                                [...packages]
                                    .map((id) => PACKAGES.find((p) => p.id === id)?.name ?? "")
                                    .join(", "),
                            ]]
                            : []),
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="flex justify-between items-center py-3"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                            <span className="text-[10px] tracking-wider uppercase text-white/35">{label}</span>
                            <span className="text-[11px] font-medium text-right max-w-[55%]">{value}</span>
                        </div>
                    ))}
                    <div
                        className="flex justify-between items-center py-4 mt-1"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
                    >
                        <span className="text-[10px] tracking-widest uppercase text-white/50">Final Price</span>
                        <span
                            className="text-2xl font-light"
                            style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                        >
                            ₹{formatINR(total)}
                        </span>
                    </div>
                </div>

                <div className="px-7 pb-6">
                    <button
                        className="w-full py-4 rounded text-[11px] tracking-[0.22em] uppercase font-medium"
                        style={{ background: "#d31e28", color: "white" }}
                    >
                        Request a Call Back
                    </button>
                    <p className="text-center text-[9px] text-white/20 mt-3">
                        A Porsche specialist will contact you within 24 hours.
                    </p>
                </div>
            </motion.div>
                    </motion.div>
                )
}
            </AnimatePresence >
        </div >
    );
}

export default function ConfigurePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <ConfigureContent />
        </Suspense>
    );
}
