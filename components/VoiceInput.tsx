import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isListening, setIsListening }) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
             onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onTranscript, setIsListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (!recognitionRef.current) {
    return null; 
  }

  return (
    <button
      onClick={toggleListening}
      className={`
        absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 flex items-center gap-2
        ${isListening 
          ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] pr-4' 
          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-cyan-400 hover:border-cyan-500/50'
        }
      `}
      title="Dictate Prompt"
    >
      <div className={`relative ${isListening ? 'animate-pulse' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {isListening && (
           <span className="absolute -top-1 -right-1 flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
           </span>
        )}
      </div>
      {isListening && <span className="text-xs font-mono font-bold">REC</span>}
    </button>
  );
};