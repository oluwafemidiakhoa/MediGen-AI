
import React from 'react';
import { Timeframe } from '../types';

interface TimelineSliderProps {
  activeTimeframe: Timeframe;
  onChange: (time: Timeframe) => void;
  isLoading: boolean;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'ORIGINAL', label: 'Present' },
  { value: '3_MONTHS', label: '+3 Months' },
  { value: '6_MONTHS', label: '+6 Months' },
  { value: '1_YEAR', label: '+1 Year' },
];

export const TimelineSlider: React.FC<TimelineSliderProps> = ({ activeTimeframe, onChange, isLoading }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           Predictive Progression
        </h3>
        {isLoading && <span className="text-[10px] text-cyan-500 animate-pulse font-mono">SIMULATING FUTURE STATE...</span>}
      </div>
      
      <div className="relative flex items-center justify-between px-2 py-4">
         {/* Connector Line */}
         <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-700 -z-10"></div>
         
         {TIMEFRAMES.map((tf, idx) => {
            const isActive = activeTimeframe === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => onChange(tf.value)}
                disabled={isLoading}
                className="group relative flex flex-col items-center gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 
                    ${isActive 
                      ? 'bg-cyan-500 border-cyan-400 scale-125 shadow-[0_0_15px_rgba(6,182,212,0.8)]' 
                      : 'bg-slate-900 border-slate-600 hover:border-cyan-500/50'
                    }`}
                 ></div>
                 <span className={`text-[10px] font-mono uppercase transition-colors 
                    ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-500 group-hover:text-slate-300'}`}
                 >
                   {tf.label}
                 </span>
              </button>
            );
         })}
      </div>
    </div>
  );
};
