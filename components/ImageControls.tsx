
import React from 'react';
import { ImageAdjustments } from '../types';

interface ImageControlsProps {
  adjustments: ImageAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<ImageAdjustments>>;
  activeTool: 'POINTER' | 'MAGNIFIER' | 'WINDOW_LEVEL' | 'HEATMAP';
  setActiveTool: (tool: 'POINTER' | 'MAGNIFIER' | 'WINDOW_LEVEL' | 'HEATMAP') => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({ adjustments, setAdjustments, activeTool, setActiveTool }) => {
  
  const handleChange = (key: keyof ImageAdjustments, value: any) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      invert: false,
      grayscale: false
    });
    setActiveTool('POINTER');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-xl flex items-center justify-between gap-4 mb-4 shadow-lg overflow-x-auto custom-scrollbar">
      
      {/* Tool Selection */}
      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
         <button 
           onClick={() => setActiveTool('POINTER')}
           className={`p-1.5 rounded ${activeTool === 'POINTER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
           title="Default Pointer"
         >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
         </button>
         <button 
           onClick={() => setActiveTool('MAGNIFIER')}
           className={`p-1.5 rounded ${activeTool === 'MAGNIFIER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
           title="Magnifier Loupe"
         >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
         </button>
         <button 
           onClick={() => setActiveTool('WINDOW_LEVEL')}
           className={`p-1.5 rounded ${activeTool === 'WINDOW_LEVEL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
           title="Window/Level (Contrast/Brightness)"
         >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
         </button>
         <button 
           onClick={() => setActiveTool('HEATMAP')}
           className={`p-1.5 rounded ${activeTool === 'HEATMAP' ? 'bg-orange-600 text-white animate-pulse' : 'text-slate-400 hover:text-orange-400'}`}
           title="Thermal Anomaly Heatmap"
         >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
         </button>
      </div>

      <div className="w-px h-8 bg-slate-700 mx-2"></div>

      <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1 min-w-[80px]">
              <label className="text-[9px] text-slate-500 uppercase font-bold flex justify-between">
                  Bright <span>{Math.round(adjustments.brightness)}%</span>
              </label>
              <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={adjustments.brightness}
                  onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
                  className="h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
          </div>
          <div className="flex flex-col gap-1 min-w-[80px]">
              <label className="text-[9px] text-slate-500 uppercase font-bold flex justify-between">
                  Cont <span>{Math.round(adjustments.contrast)}%</span>
              </label>
              <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={adjustments.contrast}
                  onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
                  className="h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
          </div>
      </div>

      <div className="w-px h-8 bg-slate-700 mx-2"></div>

      <div className="flex items-center gap-2">
          <button
              onClick={() => handleChange('invert', !adjustments.invert)}
              className={`p-1.5 rounded-lg border transition-all ${adjustments.invert ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              title="Invert Colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          </button>
          <button
              onClick={() => handleChange('grayscale', !adjustments.grayscale)}
              className={`p-1.5 rounded-lg border transition-all ${adjustments.grayscale ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              title="Grayscale"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <circle cx="12" cy="12" r="10" strokeWidth="2" />
                 <path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" opacity="0.5" />
              </svg>
          </button>
      </div>

      <div className="w-px h-8 bg-slate-700 mx-2"></div>

      <button onClick={reset} className="text-[10px] text-slate-500 hover:text-cyan-400 uppercase font-bold tracking-wider">
          Reset
      </button>
    </div>
  );
};
