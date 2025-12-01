
import React, { useState, useEffect, useRef } from 'react';
import { AnatomicalStructure } from '../types';

interface SmartLabelOverlayProps {
  structures: AnatomicalStructure[];
  imageUrl: string;
  focusedIndex?: number | null;
}

export const SmartLabelOverlay: React.FC<SmartLabelOverlayProps> = ({ structures, imageUrl, focusedIndex }) => {
  const [labels, setLabels] = useState<AnatomicalStructure[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setLabels(structures);
  }, [structures]);

  // Spotlight Effect Calculation
  const getSpotlightStyle = () => {
    if (focusedIndex === null || focusedIndex === undefined) return {};
    const target = labels[focusedIndex];
    if (!target || !target.box_2d) return {};

    const [ymin, xmin, ymax, xmax] = target.box_2d;
    
    // Create a clip path that isolates the region
    return {
       clipPath: `polygon(
         0% 0%, 
         0% 100%, 
         ${xmin}% 100%, 
         ${xmin}% ${ymin}%, 
         ${xmax}% ${ymin}%, 
         ${xmax}% ${ymax}%, 
         ${xmin}% ${ymax}%, 
         ${xmin}% 100%, 
         100% 100%, 
         100% 0%
       )`
    };
  };

  // Handle Dragging Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const indexStr = e.dataTransfer.getData('text/plain');
    const index = parseInt(indexStr);
    
    if (isNaN(index)) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newLabels = [...labels];
    const currentBox = newLabels[index].box_2d || [0,0,0,0];
    const height = currentBox[2] - currentBox[0];
    const width = currentBox[3] - currentBox[1];
    
    newLabels[index] = {
      ...newLabels[index],
      box_2d: [
        Math.max(0, y - height/2),
        Math.max(0, x - width/2),
        Math.min(100, y + height/2),
        Math.min(100, x + width/2)
      ]
    };
    
    setLabels(newLabels);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-20 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Background Dimmer for Spotlight */}
      {focusedIndex !== null && focusedIndex !== undefined && (
         <div className="absolute inset-0 bg-black/70 transition-opacity duration-300" style={getSpotlightStyle()}></div>
      )}

      {/* Helper Image to maintain aspect ratio if needed, usually hidden but here we rely on parent container sizing */}
      <img src={imageUrl} className="w-full h-full object-contain opacity-0 pointer-events-none" alt="Reference" />
      
      {labels.map((item, idx) => {
        if (!item.box_2d) return null;
        
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        const centerY = ymin + (ymax - ymin) / 2;
        const centerX = xmin + (xmax - xmin) / 2;
        
        const isFocused = focusedIndex === idx;
        const isDimmed = focusedIndex !== null && focusedIndex !== undefined && !isFocused;

        return (
          <div key={idx} className={`transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'}`}>
            {/* The Bounding Box */}
            <div 
               className={`absolute border rounded-sm pointer-events-none transition-all duration-300
                  ${isFocused ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'border-transparent hover:border-cyan-400/30'}
               `}
               style={{
                 top: `${ymin}%`,
                 left: `${xmin}%`,
                 height: `${ymax - ymin}%`,
                 width: `${xmax - xmin}%`
               }}
            />

            {/* The Draggable Pin/Label */}
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group"
              style={{
                top: `${centerY}%`,
                left: `${centerX}%`
              }}
            >
              <div className="relative">
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10 relative transition-transform
                   ${isFocused ? 'bg-cyan-400 scale-125' : 'bg-cyan-600 animate-pulse group-hover:animate-none group-hover:scale-125'}
                `}></div>
                
                <div className={`absolute top-3 left-1/2 w-0.5 h-8 -translate-x-1/2 origin-top transform transition-all
                   ${isFocused ? 'bg-cyan-400 scale-y-125' : 'bg-cyan-500/50 group-hover:scale-y-110'}
                `}></div>
                
                {/* Label Card */}
                <div className={`absolute top-10 left-1/2 -translate-x-1/2 backdrop-blur-md border px-3 py-2 rounded-lg min-w-[120px] shadow-xl text-center z-20 transition-all
                   ${isFocused ? 'bg-cyan-900/90 border-cyan-400 scale-110' : 'bg-black/80 border-cyan-500/30'}
                `}>
                  <p className="text-cyan-300 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">{item.name}</p>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5 max-w-[150px] line-clamp-2">{item.medicalRelevance}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
