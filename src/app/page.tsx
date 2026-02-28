"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";
import Lenis from "lenis";
import dynamic from "next/dynamic";

const InteriorViewer = dynamic(() => import("../components/InteriorViewer"), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black flex items-center justify-center text-white/20 uppercase tracking-widest text-xs">Initializing Cabin View...</div>
});

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const canvas3Ref = useRef<HTMLCanvasElement>(null);
  const imagesPreloaded = useRef<HTMLImageElement[]>([]);
  const [loadedPercentage, setLoadedPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalFrames = 240;
  const [showInterior, setShowInterior] = useState(false);

  // Initialize Lenis for hardware-accelerated scroll interception
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Preload all 240 image frames into RAM for absolutely zero paint lag
  useEffect(() => {
    let loadedCount = 0;
    const loadImages = async () => {
      const promises = [];
      for (let i = 1; i <= totalFrames; i++) {
        const paddedIndex = String(i).padStart(3, "0");
        const img = new window.Image();
        img.src = `/images/ezgif-frame-${paddedIndex}.jpg`;
        promises.push(
          new Promise((resolve) => {
            img.onload = () => {
              loadedCount++;
              setLoadedPercentage(Math.round((loadedCount / totalFrames) * 100));
              resolve(true);
            };
            img.onerror = () => {
              // Ignore failed frames to prevent infinite loading screen on ngrok/slow networks
              loadedCount++;
              setLoadedPercentage(Math.round((loadedCount / totalFrames) * 100));
              resolve(true);
            };
          })
        );
        imagesPreloaded.current[i] = img;
      }
      await Promise.all(promises);
      setIsLoaded(true);
    };
    loadImages();
  }, []);

  // Map directly to Lenis scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Apply spring physics to deeply decouple rendering from the mouse wheel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });

  // Parent 3D container mapped properties
  const scale = useTransform(smoothProgress, [0, 1], [1.1, 1]);
  const rotateX = useTransform(smoothProgress, [0, 1], [5, 0]);

  // Start with heavy dimming and blur to soften the initial headlights, fading to clear
  const filter = useTransform(smoothProgress, [0, 0.1, 1], ["brightness(0.3) blur(12px)", "brightness(1) blur(0px)", "brightness(1) blur(0px)"]);
  const carOpacity = useTransform(smoothProgress, [0, 0.05, 1], [0.2, 1, 1]);

  // Parallax layers mapping
  const lowerLayerY = useTransform(smoothProgress, [0, 1], [80, 0]);
  const midLayerY = useTransform(smoothProgress, [0, 1], [40, 0]);
  const topLayerY = useTransform(smoothProgress, [0, 1], [20, 0]);

  const drawFrame = (canvas: HTMLCanvasElement | null, frameIndex: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // alpha: false prioritizes performance for opaque draws, though we use clearRect
    if (!ctx) return;

    const img = imagesPreloaded.current[frameIndex];
    if (!img) return;

    const width = img.width || 1200;
    const height = img.height || 675;

    // Resize dynamically if not matched
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    // Draw single exact frame, removing crossfade interpolations that cause ghosting/blurring
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0, width, height);
    // Mask Veo watermark at the bottom right corner
    ctx.fillStyle = "#000000";
    ctx.fillRect(width - 250, height - 120, 250, 120);
  };

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!isLoaded) return;

    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => { });
      }
      // Clamp volume strictly between 0 and 1 to prevent IndexSizeError on spring overshoot
      audioRef.current.volume = Math.max(0, Math.min(1, 0.2 + latest * 0.8));
    }

    // Force browser to render this explicitly on the next animation frame for max performance
    requestAnimationFrame(() => {
      const clampedLatest = Math.max(0, Math.min(1, latest));
      const rawFrame = clampedLatest * (totalFrames - 1);
      const exactFrame = Math.round(rawFrame) + 1; // Snap to nearest frame to prevent motion blur ghosting

      // Bypass React state - draw instantly via Canvas WebGL
      drawFrame(canvas1Ref.current, exactFrame);
      drawFrame(canvas2Ref.current, exactFrame);
      drawFrame(canvas3Ref.current, exactFrame);
    });
  });

  // Re-draw frame 1 exactly once when loading completes
  useEffect(() => {
    if (isLoaded) {
      drawFrame(canvas1Ref.current, 1);
      drawFrame(canvas2Ref.current, 1);
      drawFrame(canvas3Ref.current, 1);
    }
  }, [isLoaded]);

  return (
    <>
      {/* Loading Screen Overlay ensures all frames are in RAM */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white font-sans z-[100]">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-xs md:text-sm tracking-[0.3em] uppercase mb-6 text-white/50">
            Loading Studio Environment
          </motion.div>
          <div className="w-48 md:w-64 h-[1px] bg-white/10 overflow-hidden">
            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${loadedPercentage}%` }} />
          </div>
        </div>
      )}

      <main className="bg-black min-h-screen text-white relative">
        {/* 800vh gives a massive scroll track for butter-smooth interactions */}
        <div className="h-[800vh]" ref={containerRef}>
          <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden [perspective:1200px]">

            {/* Subtle radial gradient behind car */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.6)_0%,rgba(0,0,0,1)_60%)] z-0" />

            <motion.div
              style={{
                scale,
                rotateX,
                filter,
                opacity: carOpacity,
              }}
              className="relative w-full h-[100vh] flex items-center justify-center pointer-events-none z-10 [transform-style:preserve-3d]"
            >
              {/* Layer 1 - Bottom component layer */}
              <motion.div
                style={{ y: lowerLayerY }}
                className="absolute inset-0 flex items-center justify-center z-[1] select-none opacity-30 blur-[2px] [transform:translateZ(-100px)]"
              >
                <canvas ref={canvas1Ref} className="max-w-[100%] md:max-w-[80vw] lg:max-w-[1200px] w-full h-auto object-contain mix-blend-screen" />
              </motion.div>

              {/* Layer 2 - Mid component layer */}
              <motion.div
                style={{ y: midLayerY }}
                className="absolute inset-0 flex items-center justify-center z-[2] select-none opacity-60 blur-[1px] [transform:translateZ(-50px)]"
              >
                <canvas ref={canvas2Ref} className="max-w-[100%] md:max-w-[80vw] lg:max-w-[1200px] w-full h-auto object-contain mix-blend-screen" />
              </motion.div>

              {/* Layer 3 - Top layer */}
              <motion.div
                style={{ y: topLayerY }}
                className="absolute inset-0 flex items-center justify-center z-[3] select-none [transform:translateZ(0px)]"
              >
                <canvas ref={canvas3Ref} className="max-w-[100%] md:max-w-[80vw] lg:max-w-[1200px] w-full h-auto object-contain mix-blend-screen" />
              </motion.div>

              {/* Invisible click overlay on top — triggers interior entry */}
              <motion.button
                onClick={() => isLoaded && setShowInterior(true)}
                style={{ opacity: useTransform(smoothProgress, [0.5, 0.7], [0, 1]) }}
                className="absolute inset-0 z-[10] cursor-pointer group flex flex-col items-center justify-end pb-[18%] pointer-events-auto"
                aria-label="Step inside the cockpit"
              >
                <motion.div
                  animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm bg-black/20 group-hover:border-white/60 group-hover:bg-white/10 transition-all duration-500">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M3 8l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-light">Step Inside</span>
                </motion.div>
              </motion.button>

              {/* Soft red glow shadow beneath the car */}
              <div className="absolute top-[65%] w-[80%] md:w-[60%] h-[10%] bg-red-600/10 blur-[60px] z-0 rounded-[100%]" />
              <motion.div
                style={{
                  opacity: useTransform(scrollYProgress, [0.8, 1], [0, 1])
                }}
                className="absolute top-[65%] w-[60%] md:w-[40%] h-[10%] bg-red-500/30 blur-[40px] z-0 rounded-[100%]"
              />
            </motion.div>

            {/* Minimal Typography */}
            <div className="absolute top-[8%] w-full text-center z-20 pointer-events-none font-sans flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-3xl md:text-5xl lg:text-6xl font-extralight tracking-[0.2em] md:tracking-[0.3em] uppercase text-white/95 drop-shadow-2xl"
              >
                Porsche After Dark
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="mt-6 text-xs md:text-sm tracking-[0.4em] text-white/50 uppercase"
              >
                The Mechanical Reveal
              </motion.p>
            </div>

            <div className="absolute bottom-[5%] z-20 pointer-events-none flex flex-col items-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-[10px] uppercase tracking-widest text-white/30"
              >
                Scroll to explore
              </motion.p>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mt-3 w-[1px] h-8 bg-gradient-to-b from-white/50 to-transparent"
              />
            </div>

          </div>
        </div>

        {/* Optional ambient audio */}
        <audio ref={audioRef} loop className="hidden" aria-hidden="true" playsInline>
          <source src="#" type="audio/mpeg" />
        </audio>
      </main>

      {/* ── Interior Overlay ─────────────────────────────── */}
      <AnimatePresence>
        {showInterior && (
          <motion.div
            key="interior"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-black"
          >
            {/* Zoom-in entry mask */}
            <motion.div
              initial={{ scale: 2.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <InteriorViewer onClose={() => setShowInterior(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
