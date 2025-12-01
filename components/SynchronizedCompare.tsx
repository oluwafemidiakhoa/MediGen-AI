
import React, { useRef, useState, useEffect } from 'react';

interface SynchronizedCompareProps {
  imageLeft: string;
  imageRight: string;
  labelLeft: string;
  labelRight: string;
}

export const SynchronizedCompare: React.FC<SynchronizedCompareProps> = ({
  imageLeft,
  imageRight,
  labelLeft,
  labelRight
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(1, Math.min(zoom - e.deltaY * 0.005, 5));
    setZoom(newZoom);
    // Reset offset if zoom goes back to 1
    if (newZoom === 1) setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      isDragging.current = true;
      startPan.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && zoom > 1) {
      e.preventDefault();
      const newX = e.clientX - startPan.current.x;
      const newY = e.clientY - startPan.current.y;
      
      // Boundary check logic could go here, but free pan is often smoother UX
      setOffset({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Shared Transform Style
  const transformStyle = {
    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
  };

  return (
    <div 
      ref={containerRef}
      className="flex w-full h-full gap-1 bg-black p-1 select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Viewport */}
      <div className="relative flex-1 overflow-hidden bg-slate-900 rounded-lg border border-slate-700 group">
        <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageLeft} 
              alt="Left View" 
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={transformStyle}
            />
        </div>
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-cyan-400 font-mono font-bold border border-cyan-500/30">
          {labelLeft}
        </div>
        {/* Sync Indicator */}
        <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/20 pointer-events-none transition-colors"></div>
      </div>

      {/* Right Viewport */}
      <div className="relative flex-1 overflow-hidden bg-slate-900 rounded-lg border border-slate-700 group">
        <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageRight} 
              alt="Right View" 
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={transformStyle}
            />
        </div>
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-emerald-400 font-mono font-bold border border-emerald-500/30">
          {labelRight}
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-slate-600 rounded-full px-4 py-1 flex items-center gap-4 shadow-xl z-20">
         <span className="text-[10px] text-slate-400 font-mono uppercase">Sync View</span>
         <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(1, zoom - 0.5))} className="text-slate-300 hover:text-white">-</button>
            <span className="text-xs font-bold text-cyan-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(5, zoom + 0.5))} className="text-slate-300 hover:text-white">+</button>
         </div>
      </div>
    </div>
  );
};
