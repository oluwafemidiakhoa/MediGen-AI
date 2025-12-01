
import React from 'react';
import { AnatomicalStructure } from '../types';

interface StructureAnalysisProps {
  structures: AnatomicalStructure[];
  isLoading: boolean;
  onHoverStructure?: (index: number | null) => void;
}

export const StructureAnalysis: React.FC<StructureAnalysisProps> = ({ structures, isLoading, onHoverStructure }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 border border-cyan-500/20 rounded-2xl bg-slate-900/50 backdrop-blur-sm min-h-[300px]">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-mono text-sm animate-pulse">ANALYZING STRUCTURES...</p>
      </div>
    );
  }

  if (structures.length === 0) return null;

  return (
    <div className="border border-cyan-500/30 bg-slate-900/80 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      <div className="bg-cyan-950/50 border-b border-cyan-500/30 p-4 flex items-center justify-between">
        <h3 className="text-cyan-300 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Diagnostic Report
        </h3>
        <span className="text-xs text-cyan-600 font-mono">{new Date().toLocaleDateString()}</span>
      </div>
      
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {structures.map((item, idx) => (
          <div 
            key={idx} 
            className="group relative bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all duration-300 hover:bg-slate-800 cursor-pointer"
            onMouseEnter={() => onHoverStructure && onHoverStructure(idx)}
            onMouseLeave={() => onHoverStructure && onHoverStructure(null)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-cyan-300 font-bold text-sm tracking-wide">{item.name}</span>
              {item.confidence && (
                <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {item.confidence}% CONF
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-2">{item.description}</p>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
               <span className="text-[10px] text-slate-500 uppercase font-semibold">Relevance:</span>
               <span className="text-slate-300 text-xs">{item.medicalRelevance}</span>
            </div>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="bg-cyan-950/30 p-2 text-center border-t border-cyan-500/20">
         <p className="text-[10px] text-cyan-600/70">AI GENERATED ANALYSIS • VERIFY WITH PROFESSIONAL</p>
      </div>
    </div>
  );
};
