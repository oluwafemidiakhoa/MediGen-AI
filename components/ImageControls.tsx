import React from 'react';
import { ImageAdjustments } from '../types';

interface ImageControlsProps {
  adjustments: ImageAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<ImageAdjustments>>;
}

export const ImageControls: React.FC<ImageControlsProps> = ({ adjustments, setAdjustments }) => {
  
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
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-xl flex items-center justify-between gap-4 mb-4 shadow-lg overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-[10px] text-slate-500 uppercase font-bold flex justify-between">
                  Brightness <span>{adjustments.brightness}%</span>
              </label>
              <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={adjustments.brightness}
                  onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
                  className="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
          </div>
          <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-[10px] text-slate-500 uppercase font-bold flex justify-between">
                  Contrast <span>{adjustments.contrast}%</span>
              </label>
              <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={adjustments.contrast}
                  onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
                  className="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
          </div>
      </div>

      <div className="w-px h-8 bg-slate-700 mx-2"></div>

      <div className="flex items-center gap-2">
          <button
              onClick={() => handleChange('invert', !adjustments.invert)}
              className={`p-2 rounded-lg border transition-all ${adjustments.invert ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              title="Invert Colors (Negative)"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          </button>
          <button
              onClick={() => handleChange('grayscale', !adjustments.grayscale)}
              className={`p-2 rounded-lg border transition-all ${adjustments.grayscale ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'}`}
              title="Grayscale Mode"
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