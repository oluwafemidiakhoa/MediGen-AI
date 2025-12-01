import React from 'react';

export const ScanningOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-30">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
      
      {/* Moving Scan Line */}
      <div className="absolute top-0 left-0 w-full h-[5px] bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-[scan_3s_linear_infinite]"></div>
      
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg"></div>

      {/* Tech Text */}
      <div className="absolute bottom-6 right-6 font-mono text-xs text-cyan-400 animate-pulse">
        SCANNING ANATOMY...
      </div>
    </div>
  );
};
