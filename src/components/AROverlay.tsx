"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Globe, Box } from "lucide-react";
import QRCode from "react-qr-code";



interface AROverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AROverlay({ isOpen, onClose }: AROverlayProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [pageUrl, setPageUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPageUrl(window.location.href);
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            setIsMobile(/android|ipad|playbook|silk|iphone|ipod/i.test(userAgent.toLowerCase()) || window.innerWidth <= 768);
        }
    }, [isOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={32} strokeWidth={1} />
                    </button>

                    <div className="w-full max-w-4xl px-6 flex flex-col items-center">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-white text-3xl md:text-5xl font-extralight tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "var(--font-syncopate, sans-serif)" }}>
                                Experience AR
                            </h2>
                            <p className="text-white/40 text-xs md:text-sm tracking-[0.4em] uppercase">
                                Bring the 911 into your space
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
                            {/* QR Section */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col items-center md:items-end"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                    <QRCode value={pageUrl} size={200} />
                                </div>


                                <div className="mt-6 text-center md:text-right">
                                    <div className="flex items-center justify-center md:justify-end gap-2 text-white/60 mb-2">
                                        <Smartphone size={16} />
                                        <span className="text-[10px] tracking-[0.2em] uppercase">Mobile Access</span>
                                    </div>
                                    <p className="text-white/30 text-[10px] leading-relaxed max-w-[200px]">
                                        Scan this code with your smartphone camera to launch the interactive AR viewer.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Info Section */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col gap-8"
                            >
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <Globe size={18} className="text-white/60" />
                                    </div>
                                    <div>
                                        <h4 className="text-white/80 text-[11px] tracking-[0.2em] uppercase mb-1">Web-Based</h4>
                                        <p className="text-white/40 text-[10px] leading-relaxed">No app required. Optimized for Safari (iOS) and Chrome (Android).</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <Box size={18} className="text-white/60" />
                                    </div>
                                    <div>
                                        <h4 className="text-white/80 text-[11px] tracking-[0.2em] uppercase mb-1">True Scale</h4>
                                        <p className="text-white/40 text-[10px] leading-relaxed">The model is rendered at 1:1 scale for an authentic showroom experience.</p>
                                    </div>
                                </div>

                                {isMobile && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                             // For simple mobile testing, we can trigger the model-viewer via a hidden element or new page
                                             window.location.href = "/ar-viewer";
                                        }}
                                        className="mt-4 w-full py-4 bg-red-600 text-white text-[11px] tracking-[0.3em] uppercase font-bold rounded-sm shadow-[0_10px_30px_rgba(211,30,40,0.3)]"
                                    >
                                        Launch AR Viewer
                                    </motion.button>
                                )}
                            </motion.div>
                        </div>

                        {/* Decoration */}
                        <div className="mt-20 w-[1px] h-20 bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
