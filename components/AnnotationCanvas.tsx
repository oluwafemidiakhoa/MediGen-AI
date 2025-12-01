
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnnotationToolType, AnnotationStyle, Annotation, AnnotationLayer, BrushShape, LineStyle } from '../types';

interface AnnotationCanvasProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string) => void;
  onCancel: () => void;
}

const COLORS = [
  { label: 'Pathology', value: '#ef4444' }, // Red
  { label: 'Normal', value: '#22c55e' },    // Green
  { label: 'Measure', value: '#3b82f6' },   // Blue
  { label: 'Note', value: '#eab308' },      // Yellow
  { label: 'White', value: '#ffffff' },
];

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for Retained Mode Rendering
  const [layers, setLayers] = useState<AnnotationLayer[]>([
    { id: 'base', name: 'Base Annotations', isVisible: true }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('base');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{x: number, y: number}[]>([]);
  
  // Tool State
  const [tool, setTool] = useState<AnnotationToolType>('PEN');
  const [style, setStyle] = useState<AnnotationStyle>({
    color: '#ef4444',
    lineWidth: 3,
    fontSize: 16,
    brushShape: 'ROUND',
    lineStyle: 'SOLID'
  });
  
  const [textInput, setTextInput] = useState<{x: number, y: number, text: string} | null>(null);
  const [showLayers, setShowLayers] = useState(false);

  // Load Image once
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setBgImage(img);
    };
  }, [imageUrl]);

  // Main Render Loop
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !bgImage) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    // Maintain aspect ratio, center image
    // Note: In a real app we might want pan/zoom, but here we fit to canvas
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // 2. Draw Annotations (Layer by Layer)
    // Filter annotations by visible layers
    const visibleLayerIds = new Set(layers.filter(l => l.isVisible).map(l => l.id));
    
    // Sort logic could go here if we had z-index, currently render in order of creation
    annotations.forEach(ann => {
      if (!visibleLayerIds.has(ann.layerId)) return;
      drawAnnotation(ctx, ann);
    });

    // 3. Draw Current Stroke (if drawing)
    if (isDrawing && currentPoints.length > 0) {
      drawPath(ctx, currentPoints, { ...style, tool });
    }

  }, [bgImage, annotations, layers, isDrawing, currentPoints, style, tool]);

  // Trigger redraw on any state change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Initial Canvas Sizing
  useEffect(() => {
    if (bgImage && containerRef.current && canvasRef.current) {
       const containerWidth = containerRef.current.clientWidth;
       const containerHeight = containerRef.current.clientHeight;
       
       // Fixed scale matching image for best quality
       canvasRef.current.width = bgImage.width;
       canvasRef.current.height = bgImage.height;
       
       redraw();
    }
  }, [bgImage, redraw]);

  // Drawing Helper Functions
  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    if (ann.tool === 'TEXT' && ann.text && ann.textPosition) {
      ctx.font = `bold ${ann.style.fontSize}px Arial`;
      ctx.fillStyle = ann.style.color;
      ctx.fillText(ann.text, ann.textPosition.x, ann.textPosition.y);
    } else {
      drawPath(ctx, ann.points, { ...ann.style, tool: ann.tool });
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], styleConfig: AnnotationStyle & { tool: AnnotationToolType }) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = styleConfig.tool === 'ERASER' ? '#000000' : styleConfig.color; // Eraser paints black for now
    ctx.lineWidth = styleConfig.tool === 'ERASER' ? 30 : styleConfig.lineWidth;
    
    ctx.lineCap = styleConfig.brushShape === 'SQUARE' ? 'square' : 'round';
    ctx.lineJoin = styleConfig.brushShape === 'SQUARE' ? 'miter' : 'round';

    if (styleConfig.lineStyle === 'DASHED') {
      ctx.setLineDash([15, 10]);
    } else if (styleConfig.lineStyle === 'DOTTED') {
      ctx.setLineDash([2, 8]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]); // Reset
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Event Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'TEXT') {
      const coords = getCoordinates(e);
      setTextInput({ x: coords.x, y: coords.y, text: '' });
      return;
    }
    
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setCurrentPoints([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    setCurrentPoints(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPoints.length > 1) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        layerId: activeLayerId,
        tool,
        points: currentPoints,
        style: { ...style }
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    setCurrentPoints([]);
  };

  const handleTextSubmit = () => {
    if (textInput && textInput.text) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        layerId: activeLayerId,
        tool: 'TEXT',
        points: [],
        text: textInput.text,
        textPosition: { x: textInput.x, y: textInput.y },
        style: { ...style }
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    setTextInput(null);
  };

  // Layer Management
  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    setLayers([...layers, { id: newId, name: `Layer ${layers.length + 1}`, isVisible: true }]);
    setActiveLayerId(newId);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
  };

  const deleteLayer = (id: string) => {
    if (layers.length === 1) return; // Prevent deleting last layer
    setLayers(layers.filter(l => l.id !== id));
    setAnnotations(annotations.filter(a => a.layerId !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers[0].id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-slate-800 border-b border-slate-700 gap-2">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
           {/* Tools */}
           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
             {(['PEN', 'TEXT', 'ERASER'] as AnnotationToolType[]).map(t => (
               <button 
                  key={t}
                  onClick={() => setTool(t)}
                  className={`p-2 rounded ${tool === t ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title={t}
               >
                 {t === 'PEN' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                 {t === 'TEXT' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                 {t === 'ERASER' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
               </button>
             ))}
           </div>
           
           <div className="h-6 w-px bg-slate-700 mx-2"></div>

           {/* Brush Settings (Only for PEN) */}
           {tool === 'PEN' && (
             <>
               {/* Brush Shape */}
               <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button onClick={() => setStyle({...style, brushShape: 'ROUND'})} className={`p-2 rounded ${style.brushShape === 'ROUND' ? 'bg-slate-700 text-cyan-400' : 'text-slate-500'}`} title="Round Cap">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
                  </button>
                  <button onClick={() => setStyle({...style, brushShape: 'SQUARE'})} className={`p-2 rounded ${style.brushShape === 'SQUARE' ? 'bg-slate-700 text-cyan-400' : 'text-slate-500'}`} title="Square Cap">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" /></svg>
                  </button>
               </div>

               {/* Line Style */}
               <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 ml-2">
                  <button onClick={() => setStyle({...style, lineStyle: 'SOLID'})} className={`p-2 rounded ${style.lineStyle === 'SOLID' ? 'bg-slate-700 text-cyan-400' : 'text-slate-500'}`} title="Solid Line">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeWidth={3} d="M4 12h16" /></svg>
                  </button>
                  <button onClick={() => setStyle({...style, lineStyle: 'DASHED'})} className={`p-2 rounded ${style.lineStyle === 'DASHED' ? 'bg-slate-700 text-cyan-400' : 'text-slate-500'}`} title="Dashed Line">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeWidth={3} strokeDasharray="4 4" d="M4 12h16" /></svg>
                  </button>
                  <button onClick={() => setStyle({...style, lineStyle: 'DOTTED'})} className={`p-2 rounded ${style.lineStyle === 'DOTTED' ? 'bg-slate-700 text-cyan-400' : 'text-slate-500'}`} title="Dotted Line">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeWidth={3} strokeDasharray="1 3" d="M4 12h16" /></svg>
                  </button>
               </div>
               
               <div className="h-6 w-px bg-slate-700 mx-2"></div>
             </>
           )}

           {/* Colors */}
           <div className="flex gap-1">
             {COLORS.map(c => (
               <button
                 key={c.value}
                 onClick={() => setStyle(prev => ({ ...prev, color: c.value }))}
                 className={`w-5 h-5 rounded-full border-2 transition-transform ${style.color === c.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                 style={{ backgroundColor: c.value }}
                 title={c.label}
               />
             ))}
           </div>

           <div className="h-6 w-px bg-slate-700 mx-2"></div>
           
           {/* Size Slider */}
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Size</span>
              <input 
                type="range" 
                min="1" max="20" 
                value={style.lineWidth} 
                onChange={(e) => setStyle(prev => ({...prev, lineWidth: parseInt(e.target.value)}))}
                className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
           </div>
        </div>

        <div className="flex gap-2">
          {/* Layer Toggle Button */}
          <button 
            onClick={() => setShowLayers(!showLayers)}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded flex items-center gap-2 border ${showLayers ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             Layers ({layers.length})
          </button>
          
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white uppercase">Cancel</button>
          <button 
             onClick={() => {
                if (canvasRef.current) {
                   onSave(canvasRef.current.toDataURL('image/png'));
                }
             }}
             className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg uppercase shadow-lg shadow-cyan-900/50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-black relative overflow-hidden cursor-crosshair touch-none flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
        
        {/* Text Input Overlay */}
        {textInput && (
          <div 
            className="absolute bg-slate-800 p-2 rounded shadow-xl flex gap-2 border border-cyan-500/50 z-50"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
             <input 
                autoFocus
                type="text" 
                value={textInput.text}
                onChange={(e) => setTextInput({...textInput, text: e.target.value})}
                placeholder="Enter Label..."
                className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm outline-none focus:border-cyan-500"
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
             />
             <button onClick={handleTextSubmit} className="bg-cyan-600 text-white px-2 rounded text-xs">OK</button>
          </div>
        )}

        {/* Layers Panel (Floating) */}
        {showLayers && (
          <div className="absolute top-4 right-4 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden animate-fade-in-down">
             <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Layers</span>
                <button onClick={addLayer} className="p-1 hover:bg-slate-700 rounded text-cyan-400" title="Add Layer">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
             </div>
             <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {layers.slice().reverse().map((layer) => (
                  <div 
                     key={layer.id}
                     onClick={() => setActiveLayerId(layer.id)}
                     className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${activeLayerId === layer.id ? 'bg-cyan-900/30 border-cyan-500/50' : 'hover:bg-slate-800 border-transparent'}`}
                  >
                     <div className="flex items-center gap-2">
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                           className={`p-1 rounded ${layer.isVisible ? 'text-cyan-400' : 'text-slate-600'}`}
                        >
                           {layer.isVisible ? (
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           ) : (
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.575-3.107m5.858-4.242C9.28 4.2 10.609 4 12 4c4.478 0 8.268 2.943 9.542 7 0 0-.25.867-.674 1.772m-2.427 3.036A9.953 9.953 0 0112 19c-1.39 0-2.709-.2-3.874-.575m5.975-5.976a3 3 0 01-4.242 4.242" /></svg>
                           )}
                        </button>
                        <span className={`text-xs font-medium ${activeLayerId === layer.id ? 'text-white' : 'text-slate-400'}`}>{layer.name}</span>
                     </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                        className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100"
                        title="Delete Layer"
                     >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
