import React, { useState, useEffect, useRef } from 'react';
import { AnatomicalStructure } from '../types';

interface SmartLabelOverlayProps {
  structures: AnatomicalStructure[];
  imageUrl: string;
}

export const SmartLabelOverlay: React.FC<SmartLabelOverlayProps> = ({ structures, imageUrl }) => {
  const [labels, setLabels] = useState<AnatomicalStructure[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setLabels(structures);
  }, [structures]);

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

    // Update label position
    // We update the center of the box to the new drop location
    // Box format [ymin, xmin, ymax, xmax]
    // We'll just shift the box to center around new x,y
    
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
      <img src={imageUrl} className="w-full h-full object-contain opacity-0 pointer-events-none" alt="Reference" />
      
      {labels.map((item, idx) => {
        if (!item.box_2d) return null;
        
        // Convert [ymin, xmin, ymax, xmax] to styles
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        
        // Calculate center for the pin
        const centerY = ymin + (ymax - ymin) / 2;
        const centerX = xmin + (xmax - xmin) / 2;

        return (
          <div key={idx}>
            {/* The Bounding Box (Optional - usually too cluttery, so we show corners on hover) */}
            <div 
               className="absolute border border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10 hover:border-cyan-400 transition-colors rounded-sm pointer-events-none group-hover:opacity-100"
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
              {/* Pin Head */}
              <div className="relative">
                <div className="w-3 h-3 bg-cyan-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10 relative animate-pulse group-hover:animate-none group-hover:scale-125 transition-transform"></div>
                {/* Connecting Line */}
                <div className="absolute top-3 left-1/2 w-0.5 h-8 bg-cyan-500/50 -translate-x-1/2 origin-top transform group-hover:scale-y-110 transition-transform"></div>
                
                {/* Label Card */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-cyan-500/30 px-3 py-2 rounded-lg min-w-[120px] shadow-xl text-center z-20">
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