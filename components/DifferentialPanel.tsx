
import React from 'react';
import { DifferentialDiagnosis } from '../types';

interface DifferentialPanelProps {
  diagnoses: DifferentialDiagnosis[];
  isLoading: boolean;
}

export const DifferentialPanel: React.FC<DifferentialPanelProps> = ({ diagnoses, isLoading }) => {
  if (isLoading) {
    return (
       <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-4 animate-pulse">
          <div className="h-4 w-1/2 bg-purple-900/30 rounded mb-4"></div>
          <div className="space-y-3">
             <div className="h-8 bg-slate-800/50 rounded"></div>
             <div className="h-8 bg-slate-800/50 rounded"></div>
             <div className="h-8 bg-slate-800/50 rounded"></div>
          </div>
       </div>
    );
  }

  if (diagnoses.length === 0) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
       <div className="flex items-center gap-2 mb-4 border-b border-purple-500/20 pb-2">
          <div className="bg-purple-500/20 p-1.5 rounded-lg text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider">Differential Diagnosis</h3>
            <p className="text-[10px] text-purple-300/50 font-mono">PROBABILISTIC ANALYSIS ENGINE</p>
          </div>
       </div>

       <div className="space-y-4">
          {diagnoses.map((diag, idx) => (
             <div key={idx} className="relative">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-slate-200 font-bold text-sm">{diag.condition}</span>
                   <span className="text-xs font-mono font-bold" style={{ color: diag.color }}>{diag.probability}%</span>
                </div>
                
                {/* Progress Bar Background */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   {/* Progress Bar Fill */}
                   <div 
                     className="h-full rounded-full transition-all duration-1000 ease-out"
                     style={{ width: `${diag.probability}%`, backgroundColor: diag.color }}
                   ></div>
                </div>
                
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{diag.reasoning}</p>
             </div>
          ))}
       </div>
    </div>
  );
};
