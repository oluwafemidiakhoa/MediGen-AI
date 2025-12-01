
import React, { useState, useEffect } from 'react';
import { MedicalResearch } from '../types';

interface ResearchPanelProps {
  research: MedicalResearch;
  onClose: () => void;
  onRefineSearch: (term: string) => void;
  isLoading?: boolean;
}

type Tab = 'AI_ANALYSIS' | 'LITERATURE' | 'CLINICAL_TRIALS' | 'PATIENT_ED' | 'RX_SAFETY';

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ research, onClose, onRefineSearch, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('AI_ANALYSIS');
  const [searchTerm, setSearchTerm] = useState(research.searchQuery || research.topic);

  useEffect(() => {
    setSearchTerm(research.searchQuery || research.topic);
  }, [research]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onRefineSearch(searchTerm);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#0b1120]/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl z-50 animate-fade-in-down transform transition-transform overflow-hidden flex flex-col">
      <div className="p-5 border-b border-cyan-500/20 bg-cyan-950/20 flex justify-between items-center">
        <div>
          <h2 className="text-cyan-400 font-tech text-lg tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Research Intelligence
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Multi-Source Verification</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Manual Search Bar */}
      <div className="p-3 bg-slate-900 border-b border-cyan-500/10">
         <form onSubmit={handleSearch} className="flex gap-2">
           <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none font-mono"
              placeholder="Refine search term (e.g., Pneumonia)..."
           />
           <button 
              type="submit" 
              disabled={isLoading}
              className="bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-bold uppercase transition-colors"
           >
              {isLoading ? '...' : 'Search'}
           </button>
         </form>
         {research.searchQuery && (
           <p className="text-[10px] text-slate-500 mt-1 px-1">
             Active term: <span className="text-cyan-500 font-bold">{research.searchQuery}</span>
           </p>
         )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyan-500/20 bg-slate-900/50 overflow-x-auto custom-scrollbar">
        <button 
           onClick={() => setActiveTab('AI_ANALYSIS')}
           className={`flex-1 min-w-[60px] py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'AI_ANALYSIS' ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Summary
        </button>
        <button 
           onClick={() => setActiveTab('LITERATURE')}
           className={`flex-1 min-w-[60px] py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'LITERATURE' ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Papers
        </button>
        <button 
           onClick={() => setActiveTab('CLINICAL_TRIALS')}
           className={`flex-1 min-w-[60px] py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'CLINICAL_TRIALS' ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Trials
        </button>
        <button 
           onClick={() => setActiveTab('PATIENT_ED')}
           className={`flex-1 min-w-[60px] py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'PATIENT_ED' ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          NIH
        </button>
        <button 
           onClick={() => setActiveTab('RX_SAFETY')}
           className={`flex-1 min-w-[60px] py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'RX_SAFETY' ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          FDA
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/30">
        
        {/* AI Analysis Tab */}
        {activeTab === 'AI_ANALYSIS' && (
          <div className="space-y-6 animate-fade-in-down">
             <div>
                <h3 className="text-cyan-400 uppercase tracking-widest font-bold mb-2 text-sm">Condition Overview</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{research.summary}</p>
             </div>

             <div>
                <h3 className="text-cyan-400 uppercase tracking-widest font-bold mb-2 text-sm">Standard Protocols</h3>
                <ul className="space-y-2">
                   {research.treatmentProtocols.map((tp, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                         <span className="text-cyan-500 font-bold">•</span>
                         {tp}
                      </li>
                   ))}
                </ul>
             </div>
          </div>
        )}

        {/* PubMed Literature Tab */}
        {activeTab === 'LITERATURE' && (
           <div className="space-y-4 animate-fade-in-down">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-cyan-400 uppercase tracking-widest font-bold text-sm flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                   Scientific Literature
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 rounded">PubMed API</span>
              </div>
              
              {research.pubMedPapers && research.pubMedPapers.length > 0 ? (
                 research.pubMedPapers.map((paper) => (
                    <div key={paper.uid} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-cyan-500/30 transition-colors">
                       <h4 className="text-slate-200 font-bold text-sm mb-2 leading-snug">{paper.title}</h4>
                       <div className="flex flex-col gap-1 mb-3">
                          <p className="text-[10px] text-cyan-400 font-bold uppercase">{paper.source} <span className="text-slate-500">• {paper.pubdate}</span></p>
                          <p className="text-[10px] text-slate-400 italic truncate">{paper.authors.join(', ')}</p>
                       </div>
                       <a 
                          href={paper.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
                       >
                          Read on PubMed <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                       </a>
                    </div>
                 ))
              ) : (
                 <div className="text-center p-8 border border-slate-700/50 border-dashed rounded-xl">
                    <p className="text-slate-500 text-sm">No recent papers found via PubMed.</p>
                 </div>
              )}
           </div>
        )}

        {/* Clinical Trials Tab */}
        {activeTab === 'CLINICAL_TRIALS' && (
           <div className="space-y-4 animate-fade-in-down">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-cyan-400 uppercase tracking-widest font-bold text-sm flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   Live Recruiting Data
                 </h3>
                 <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 rounded">ClinicalTrials.gov</span>
              </div>
              
              {research.clinicalTrials && research.clinicalTrials.length > 0 ? (
                 research.clinicalTrials.map((trial) => (
                    <div key={trial.nctId} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-green-500/30 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${trial.status === 'RECRUITING' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                             {trial.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{trial.nctId}</span>
                       </div>
                       <h4 className="text-slate-200 font-bold text-sm mb-2">{trial.title}</h4>
                       <div className="flex flex-wrap gap-2 mb-3">
                          {trial.conditions.slice(0, 3).map((c, i) => (
                             <span key={i} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded-full">
                                {c}
                             </span>
                          ))}
                       </div>
                       <a 
                          href={trial.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
                       >
                          View Study
                       </a>
                    </div>
                 ))
              ) : (
                 <div className="text-center p-8 border border-slate-700/50 border-dashed rounded-xl">
                    <p className="text-slate-500 text-sm">No active recruiting trials found. Try refining the search term.</p>
                 </div>
              )}
           </div>
        )}

        {/* Patient Ed Tab */}
        {activeTab === 'PATIENT_ED' && (
           <div className="space-y-4 animate-fade-in-down">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-cyan-400 uppercase tracking-widest font-bold text-sm">NIH Resources</h3>
                 <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 rounded">MedlinePlus</span>
              </div>
              
              {research.patientResources && research.patientResources.length > 0 ? (
                 research.patientResources.map((res, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-cyan-500/30 transition-colors">
                       <h4 className="text-slate-200 font-bold text-sm mb-1">{res.title}</h4>
                       <p className="text-xs text-slate-400 mb-3 line-clamp-2">{res.summary}</p>
                       <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                       >
                          Read Official Guide
                       </a>
                    </div>
                 ))
              ) : (
                 <div className="text-center p-8 border border-slate-700/50 border-dashed rounded-xl">
                    <p className="text-slate-500 text-sm">No specific patient guides found.</p>
                 </div>
              )}
           </div>
        )}

        {/* FDA Drug Data Tab */}
        {activeTab === 'RX_SAFETY' && (
           <div className="space-y-4 animate-fade-in-down">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-cyan-400 uppercase tracking-widest font-bold text-sm">Approved Medications</h3>
                 <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 rounded">openFDA</span>
              </div>
              
              {research.drugLabels && research.drugLabels.length > 0 ? (
                 research.drugLabels.map((drug, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-purple-500/30 transition-colors">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="text-slate-200 font-bold text-sm">{drug.brand_name}</h4>
                          <span className="text-[9px] text-slate-500 font-mono uppercase bg-slate-900 px-1 rounded">Rx Only</span>
                       </div>
                       <p className="text-xs text-purple-400 font-bold mb-2">{drug.generic_name}</p>
                       <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div>
                             <span className="block text-slate-500 uppercase font-bold text-[9px]">Class</span>
                             {drug.pharm_class_epc}
                          </div>
                          <div>
                             <span className="block text-slate-500 uppercase font-bold text-[9px]">Manufacturer</span>
                             {drug.manufacturer_name}
                          </div>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="text-center p-8 border border-slate-700/50 border-dashed rounded-xl">
                    <p className="text-slate-500 text-sm">No specific FDA labeling data found for this term.</p>
                 </div>
              )}
           </div>
        )}

      </div>
      
      <div className="p-3 bg-cyan-950/20 border-t border-cyan-500/20 text-center">
         <p className="text-[9px] text-slate-500 font-mono">Confidential • For Research Use Only</p>
      </div>
    </div>
  );
};
