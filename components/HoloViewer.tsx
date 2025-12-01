import React, { useRef, useEffect, useState } from 'react';
import { VRScene } from './VRScene';

interface HoloViewerProps {
  videoUrl: string;
}

export const HoloViewer: React.FC<HoloViewerProps> = ({ videoUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [showVR, setShowVR] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10; // Max -10 to 10 deg
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  if (showVR) {
    return <VRScene videoUrl={videoUrl} onClose={() => setShowVR(false)} />;
  }

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center perspective-1000 overflow-hidden bg-black/80 rounded-2xl border border-cyan-500/30 group"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Transformer Container */}
      <div 
        className="relative w-[90%] h-[90%] transition-transform duration-200 ease-out transform-style-3d"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {/* Holographic Emitter Base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-cyan-500/50 blur-lg rounded-full"></div>
        
        {/* Video Plane */}
        <div className="absolute inset-0 rounded-xl overflow-hidden border border-cyan-400/20 bg-black shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <video 
                src={videoUrl} 
                className="w-full h-full object-cover mix-blend-screen opacity-90"
                autoPlay 
                loop 
                muted 
                playsInline
            />
            
            {/* Hologram Effects Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-30"></div>
                {/* Glitch/Noise Texture */}
                <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay"></div>
                {/* Vignette */}
                <div className="absolute inset-0 bg-radial-gradient(circle, transparent 60%, black 100%)"></div>
            </div>
        </div>

        {/* Floating Elements for Depth */}
        <div className="absolute -top-4 -left-4 w-4 h-4 border-t border-l border-cyan-400 opacity-50 transform translate-z-20"></div>
        <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b border-r border-cyan-400 opacity-50 transform translate-z-20"></div>
        
        <div className="absolute top-1/2 left-0 w-full h-px bg-cyan-500/10 transform translate-z-10"></div>
        <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-500/10 transform translate-z-10"></div>

        {/* Status Label */}
        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-cyan-400 transform translate-z-30 bg-black/50 px-2 py-1 rounded border border-cyan-500/30 backdrop-blur-sm">
            <span className="animate-pulse">●</span> LIVE RENDER
        </div>
      </div>
      
      {/* Container Glow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(6,182,212,0.1)] rounded-2xl"></div>

      {/* VR Toggle Button */}
      <button 
        onClick={() => setShowVR(true)}
        className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-md border border-cyan-500/50 text-cyan-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-900/50"
        title="View in VR"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="sr-only">VR Mode</span>
      </button>
    </div>
  );
};
