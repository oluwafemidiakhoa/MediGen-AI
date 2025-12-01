
import React from 'react';
import { SurgicalPlan as SurgicalPlanType } from '../types';

interface SurgicalPlanProps {
  plan: SurgicalPlanType;
  onClose: () => void;
}

export const SurgicalPlan: React.FC<SurgicalPlanProps> = ({ plan, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in-down">
      <div className="bg-[#0b1120] border border-cyan-500/50 w-full max-w-4xl rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-cyan-950/50 p-6 border-b border-cyan-500/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
             </div>
             <div>
               <h2 className="text-xl font-tech text-white tracking-wide">Surgical Protocol</h2>
               <p className="text-xs text-cyan-400 uppercase tracking-widest">{plan.procedureName}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                 <h3 className="text-sm text-slate-500 uppercase font-bold mb-2">Anesthesia</h3>
                 <p className="text-cyan-300 font-mono text-lg">{plan.anesthesiaType}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                 <h3 className="text-sm text-slate-500 uppercase font-bold mb-2">Positioning</h3>
                 <p className="text-cyan-300 font-mono text-lg">{plan.patientPositioning}</p>
              </div>
           </div>

           <div className="mb-8">
              <h3 className="text-cyan-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                 Procedural Steps
              </h3>
              <div className="space-y-3">
                 {plan.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-xl hover:border-cyan-500/30 transition-colors group">
                       <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-cyan-400 font-bold font-mono group-hover:bg-cyan-900/50 group-hover:border-cyan-500">
                          {idx + 1}
                       </div>
                       <p className="text-slate-300 leading-relaxed">{step}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div>
              <h3 className="text-red-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
                 Risk Factors
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {plan.risks.map((risk, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-red-200/70">
                       <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full"></span>
                       {risk}
                    </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};
