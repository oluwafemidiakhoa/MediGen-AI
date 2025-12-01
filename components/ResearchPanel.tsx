
import React from 'react';
import { MedicalResearch } from '../types';

interface ResearchPanelProps {
  research: MedicalResearch;
  onClose: () => void;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ research, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0b1120]/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl z-50 animate-fade-in-down transform transition-transform overflow-hidden flex flex-col">
      <div className="p-5 border-b border-cyan-500/20 bg-cyan-950/20 flex justify-between items-center">
        <div>
          <h2 className="text-cyan-400 font-tech text-lg tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Medical Research
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PubMed & Clinical Literature</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Topic Header */}
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
           <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Query Subject</span>
           <span className="text-white font-medium">{research.topic}</span>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
            Executive Summary
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed text-justify">
            {research.summary}
          </p>
        </div>

        {/* Treatment Protocols */}
        <div>
          <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Standard Protocols
          </h3>
          <ul className="space-y-2">
            {research.treatmentProtocols.map((protocol, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-900/30 p-2 rounded border border-slate-800">
                <span className="text-emerald-500 font-mono font-bold">{idx + 1}.</span>
                {protocol}
              </li>
            ))}
          </ul>
        </div>

        {/* Citations */}
        <div>
          <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            Citations
          </h3>
          <div className="space-y-3">
            {research.citations.map((cite, idx) => (
              <a 
                key={idx} 
                href={cite.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/50 p-3 rounded-lg transition-all"
              >
                <p className="text-sm font-medium text-slate-200 group-hover:text-white leading-tight mb-2">
                  {cite.title}
                </p>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">{cite.source}</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500 group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
         <p className="text-[10px] text-slate-500">
            Powered by Gemini 2.5 • Verified Sources via Google Search Grounding
         </p>
      </div>
    </div>
  );
};
