"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const AROverlay = dynamic(() => import("./AROverlay"), { ssr: false });





// Load Showroom lazily — only when user clicks "Select Your Model"
const Showroom = dynamic(() => import("./Showroom"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="text-[10px] tracking-[0.4em] uppercase text-white/30"
                >
                    Loading Showroom
                </motion.div>
                <div className="w-32 h-[1px] bg-white/10 overflow-hidden">
                    <motion.div
                        className="h-full bg-red-600"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        style={{ width: "50%" }}
                    />
                </div>
            </div>
        </div>
    ),
});

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { label: "Home", href: "/", icon: "⌂" },
    { label: "Experience", href: "/#experience", icon: null },
    { label: "Performance", href: "/#performance", icon: null },
];

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showroomOpen, setShowroomOpen] = useState(false);
    const [arOpen, setArOpen] = useState(false);


    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Prevent body scroll when showroom is open
    useEffect(() => {
        document.body.style.overflow = showroomOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showroomOpen]);

    // Close overlays on navigation
    useEffect(() => {
        setShowroomOpen(false);
        setMenuOpen(false);
    }, [pathname]);

    // Listen for AR overlay trigger from other components
    useEffect(() => {
        const handleOpenAR = () => setArOpen(true);
        window.addEventListener('open-ar-overlay', handleOpenAR);
        return () => window.removeEventListener('open-ar-overlay', handleOpenAR);
    }, []);


    // Force redirection to home page upon manual browser refresh
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const isNavReload = window.performance && window.performance.navigation && window.performance.navigation.type === 1;
                const entries = window.performance ? window.performance.getEntriesByType("navigation") : [];
                const isEntryReload = entries.length > 0 && (entries[0] as PerformanceNavigationTiming).type === "reload";

                if ((isNavReload || isEntryReload) && window.location.pathname !== "/") {
                    window.location.href = "/";
                }
            } catch (e) {
                // Fallback catch
            }
        }
    }, []);


    const isOnConfigure = pathname === "/configure";

    return (
        <>
            {/* ── Navbar ─────────────────────────────────────────────────────── */}
            <motion.nav
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-[500]"
                style={{
                    height: 72,
                    background: scrolled || isOnConfigure
                        ? "rgba(0,0,0,0.92)"
                        : "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
                    backdropFilter: scrolled || isOnConfigure ? "blur(28px)" : "none",
                    borderBottom: scrolled || isOnConfigure
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                    transition: "background 0.5s ease, backdrop-filter 0.5s ease, border-bottom 0.5s ease",
                }}
            >
                {/* Inner layout */}
                <div className="w-full h-full flex items-center justify-between px-8 md:px-12">

                    {/* ─── Logo ─────────────────────────────── */}
                    <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
                        {/* Porsche crest SVG */}
                        <svg
                            width="30" height="30"
                            viewBox="0 0 100 100"
                            fill="none"
                            className="flex-shrink-0 opacity-85 group-hover:opacity-100 transition-opacity duration-400"
                        >
                            <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3" fill="none" />
                            <path d="M50 12 L58 36 L50 32 L42 36 Z" fill="white" />
                            <path d="M50 88 L42 64 L50 68 L58 64 Z" fill="white" opacity="0.5" />
                            <path d="M12 50 L36 42 L32 50 L36 58 Z" fill="white" opacity="0.5" />
                            <path d="M88 50 L64 58 L68 50 L64 42 Z" fill="white" opacity="0.5" />
                            <rect x="35" y="35" width="30" height="30" rx="3" fill="none" stroke="white" strokeWidth="2" />
                            <rect x="42" y="42" width="16" height="16" rx="1.5" fill="white" opacity="0.9" />
                        </svg>
                        <span
                            className="text-white font-extralight tracking-[0.35em] uppercase text-[13px] hidden sm:block"
                            style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}
                        >
                            Porsche
                        </span>
                    </Link>

                    {/* ─── Desktop nav ──────────────────────── */}
                    <div className="hidden md:flex items-center gap-6">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            const isHome = link.href === "/";
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="relative group text-[10px] tracking-[0.25em] uppercase font-light transition-all duration-300"
                                    style={{ color: isActive ? "white" : "rgba(255,255,255,0.42)" }}
                                >
                                    {isHome ? (
                                        /* Home gets a small pill with house icon */
                                        <span
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all duration-300 group-hover:text-white"
                                            style={{
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                                            }}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                                <path d="M1 5.5L5.5 1 10 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2.5 4.2V9.5h2.5V7h1v2.5H8.5V4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {link.label}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="group-hover:text-white transition-colors duration-300">{link.label}</span>
                                            {/* Active underline */}
                                            <span
                                                className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-white rounded-full origin-left transition-transform duration-300"
                                                style={{ transform: `scaleX(${isActive ? 1 : 0})` }}
                                            />
                                            {/* Hover underline */}
                                            <span className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-white/25 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                        </>
                                    )}
                                </Link>
                            );
                        })}

                        {/* AR Toggle — opens AR overlay */}
                        <motion.button
                            onClick={() => setArOpen(true)}
                            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all duration-300 text-[10px] tracking-[0.25em] uppercase font-light"
                            style={{
                                color: "rgba(255,255,255,0.42)",
                                border: "1px solid rgba(255,255,255,0.12)",
                            }}
                            whileHover={{ scale: 1.05, color: "white" }}
                        >
                            <span className="text-white/60 group-hover:text-white transition-colors duration-300">AR</span>
                            {/* Pulse effect */}
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full">
                                <span className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75" />
                            </span>
                        </motion.button>



                        {/* Divider */}
                        <div className="w-[1px] h-5 bg-white/10" />

                        {/* Select Your Model — opens Showroom overlay */}
                        <motion.button
                            onClick={() => setShowroomOpen(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative flex items-center gap-2 px-5 py-2.5 rounded-sm overflow-hidden group"
                            style={{
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "rgba(255,255,255,0.04)",
                            }}
                        >
                            {/* Shimmer on hover */}
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            {/* Car icon */}
                            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                <path d="M1 7h12M2 7l1.5-3.5C4 2.5 4.8 2 5.5 2h3c.7 0 1.5.5 2 1.5L12 7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
                                <circle cx="3.5" cy="7.5" r="1" fill="rgba(255,255,255,0.7)" />
                                <circle cx="10.5" cy="7.5" r="1" fill="rgba(255,255,255,0.7)" />
                            </svg>
                            <span className="text-[10px] tracking-[0.25em] uppercase font-light text-white/75 group-hover:text-white transition-colors duration-300">
                                Select Your Model
                            </span>
                        </motion.button>

                        {/* Configure CTA */}
                        <Link href="/configure?model=0">
                            <motion.span
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-[10px] tracking-[0.25em] uppercase font-medium cursor-pointer"
                                style={{
                                    background: isOnConfigure ? "white" : "#d31e28",
                                    color: isOnConfigure ? "black" : "white",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                Configure
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.span>
                        </Link>
                    </div>

                    {/* ─── Mobile hamburger ─────────────────── */}
                    <button
                        className="md:hidden flex flex-col gap-[5px] p-2 group"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="Toggle menu"
                    >
                        <span
                            className="block w-6 h-[1px] bg-white/70 group-hover:bg-white transition-all duration-300"
                            style={{ transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }}
                        />
                        <span
                            className="block w-6 h-[1px] bg-white/70 group-hover:bg-white transition-all duration-300"
                            style={{ opacity: menuOpen ? 0 : 1 }}
                        />
                        <span
                            className="block w-6 h-[1px] bg-white/70 group-hover:bg-white transition-all duration-300"
                            style={{ transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }}
                        />
                    </button>
                </div>
            </motion.nav>

            {/* ─── Mobile Menu ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.28 }}
                        className="fixed top-[72px] left-0 right-0 z-[499] md:hidden flex flex-col"
                        style={{
                            background: "rgba(0,0,0,0.97)",
                            backdropFilter: "blur(32px)",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                        }}
                    >
                        <div className="flex flex-col px-8 py-8 gap-1">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-between py-4 text-[11px] tracking-[0.25em] uppercase font-light text-white/55 hover:text-white transition-colors duration-200"
                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                    {link.label}
                                    <span className="text-white/20">→</span>
                                </Link>
                            ))}
                            <button
                                onClick={() => { setMenuOpen(false); setShowroomOpen(true); }}
                                className="flex items-center justify-between py-4 text-[11px] tracking-[0.25em] uppercase font-light text-white/55 hover:text-white transition-colors duration-200"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                Select Your Model
                                <span className="text-white/20">→</span>
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); setArOpen(true); }}
                                className="flex items-center justify-between py-4 text-[11px] tracking-[0.25em] uppercase font-light text-white/55 hover:text-white transition-colors duration-200"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                AR Experience
                                <span className="text-white/20">→</span>
                            </button>

                            <Link
                                href="/configure?model=0"
                                onClick={() => setMenuOpen(false)}
                                className="mt-4 flex items-center justify-center py-4 rounded-sm text-[11px] tracking-[0.25em] uppercase font-medium"
                                style={{ background: "#d31e28", color: "white" }}
                            >
                                Configure Your 911
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Showroom Full-Screen Overlay ────────────────────────────────── */}
            <AnimatePresence>
                {showroomOpen && (
                    <motion.div
                        key="showroom-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[490] bg-black"
                    >
                        {/* Close button */}
                        <motion.button
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => setShowroomOpen(false)}
                            className="absolute top-5 right-6 z-[510] flex items-center gap-2 px-4 py-2 rounded-sm group"
                            style={{
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(0,0,0,0.5)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M1 1l10 10M11 1L1 11" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 group-hover:text-white/80 transition-colors duration-200">
                                Close
                            </span>
                        </motion.button>

                        {/* Label at top */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="absolute top-6 left-1/2 -translate-x-1/2 z-[510] text-center pointer-events-none"
                        >
                            <p className="text-[9px] tracking-[0.45em] uppercase text-white/30">
                                Porsche Lineup
                            </p>
                        </motion.div>

                        {/* Showroom fills entire screen */}
                        <motion.div
                            initial={{ scale: 1.04, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.02, opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full h-full"
                        >
                            <Showroom onClose={() => setShowroomOpen(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── AR Overlay ────────────────────────────────────────────────── */}
            {/* <AROverlay isOpen={arOpen} onClose={() => setArOpen(false)} /> */}


        </>
    );
}


