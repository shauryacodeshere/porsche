"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring, useVelocity } from "framer-motion";
import Lenis from "lenis";

export default function ExperienceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesPreloaded = useRef<HTMLImageElement[]>([]);
  const [loadedPercentage, setLoadedPercentage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalFrames = 240;

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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });

  useMotionValueEvent(scrollVelocity, "change", (latestVelocity) => {
    if (!isLoaded || !audioRef.current) return;
    const speed = Math.abs(latestVelocity);

    if (speed < 0.005) {
      if (!audioRef.current.paused) audioRef.current.pause();
    } else {
      if (audioRef.current.paused) audioRef.current.play().catch(() => { });
      const targetRate = Math.min(2.0, 0.7 + (speed * 10));
      const depthScale = Math.max(0, Math.min(1, scrollYProgress.get() * 2));
      const targetVolume = Math.min(1.0, 0.3 + (speed * 5)) * depthScale;
      audioRef.current.playbackRate = targetRate;
      audioRef.current.volume = targetVolume;
    }
  });

  const scale = useTransform(smoothProgress, [0, 1], [1.1, 1]);
  const rotateX = useTransform(smoothProgress, [0, 1], [5, 0]);
  const carOpacity = useTransform(smoothProgress, [0, 0.05, 1], [0.2, 1, 1]);
  const layerY = useTransform(smoothProgress, [0, 1], [40, 0]);

  const drawFrame = (canvas: HTMLCanvasElement | null, frameIndex: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const img = imagesPreloaded.current[frameIndex];
    if (!img) return;

    const width = img.width || 1200;
    const height = img.height || 675;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(width - 250, height - 120, 250, 120);
  };

  const lastFrameRef = useRef<number>(-1);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!isLoaded) return;
    const clampedLatest = Math.max(0, Math.min(1, latest));
    const exactFrame = Math.round(clampedLatest * (totalFrames - 1)) + 1;

    if (exactFrame === lastFrameRef.current) return;
    lastFrameRef.current = exactFrame;

    requestAnimationFrame(() => {
      drawFrame(canvasRef.current, exactFrame);
    });
  });

  useEffect(() => {
    if (isLoaded) drawFrame(canvasRef.current, 1);
  }, [isLoaded]);

  return (
    <>
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

      <div className="h-[800vh]" ref={containerRef}>
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden [perspective:1200px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.6)_0%,rgba(0,0,0,1)_60%)] z-0" />

          <motion.div
            style={{ scale, rotateX, opacity: carOpacity, y: layerY }}
            className="relative w-full h-[100vh] flex items-center justify-center pointer-events-none z-10"
          >
            <canvas ref={canvasRef} className="max-w-[100%] md:max-w-[80vw] lg:max-w-[1200px] w-full h-auto object-contain mix-blend-screen" />
            <div className="absolute top-[65%] w-[80%] md:w-[60%] h-[10%] bg-red-600/10 blur-[60px] z-0 rounded-[100%]" />
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

          <div className="absolute bottom-[5%] right-8 z-30 pointer-events-auto">
             <button
               className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300"
               onClick={() => window.dispatchEvent(new CustomEvent('open-ar-overlay'))}
             >
               <div className="w-2 h-2 bg-red-600 rounded-full">
                  <div className="w-full h-full bg-red-600 rounded-full animate-ping" />
               </div>
               <span className="text-[10px] tracking-[0.2em] uppercase text-white/80">Launch AR</span>
             </button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} loop className="hidden" aria-hidden="true" playsInline>
        <source src="/porsche_audio.mp4" type="audio/mp4" />
      </audio>
    </>
  );
}
