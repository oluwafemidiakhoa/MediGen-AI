
import React, { useState } from 'react';
import { RadiologyReport as ReportType } from '../types';
import { generateAudioBriefing } from '../services/geminiService';

interface RadiologyReportProps {
  report: ReportType;
  onClose: () => void;
}

export const RadiologyReport: React.FC<RadiologyReportProps> = ({ report, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const hasCriticalFindings = (text: string) => {
    const keywords = ['malignant', 'tumor', 'fracture', 'hemorrhage', 'acute', 'critical', 'metastasis', 'abnormality', 'mass'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };
  
  const isCritical = hasCriticalFindings(report.impression) || report.findings.some(hasCriticalFindings);

  const handlePlayBriefing = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const text = `Patient ID ${report.patientId}. Exam Date: ${report.date}. Findings: ${report.findings.slice(0, 3).join('. ')}. Impression: ${report.impression}.`;
      await generateAudioBriefing(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:relative print:p-0 print:bg-white print:z-auto print:block">
      <div className="bg-white text-black w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header - Hospital Style */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-4 print:border-black">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-wide flex items-center gap-3">
               <span className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center text-white print:bg-black">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
               </span>
               MediGen<span className="text-cyan-400 print:text-black">Radiology</span>
            </h1>
            <p className="text-xs uppercase tracking-widest opacity-70 mt-1">Advanced Diagnostic Imaging Center</p>
          </div>
          <div className="text-right text-sm font-mono opacity-80 print:opacity-100 flex flex-col items-end gap-1">
             <div className="print:hidden">
                <button 
                  onClick={handlePlayBriefing}
                  disabled={isPlaying}
                  className="mb-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPlaying ? 'Speaking...' : 'Play Audio Brief'}
                </button>
             </div>
             <p><strong>PID:</strong> {report.patientId}</p>
             <p><strong>DATE:</strong> {report.date}</p>
             <p><strong>MOD:</strong> {report.modality}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden print:overflow-visible">
           {/* Left: Image Panel */}
           {report.imageUrl && (
             <div className="w-full md:w-1/3 bg-black p-4 flex items-center justify-center print:w-1/3 print:border-r print:border-gray-200">
                <div className="relative w-full h-full flex flex-col items-center">
                   <img 
                      src={report.imageUrl} 
                      className="max-w-full max-h-[400px] object-contain border border-gray-700 print:border-black"
                      alt="Clinical Scan" 
                   />
                   <p className="text-white/50 text-[10px] mt-2 font-mono uppercase print:text-black print:mt-1">Source Acquisition</p>
                </div>
             </div>
           )}

           {/* Right: Text Content */}
           <div className="flex-1 p-8 space-y-6 overflow-y-auto print:overflow-visible">
            
            {isCritical && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 print:border-red-600 print:bg-transparent mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-700 font-bold uppercase">Critical Findings Detected</p>
                    <p className="text-xs text-red-600">Immediate clinical correlation recommended.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
               <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-1">Clinical Context</h3>
                  <p className="text-gray-900 text-sm leading-relaxed font-medium">{report.clinicalHistory || "Standard diagnostic protocol."}</p>
               </div>

               <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Findings</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 marker:text-slate-400">
                    {report.findings.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">{finding}</li>
                    ))}
                  </ul>
               </div>

               <div className="bg-slate-50 p-5 rounded-lg border-l-4 border-slate-400 print:bg-transparent print:border-none print:p-0">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Impression</h3>
                  <p className="text-gray-900 font-bold text-sm leading-relaxed">{report.impression}</p>
               </div>

               <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Recommendations</h3>
                  <ul className="list-decimal pl-5 space-y-1 text-sm text-gray-800 marker:text-slate-500">
                    {report.recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-relaxed">{rec}</li>
                    ))}
                  </ul>
               </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end print:mt-16">
               <div className="text-[10px] text-gray-400 print:text-gray-600 w-1/2">
                 <p>Generated by MediGen AI Engine v2.5</p>
                 <p>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
               </div>
               <div className="text-center">
                  <div className="h-px w-48 bg-black mt-8"></div>
                  <p className="text-xs text-gray-800 mt-1 uppercase font-bold tracking-wider">Radiologist Signature</p>
               </div>
            </div>
           </div>
        </div>

        {/* Footer Actions (Hide in Print) */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-end gap-3 print:hidden">
           <button 
             onClick={onClose}
             className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium text-sm transition-colors"
           >
             Close
           </button>
           <button 
             onClick={() => window.print()}
             className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-medium text-sm transition-colors shadow-lg flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" />
             </svg>
             Export to PDF
           </button>
        </div>
      </div>
    </div>
  );
};
