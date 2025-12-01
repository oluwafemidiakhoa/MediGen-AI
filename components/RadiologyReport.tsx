
import React, { useState } from 'react';
import { RadiologyReport as ReportType } from '../types';
import { generateAudioBriefing } from '../services/geminiService';

interface RadiologyReportProps {
  report: ReportType;
  onClose: () => void;
}

export const RadiologyReport: React.FC<RadiologyReportProps> = ({ report, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Simple heuristic for critical findings to display alert
  const hasCriticalFindings = (text: string) => {
    const keywords = ['malignant', 'tumor', 'fracture', 'hemorrhage', 'acute', 'critical', 'metastasis', 'abnormality', 'mass'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };
  
  const isCritical = hasCriticalFindings(report.impression) || report.findings.some(hasCriticalFindings);

  const handlePlayBriefing = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      // Construct summary
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
      <div className="bg-white text-black w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-wide">MediGen<span className="text-cyan-400 print:text-black">Radiology</span></h1>
            <p className="text-xs uppercase tracking-widest opacity-70">Diagnostic Imaging Center</p>
          </div>
          <div className="text-right text-sm opacity-80 print:opacity-100 flex flex-col items-end gap-2">
            <div>
              <p><strong>Patient ID:</strong> {report.patientId}</p>
              <p><strong>Date:</strong> {report.date}</p>
              <p><strong>Modality:</strong> {report.modality}</p>
            </div>
            {/* Audio Button - Hide in Print */}
            <button 
              onClick={handlePlayBriefing}
              disabled={isPlaying}
              className="mt-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 print:hidden"
            >
              {isPlaying ? (
                <>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  Speaking...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Play Briefing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 print:overflow-visible">
          
          {isCritical && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 print:border-red-600 print:bg-transparent mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-bold uppercase">Critical Findings Detected</p>
                  <p className="text-xs text-red-600">Immediate clinical correlation recommended.</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Clinical Context</h3>
            <p className="text-gray-800">{report.clinicalHistory || "No clinical history provided."}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Findings</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-800">
              {report.findings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Impression</h3>
            <p className="text-gray-900 font-medium leading-relaxed">{report.impression}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Recommendations</h3>
            <ul className="list-decimal pl-5 space-y-1 text-gray-800">
              {report.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end print:mt-20">
             <div className="text-xs text-gray-400 print:text-gray-600">
               <p>Generated by MediGen AI Engine v2.5</p>
               <p>Disclaimer: Not for clinical use. Verified by _______________</p>
             </div>
             <div className="text-center">
                <div className="h-px w-40 bg-gray-400 mt-8"></div>
                <p className="text-xs text-gray-500 mt-1 uppercase">Radiologist Signature</p>
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
             Print Report
           </button>
        </div>
      </div>
    </div>
  );
};
