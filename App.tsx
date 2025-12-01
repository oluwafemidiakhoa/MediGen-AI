
import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ImageCompare } from './components/ImageCompare';
import { StructureAnalysis } from './components/StructureAnalysis';
import { ScanningOverlay } from './components/ScanningOverlay';
import { VoiceInput } from './components/VoiceInput';
import { ImageControls } from './components/ImageControls';
import { HoloViewer } from './components/HoloViewer';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { SmartLabelOverlay } from './components/SmartLabelOverlay';
import { MedicalChat } from './components/MedicalChat';
import { RadiologyReport } from './components/RadiologyReport';
import { SurgicalPlan } from './components/SurgicalPlan';
import { AppStatus, ImageFile, ImageAdjustments, AppMode, AnatomicalStructure, RadiologyReport as RadiologyReportType, SurgicalPlan as SurgicalPlanType } from './types';
import { editImage, analyzeImage, generateMedicalVideo, generateRadiologyReport, generateHealthyReference, generateSurgicalPlan } from './services/geminiService';

// Removed conflicting global declaration. Using local interface and casting instead.
interface AIStudioClient {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

const EXAMPLE_PROMPT = `Convert this rough sketch into a high-fidelity, 3D anatomical render of the human heart. Show detailed texturing of the myocardium, aorta, and vena cava. Use realistic studio lighting.`;

const QUICK_STYLES = [
  { label: "🧬 3D Anatomy", prompt: "Hyper-realistic 3D anatomical render, studio lighting, detailed texture, educational", settings: {} },
  { label: "🩻 MRI Scan", prompt: "MRI scan aesthetic, black and white, high contrast cross-section, radiological imaging style", settings: { grayscale: true, contrast: 120 } },
  { label: "🦴 X-Ray", prompt: "X-ray radiograph style, inverted colors, skeletal structure visualization, blueish tint", settings: { invert: true, grayscale: true, brightness: 110 } },
  { label: "✏️ Illustration", prompt: "Medical vector illustration, clean lines, flat educational colors, white background", settings: { brightness: 105 } },
  { label: "🔬 Microscopic", prompt: "Electron microscope view, cellular level detail, scientific visualization, depth of field", settings: { contrast: 110 } },
];

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [healthyImageUrl, setHealthyImageUrl] = useState<string | null>(null); // For Patient Education Mode
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Smart Labels (Coordinates)
  const [showSmartLabels, setShowSmartLabels] = useState(false);
  const [structures, setStructures] = useState<AnatomicalStructure[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.SCAN_2D);
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Advanced Features
  const [report, setReport] = useState<RadiologyReportType | null>(null);
  const [surgicalPlan, setSurgicalPlan] = useState<SurgicalPlanType | null>(null);
  const [viewMode, setViewMode] = useState<'GENERATED' | 'HEALTHY'>('GENERATED');

  // Image PACS Adjustments
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    invert: false,
    grayscale: false
  });

  // Check API Key for Veo
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio as AIStudioClient | undefined;
      if (aistudio && await aistudio.hasSelectedApiKey()) {
        setApiKeyVerified(true);
      }
    };
    checkKey();
  }, []);

  const handleUnlock3D = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        if (await aistudio.hasSelectedApiKey()) {
          setApiKeyVerified(true);
        }
      } catch (e) {
        console.error("Key selection failed", e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;

    setStatus(AppStatus.LOADING);
    setStructures([]);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setHealthyImageUrl(null);
    setIsAnalyzing(true);
    setIsAnnotating(false);
    setShowSmartLabels(false);
    setViewMode('GENERATED');
    setReport(null);
    setSurgicalPlan(null);

    try {
      if (mode === AppMode.SCAN_2D) {
        // 2D Generation
        const imagePromise = editImage(originalImage.base64, originalImage.mimeType, prompt);
        const generatedImage = await imagePromise;
        setGeneratedImageUrl(generatedImage);
        setStatus(AppStatus.SUCCESS);

        // Analyze the *Generated* image (Pass 2) for better accuracy
        const analysisPromise = analyzeImage(generatedImage, "image/png");
        const analysisData = await analysisPromise;
        setStructures(analysisData);
        setIsAnalyzing(false);

      } else {
        // 3D Video Generation
        const videoUrl = await generateMedicalVideo(prompt, originalImage.base64, originalImage.mimeType);
        setGeneratedVideoUrl(videoUrl);
        
        // Analyze original image for context while video generates
        const analysisData = await analyzeImage(originalImage.base64, originalImage.mimeType);
        setStructures(analysisData);
        
        setStatus(AppStatus.SUCCESS);
        setIsAnalyzing(false);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Processing failed. Please try again.');
      setStatus(AppStatus.ERROR);
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!generatedImageUrl || !originalImage) return;
    setIsAnalyzing(true);
    try {
      const reportData = await generateRadiologyReport(generatedImageUrl, "image/png", prompt);
      setReport(reportData);
    } catch (e) {
      console.error(e);
      setError("Failed to generate report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateSurgicalPlan = async () => {
     if (!generatedImageUrl || structures.length === 0) return;
     setIsAnalyzing(true);
     try {
       // Create context from structures
       const findings = structures.map(s => s.name + ': ' + s.description).join('. ');
       const plan = await generateSurgicalPlan(generatedImageUrl, "image/png", findings);
       setSurgicalPlan(plan);
     } catch(e) {
       console.error(e);
       setError("Failed to generate surgical plan.");
     } finally {
       setIsAnalyzing(false);
     }
  };

  const handlePatientEducationMode = async () => {
    if (!originalImage) return;
    if (healthyImageUrl) {
      setViewMode('HEALTHY');
      return;
    }

    setStatus(AppStatus.LOADING);
    try {
      const healthyImage = await generateHealthyReference(originalImage.base64, originalImage.mimeType);
      setHealthyImageUrl(healthyImage);
      setViewMode('HEALTHY');
      setStatus(AppStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setError("Failed to generate healthy reference.");
      setStatus(AppStatus.ERROR);
    }
  };

  // Voice Command Parsing
  const handleVoiceTranscript = (text: string) => {
    const lower = text.toLowerCase();
    
    // Command Parsing
    if (lower.includes('invert')) {
      setAdjustments(prev => ({ ...prev, invert: !prev.invert }));
      return;
    }
    if (lower.includes('grayscale') || lower.includes('black and white')) {
      setAdjustments(prev => ({ ...prev, grayscale: !prev.grayscale }));
      return;
    }
    if (lower.includes('reset')) {
      setAdjustments({ brightness: 100, contrast: 100, invert: false, grayscale: false });
      return;
    }
    if (lower.includes('enhance') || lower.includes('brightness up')) {
      setAdjustments(prev => ({ ...prev, brightness: Math.min(prev.brightness + 10, 150) }));
      return;
    }
    if (lower.includes('darken') || lower.includes('brightness down')) {
      setAdjustments(prev => ({ ...prev, brightness: Math.max(prev.brightness - 10, 50) }));
      return;
    }
    if (lower.includes('contrast up')) {
      setAdjustments(prev => ({ ...prev, contrast: Math.min(prev.contrast + 10, 150) }));
      return;
    }
    if (lower.includes('generate report') || lower.includes('create report')) {
      handleGenerateReport();
      return;
    }
    if (lower.includes('labels') || lower.includes('show labels')) {
      setShowSmartLabels(true);
      return;
    }
    if (lower.includes('hide labels')) {
      setShowSmartLabels(false);
      return;
    }
    if (lower.includes('patient mode') || lower.includes('healthy')) {
      handlePatientEducationMode();
      return;
    }
    if (lower.includes('surgical') || lower.includes('plan')) {
      handleGenerateSurgicalPlan();
      return;
    }
    if (lower.includes('back to scan') || lower.includes('original view')) {
      setViewMode('GENERATED');
      return;
    }

    // Default: Append text to prompt
    setPrompt(prev => prev ? prev + ' ' + text : text);
  };

  const applyStyle = (style: any) => {
    if (!prompt.includes(style.prompt)) {
       setPrompt(prev => prev ? `${prev}, ${style.prompt}` : style.prompt);
    }
    if (style.settings && Object.keys(style.settings).length > 0) {
      setAdjustments(prev => ({ ...prev, ...style.settings }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden font-sans print:bg-white print:text-black">
      {/* Background Decor (Hide in Print) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-900/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-teal-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-[#0b1120]/80 backdrop-blur-xl sticky top-0 z-50 print:relative print:border-b-2 print:border-black print:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="relative print:hidden">
               <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 animate-pulse"></div>
               <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-900 to-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
               </div>
            </div>
            <div>
               <h1 className="font-tech font-bold text-2xl tracking-wider text-white print:text-black">MediGen<span className="text-cyan-400 print:text-black">AI</span></h1>
               <p className="text-[10px] text-cyan-600 font-mono tracking-widest uppercase print:text-gray-600">Advanced Diagnostic Visualization</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 print:hidden">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs text-slate-400 font-mono">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 print:py-0">
        <div className="grid lg:grid-cols-12 gap-8 items-start print:block">
          
          {/* Left Column: Input Panel (4 cols) - Hide on Print */}
          <div className="lg:col-span-4 space-y-6 print:hidden">
            
            {/* Step 1: Upload */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                01. Input Source
              </h2>
              <ImageUploader 
                onImageSelect={(img) => {
                  setOriginalImage(img);
                  setGeneratedImageUrl(null);
                  setGeneratedVideoUrl(null);
                  setStructures([]);
                  setReport(null);
                  setSurgicalPlan(null);
                }} 
                selectedImage={originalImage} 
              />
            </div>

            {/* Step 2: Controls */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
              <div className="flex justify-between items-center">
                 <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                  02. Configuration
                </h2>
                {prompt && (
                  <button onClick={() => setPrompt('')} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider">Reset</button>
                )}
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
                <button
                  onClick={() => setMode(AppMode.SCAN_2D)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === AppMode.SCAN_2D ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  2D Scan
                </button>
                <button
                  onClick={() => setMode(AppMode.HOLO_3D)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === AppMode.HOLO_3D ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  3D Hologram
                </button>
              </div>

              {/* Prompt Input with Voice */}
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={mode === AppMode.HOLO_3D ? "Describe 3D structure movement..." : "Describe anatomy or dictate command (e.g., 'Invert', 'Generate Report')..."}
                  className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none h-32 text-sm leading-relaxed font-mono transition-all pr-12"
                />
                <VoiceInput 
                  isListening={isListening} 
                  setIsListening={setIsListening}
                  onTranscript={handleVoiceTranscript}
                />
                {!isListening && !prompt && (
                   <button 
                      onClick={() => setPrompt(EXAMPLE_PROMPT)}
                      className="absolute bottom-3 left-3 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors"
                    >
                      Load Example
                  </button>
                )}
              </div>

              {/* Action Button & API Check */}
              {mode === AppMode.HOLO_3D && !apiKeyVerified ? (
                 <Button
                   onClick={handleUnlock3D}
                   className="w-full text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-purple-400/20 h-14 bg-gradient-to-r from-purple-600 to-indigo-600"
                 >
                   Unlock 3D Generation
                 </Button>
              ) : (
                <Button 
                  onClick={handleGenerate}
                  isLoading={status === AppStatus.LOADING}
                  disabled={!originalImage || !prompt.trim()}
                  className={`w-full text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-400/20 h-14 
                    ${mode === AppMode.HOLO_3D ? 'bg-gradient-to-r from-purple-600 to-cyan-600' : 'bg-gradient-to-r from-cyan-600 to-teal-600'}`}
                >
                  {status === AppStatus.LOADING ? (
                    <span className="font-mono tracking-wider">
                      {mode === AppMode.HOLO_3D ? 'RENDERING VIDEO...' : 'PROCESSING...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      {mode === AppMode.HOLO_3D ? 'GENERATE HOLOGRAM' : 'INITIATE SCAN'}
                    </span>
                  )}
                </Button>
              )}
               {error && (
                  <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-200 text-xs flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
            </div>
            
             {/* Quick Styles (Only 2D for now) */}
             {mode === AppMode.SCAN_2D && (
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 shadow-xl">
                 <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Processing Presets</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_STYLES.map((style) => (
                      <button
                        key={style.label}
                        onClick={() => applyStyle(style)}
                        className="px-3 py-2 bg-slate-800/50 hover:bg-cyan-900/30 border border-slate-700 hover:border-cyan-700/50 rounded-lg text-xs text-left text-slate-300 hover:text-cyan-200 transition-all duration-200 active:scale-95 group"
                      >
                        <span className="block font-medium group-hover:translate-x-1 transition-transform">{style.label}</span>
                      </button>
                    ))}
                  </div>
              </div>
             )}
             
             {/* AI Assistant Toggle */}
             {generatedImageUrl && (
               <button 
                 onClick={() => setShowChat(!showChat)}
                 className="w-full bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/30 p-4 rounded-xl flex items-center justify-between group transition-all"
               >
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-white transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                     </svg>
                   </div>
                   <div className="text-left">
                     <div className="text-sm font-bold text-indigo-300 group-hover:text-white">Ask Diagnostic AI</div>
                     <div className="text-[10px] text-indigo-400/70">Chat about this scan</div>
                   </div>
                 </div>
                 <div className={`transform transition-transform ${showChat ? 'rotate-180' : ''}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                 </div>
               </button>
             )}
             
             {showChat && generatedImageUrl && (
                <div className="animate-fade-in-down">
                  <MedicalChat generatedImageBase64={generatedImageUrl} mimeType="image/png" />
                </div>
             )}
          </div>

          {/* Right Column: Visualization & Data (8 cols) */}
          <div className="lg:col-span-8 space-y-6 print:col-span-12 print:space-y-4">
             <div className="flex items-center justify-between print:hidden">
                <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                  03. Visualization Output
                </h2>
                
                <div className="flex gap-2">
                  {/* Patient Education Mode Toggle */}
                  {generatedImageUrl && mode === AppMode.SCAN_2D && (
                     <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex mr-2">
                        <button 
                           onClick={() => setViewMode('GENERATED')}
                           className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${viewMode === 'GENERATED' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                           Pathology
                        </button>
                        <button 
                           onClick={handlePatientEducationMode}
                           className={`px-3 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-1 ${viewMode === 'HEALTHY' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                           {viewMode !== 'HEALTHY' && !healthyImageUrl && status === AppStatus.LOADING ? (
                             <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                           ) : (
                             <span>Healthy Ref</span>
                           )}
                        </button>
                     </div>
                  )}

                  {/* Smart Labels Toggle (Coordinates) */}
                   {generatedImageUrl && mode === AppMode.SCAN_2D && viewMode === 'GENERATED' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSmartLabels(!showSmartLabels);
                        setIsAnnotating(false);
                      }}
                       className={`!py-1.5 !px-4 !text-xs font-mono uppercase tracking-wider flex items-center gap-2 ${showSmartLabels ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'border-slate-600 text-slate-400'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {showSmartLabels ? 'Hide Labels' : 'Smart Labels'}
                    </Button>
                  )}

                  {/* Manual Annotation Toggle */}
                  {generatedImageUrl && mode === AppMode.SCAN_2D && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsAnnotating(!isAnnotating);
                        setShowSmartLabels(false);
                      }}
                      className={`!py-1.5 !px-4 !text-xs font-mono uppercase tracking-wider flex items-center gap-2 ${isAnnotating ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'border-slate-600 text-slate-400'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {isAnnotating ? 'Close Draw' : 'Draw'}
                    </Button>
                  )}
                  
                  {/* Action Buttons Group */}
                   {generatedImageUrl && mode === AppMode.SCAN_2D && (
                      <div className="flex gap-2">
                        <Button
                           variant="outline"
                           onClick={handleGenerateSurgicalPlan}
                           className="!py-1.5 !px-4 !text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                           </svg>
                           Surgery Plan
                        </Button>
                        <Button
                           variant="outline"
                           onClick={handleGenerateReport}
                           className="!py-1.5 !px-4 !text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           Draft Report
                        </Button>
                      </div>
                   )}
                </div>
             </div>
            
            <div className="grid lg:grid-cols-3 gap-6 print:block">
              {/* Main Visualizer (Takes up 2/3) */}
              <div className="lg:col-span-2 print:mb-8">
                
                {generatedImageUrl && mode === AppMode.SCAN_2D && !isAnnotating && !showSmartLabels && (
                   <div className="print:hidden">
                      <ImageControls adjustments={adjustments} setAdjustments={setAdjustments} />
                   </div>
                )}

                <div className={`
                  relative min-h-[500px] h-full rounded-2xl border bg-black/40 overflow-hidden shadow-2xl transition-all duration-500 flex flex-col
                  ${(generatedImageUrl || generatedVideoUrl) ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border-slate-800 border-dashed'}
                  print:border-none print:shadow-none print:bg-white print:min-h-0
                `}>
                  
                  {/* Empty State */}
                  {!generatedImageUrl && !generatedVideoUrl && status !== AppStatus.LOADING && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center print:hidden">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6">
                          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-slate-300 font-tech text-lg mb-2 tracking-wide">AWAITING INPUT</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Upload source material to begin anatomical reconstruction.</p>
                    </div>
                  )}

                  {/* Loading State with Scanner */}
                  {status === AppStatus.LOADING && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                      <ScanningOverlay />
                      {mode === AppMode.HOLO_3D && (
                        <p className="mt-8 text-cyan-400 font-mono text-xs animate-pulse">GENERATING VOLUMETRIC DATA... (THIS MAY TAKE A MOMENT)</p>
                      )}
                      {viewMode === 'HEALTHY' && !healthyImageUrl && (
                        <p className="mt-8 text-green-400 font-mono text-xs animate-pulse">SYNTHESIZING HEALTHY REFERENCE MODEL...</p>
                      )}
                    </div>
                  )}

                  {/* Success State: 2D */}
                  {generatedImageUrl && mode === AppMode.SCAN_2D && originalImage && (
                    <div className="flex-1 relative print:block h-full">
                      <div className="print:hidden h-full">
                        {isAnnotating ? (
                           <AnnotationCanvas 
                              imageUrl={viewMode === 'HEALTHY' && healthyImageUrl ? healthyImageUrl : generatedImageUrl} 
                              onSave={(newUrl) => {
                                setGeneratedImageUrl(newUrl);
                                setIsAnnotating(false);
                              }}
                              onCancel={() => setIsAnnotating(false)}
                           />
                        ) : showSmartLabels ? (
                           <div className="relative w-full h-full">
                              <SmartLabelOverlay structures={structures} imageUrl={generatedImageUrl} />
                           </div>
                        ) : (
                           <ImageCompare 
                              beforeImage={originalImage.previewUrl}
                              afterImage={viewMode === 'HEALTHY' && healthyImageUrl ? healthyImageUrl : generatedImageUrl}
                              adjustments={adjustments}
                           />
                        )}
                      </div>
                      
                      {/* Print View: Show Side by Side */}
                      <div className="hidden print:grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-xs font-bold uppercase mb-2 text-gray-500">Original Source</p>
                            <img src={originalImage.previewUrl} className="w-full rounded border border-gray-200" alt="Original" />
                         </div>
                         <div>
                            <p className="text-xs font-bold uppercase mb-2 text-cyan-600">MediGen Analysis</p>
                            <img src={generatedImageUrl} className="w-full rounded border border-gray-200" alt="Generated" />
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Success State: 3D Video */}
                  {generatedVideoUrl && mode === AppMode.HOLO_3D && (
                     <div className="flex-1 relative w-full h-full min-h-[500px]">
                        <HoloViewer videoUrl={generatedVideoUrl} />
                     </div>
                  )}
                  
                  {/* Status Footer inside Image Area */}
                  <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-500 font-mono uppercase print:hidden">
                     <span>Res: {mode === AppMode.HOLO_3D ? '720p HQ' : '1024x1024'}</span>
                     <span>Mode: {viewMode === 'HEALTHY' ? 'PATIENT EDUCATION (SYNTHETIC)' : (mode === AppMode.HOLO_3D ? 'Volumetric VR' : (isAnnotating ? 'Drawing Tool' : (showSmartLabels ? 'Smart Labels' : 'Comparison')))}</span>
                  </div>
                </div>
              </div>

              {/* Data Panel (Takes up 1/3) */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                  <StructureAnalysis structures={structures} isLoading={isAnalyzing} />
                  
                  {/* Placeholder for when no analysis yet */}
                  {!isAnalyzing && structures.length === 0 && (
                     <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 flex flex-col items-center justify-center text-center opacity-50 print:hidden">
                        <svg className="w-12 h-12 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">No Data Available</p>
                     </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {report && (
          <RadiologyReport report={report} onClose={() => setReport(null)} />
        )}

        {/* Surgical Plan Modal */}
        {surgicalPlan && (
          <SurgicalPlan plan={surgicalPlan} onClose={() => setSurgicalPlan(null)} />
        )}

      </main>
    </div>
  );
};

export default App;
