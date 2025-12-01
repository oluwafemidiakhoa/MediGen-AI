import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageAdjustments } from '../types';

interface ImageCompareProps {
  beforeImage: string;
  afterImage: string;
  adjustments?: ImageAdjustments;
}

export const ImageCompare: React.FC<ImageCompareProps> = ({ 
  beforeImage, 
  afterImage,
  adjustments = { brightness: 100, contrast: 100, invert: false, grayscale: false }
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) handleMove(e.touches[0].clientX);
    };
    const onEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleMove]);

  // Construct CSS filter string
  const filterStyle = {
    filter: `
      brightness(${adjustments.brightness}%) 
      contrast(${adjustments.contrast}%) 
      invert(${adjustments.invert ? 1 : 0}) 
      grayscale(${adjustments.grayscale ? 1 : 0})
    `
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-2xl cursor-col-resize group touch-none border border-slate-700 bg-black"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <img 
        src={beforeImage} 
        style={filterStyle}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0" 
        alt="Before" 
      />
      
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
            src={afterImage} 
            style={filterStyle}
            className="absolute inset-0 w-full h-full object-contain" 
            alt="After" 
        />
      </div>

      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)] z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center text-cyan-600 ring-4 ring-black/20 transform transition-transform group-hover:scale-110">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="rotate-90 origin-center" />
          </svg>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-none uppercase tracking-wider">Source</div>
      <div className="absolute top-4 right-4 bg-cyan-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-400/30 shadow-lg pointer-events-none uppercase tracking-wider">MediGen AI</div>
    </div>
  );
};