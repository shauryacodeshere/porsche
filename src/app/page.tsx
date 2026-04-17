"use client";
export const dynamic = "force-dynamic";

import dynamic from 'next/dynamic';

const ExperienceCanvas = dynamic(() => import('@/components/ExperienceCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white font-sans z-[100]">
      <div className="text-xs md:text-sm tracking-[0.3em] uppercase mb-6 text-white/50 animate-pulse">
        Initializing Engine
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main id="experience" className="bg-black min-h-screen text-white relative">
      <ExperienceCanvas />
    </main>
  );
}
