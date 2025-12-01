
import React, { useState, useEffect, useRef } from 'react';

interface MagnifierProps {
  imgUrl: string;
  zoomLevel?: number;
  size?: number;
}

export const Magnifier: React.FC<MagnifierProps> = ({ 
  imgUrl, 
  zoomLevel = 2.5, 
  size = 150 
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    setPosition({ x, y });
    setImgSize({ width, height });
    
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      setShowMagnifier(true);
    } else {
      setShowMagnifier(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowMagnifier(false)}
    >
      <img 
         src={imgUrl} 
         className="w-full h-full object-contain pointer-events-none" 
         alt="Magnifier Source" 
      />

      {showMagnifier && (
        <div 
          className="absolute border-2 border-cyan-400 rounded-full shadow-2xl pointer-events-none z-50 overflow-hidden bg-black"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${position.x - size/2}px`,
            top: `${position.y - size/2}px`,
            backgroundImage: `url(${imgUrl})`,
            backgroundRepeat: 'no-repeat',
            // Calculate relative position for zoom
            backgroundSize: `${imgSize.width * zoomLevel}px ${imgSize.height * zoomLevel}px`,
            backgroundPositionX: `${-position.x * zoomLevel + size/2}px`,
            backgroundPositionY: `${-position.y * zoomLevel + size/2}px`
          }}
        >
          {/* Crosshair */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-cyan-500/50"></div>
          <div className="absolute top-0 left-1/2 h-full w-px bg-cyan-500/50"></div>
        </div>
      )}
    </div>
  );
};
