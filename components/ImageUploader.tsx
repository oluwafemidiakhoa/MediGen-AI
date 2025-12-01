
import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  onImageSelect: (image: ImageFile) => void;
  selectedImage: ImageFile | null;
  onLoadDemo?: () => void; // New prop
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, selectedImage, onLoadDemo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelect({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: e.target.result as string,
          mimeType: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      
      {!selectedImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300
            flex flex-col items-center justify-center gap-4 group h-80
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01] shadow-xl shadow-cyan-500/20' 
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60'
            }
          `}
        >
          <div className={`p-5 rounded-2xl bg-slate-800 shadow-inner group-hover:scale-110 transition-transform duration-300 ${isDragging ? 'bg-cyan-600' : ''}`}>
            {/* Medical File Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDragging ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-2 z-10">
            <p className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">
              Upload Scan or Sketch
            </p>
            <p className="text-sm text-slate-500">
              Drag & drop MRI, CT, X-Ray or medical drawings
            </p>
          </div>
        </div>
      ) : (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl h-80">
          <img 
            src={selectedImage.previewUrl} 
            alt="Original" 
            className="w-full h-full object-contain mx-auto opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
             <div className="flex gap-3 justify-center">
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium transition-all text-sm border border-white/10"
               >
                  Replace Scan
               </button>
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageSelect(null as any);
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md text-red-200 px-4 py-2 rounded-lg font-medium transition-all text-sm border border-red-500/20"
               >
                  Remove
               </button>
             </div>
          </div>
        </div>
      )}

      {!selectedImage && onLoadDemo && (
         <button 
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo();
            }}
            className="w-full py-3 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-900/20 text-cyan-400 text-xs font-bold uppercase tracking-widest transition-all hover:border-cyan-500/60"
         >
            Load Demo Case (Chest X-Ray)
         </button>
      )}
    </div>
  );
};
