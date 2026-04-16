"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useSpring, useVelocity } from "framer-motion";
import Lenis from "lenis";



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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scrollVelocity = useVelocity(scrollYProgress);

  // Apply spring physics to deeply decouple rendering from the mouse wheel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });

  // Audio control based on scroll velocity and position
  useMotionValueEvent(scrollVelocity, "change", (latestVelocity) => {
    if (!isLoaded || !audioRef.current) return;

    // Convert velocity to an absolute value for speed/volume (ignoring direction)
    const speed = Math.abs(latestVelocity);

    if (speed < 0.005) {
      // Extremely slow or stopped -> pause audio
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }
    } else {
      // Scrolling -> ensure it's playing
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => { });
      }

      // Calculate dynamic playback rate and volume relative to scroll speed
      // Base rate is 0.7, max rate around 2.0 when scrolling fast
      const targetRate = Math.min(2.0, 0.7 + (speed * 10));
      // Target volume depends both on speed and scroll depth
      const depthScale = Math.max(0, Math.min(1, scrollYProgress.get() * 2));
      const targetVolume = Math.min(1.0, 0.3 + (speed * 5)) * depthScale;

      // Smooth out audio transitions
      audioRef.current.playbackRate = targetRate;
      audioRef.current.volume = targetVolume;
    }
  });

  // Audio mute fallback when component unmounts
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  // Parent 3D container mapped properties
  const scale = useTransform(smoothProgress, [0, 1], [1.1, 1]);
  const rotateX = useTransform(smoothProgress, [0, 1], [5, 0]);

  // Start with heavy dimming and blur to soften the initial headlights, fading to clear
  const filter = useTransform(smoothProgress, [0, 0.1, 1], ["brightness(0.3) blur(12px)", "brightness(1) blur(0px)", "brightness(1) blur(0px)"]);
  const carOpacity = useTransform(smoothProgress, [0, 0.05, 1], [0.2, 1, 1]);

  // Parallax layers mapping (removed layers for performance, using single canvas)
  const layerY = useTransform(smoothProgress, [0, 1], [40, 0]);

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

  const lastFrameRef = useRef<number>(-1);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!isLoaded) return;

    const clampedLatest = Math.max(0, Math.min(1, latest));
    const rawFrame = clampedLatest * (totalFrames - 1);
    const exactFrame = Math.round(rawFrame) + 1;

    if (exactFrame === lastFrameRef.current) return;
    lastFrameRef.current = exactFrame;

    requestAnimationFrame(() => {
      drawFrame(canvas3Ref.current, exactFrame);
    });
  });

  // Re-draw initial frame when loading completes
  useEffect(() => {
    if (isLoaded) {
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

      <main id="experience" className="bg-black min-h-screen text-white relative">

        {/* 800vh gives a massive scroll track for butter-smooth interactions */}
        <div className="h-[800vh]" ref={containerRef}>
          <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden [perspective:1200px]">

            {/* Subtle radial gradient behind car */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.6)_0%,rgba(0,0,0,1)_60%)] z-0" />

            <motion.div
              style={{
                scale,
                rotateX,
                opacity: carOpacity,
                y: layerY
              }}
              className="relative w-full h-[100vh] flex items-center justify-center pointer-events-none z-10"
            >
              <canvas 
                ref={canvas3Ref} 
                className="max-w-[100%] md:max-w-[80vw] lg:max-w-[1200px] w-full h-auto object-contain mix-blend-screen" 
              />

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

            {/* AR Feature CTA */}
            <div className="absolute bottom-[5%] right-8 z-30 pointer-events-auto">
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300"
                 onClick={() => {
                   // This will be handled by the Navbar state if we pass it, 
                   // but for now let's just make it a link to indicate the feature exists
                   window.dispatchEvent(new CustomEvent('open-ar-overlay'));
                 }}
               >
                 <div className="w-2 h-2 bg-red-600 rounded-full">
                    <div className="w-full h-full bg-red-600 rounded-full animate-ping" />
                 </div>
                 <span className="text-[10px] tracking-[0.2em] uppercase text-white/80">Launch AR</span>
               </motion.button>
            </div>


          </div>
        </div>


        {/* Optional ambient audio */}
        <audio ref={audioRef} loop className="hidden" aria-hidden="true" playsInline>
          <source src="/porsche_audio.mp4" type="audio/mp4" />
        </audio>
      </main>

    </>
  );
}
