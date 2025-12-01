
import React, { useState, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ImageCompare } from './components/ImageCompare';
import { SynchronizedCompare } from './components/SynchronizedCompare';
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
import { ResearchPanel } from './components/ResearchPanel';
import { Magnifier } from './components/Magnifier';
import { TimelineSlider } from './components/TimelineSlider';
import { DifferentialPanel } from './components/DifferentialPanel';
import { AppStatus, ImageFile, ImageAdjustments, AppMode, AnatomicalStructure, RadiologyReport as RadiologyReportType, SurgicalPlan as SurgicalPlanType, MedicalResearch, DifferentialDiagnosis, Timeframe } from './types';
import { editImage, analyzeImage, generateMedicalVideo, generateRadiologyReport, generateHealthyReference, generateSurgicalPlan, performMedicalResearch, generateAnomalyHeatmap, generateProgressionPreview, getDifferentialDiagnosis } from './services/geminiService';
import { fetchClinicalTrials, fetchMedlinePlusResources, fetchOpenFDADrugs, fetchPubMedPapers } from './services/externalMedicalAPIs';

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
  
  // Advanced Visual Layers
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [progressionUrl, setProgressionUrl] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Smart Labels & Analysis
  const [showSmartLabels, setShowSmartLabels] = useState(false);
  const [structures, setStructures] = useState<AnatomicalStructure[]>([]);
  const [focusedStructureIndex, setFocusedStructureIndex] = useState<number | null>(null);
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<DifferentialDiagnosis[]>([]);
  const [showDifferential, setShowDifferential] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.SCAN_2D);
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string>('');
  
  // Advanced Features
  const [report, setReport] = useState<RadiologyReportType | null>(null);
  const [surgicalPlan, setSurgicalPlan] = useState<SurgicalPlanType | null>(null);
  const [research, setResearch] = useState<MedicalResearch | null>(null);
  const [viewMode, setViewMode] = useState<'GENERATED' | 'HEALTHY' | 'PROGRESSION'>('GENERATED');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('ORIGINAL');

  // Image PACS Adjustments & Tools
  const [activeTool, setActiveTool] = useState<'POINTER' | 'MAGNIFIER' | 'WINDOW_LEVEL' | 'HEATMAP'>('POINTER');
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    invert: false,
    grayscale: false
  });

  // Window/Level Drag State
  const dragStartRef = useRef<{x: number, y: number, b: number, c: number} | null>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.key.toLowerCase()) {
        case 'm': setActiveTool('MAGNIFIER'); break;
        case 'h': setActiveTool('HEATMAP'); break;
        case 'p': setActiveTool('POINTER'); break;
        case 'w': setActiveTool('WINDOW_LEVEL'); break;
        case 'i': setAdjustments(prev => ({...prev, invert: !prev.invert})); break;
        case 'g': setAdjustments(prev => ({...prev, grayscale: !prev.grayscale})); break;
        case 'l': setShowSmartLabels(prev => !prev); break;
        case 'd': setIsAnnotating(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleLoadDemo = async () => {
    setStatus(AppStatus.LOADING);
    try {
      // Fetch a sample Chest X-Ray
      const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg/600px-Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg');
      const blob = await response.blob();
      const file = new File([blob], "demo_chest_xray.jpg", { type: "image/jpeg" });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setOriginalImage({
            file,
            previewUrl: URL.createObjectURL(file),
            base64: e.target.result as string,
            mimeType: "image/jpeg"
          });
          setPrompt("Analyze this chest X-ray for any potential consolidation, pneumothorax, or cardiomegaly.");
          setStatus(AppStatus.IDLE);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Demo load failed", e);
      setError("Failed to load demo image.");
      setStatus(AppStatus.ERROR);
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
    setHeatmapUrl(null);
    setProgressionUrl(null);
    setDifferentialDiagnoses([]);
    setIsAnalyzing(true);
    setIsAnnotating(false);
    setShowSmartLabels(false);
    setViewMode('GENERATED');
    setActiveTimeframe('ORIGINAL');
    setReport(null);
    setSurgicalPlan(null);
    setResearch(null);

    try {
      if (mode === AppMode.SCAN_2D || mode === AppMode.SYNC_COMPARE) {
        // 2D Generation
        const imagePromise = editImage(originalImage.base64, originalImage.mimeType, prompt);
        const generatedImage = await imagePromise;
        setGeneratedImageUrl(generatedImage);
        setStatus(AppStatus.SUCCESS);

        // Parallel Analysis: Structures + Differential Diagnosis + Heatmap Prep
        const analysisPromise = analyzeImage(generatedImage, "image/png");
        
        // Kick off heatmap generation quietly in background
        generateAnomalyHeatmap(generatedImage, "image/png").then(setHeatmapUrl).catch(e => console.log("Heatmap gen skipped", e));

        const analysisData = await analysisPromise;
        setStructures(analysisData);
        
        // Auto-run Differential Diagnosis if pathologies found
        const findings = analysisData.map(s => s.name).join(', ');
        getDifferentialDiagnosis(generatedImage, "image/png", findings || prompt).then(setDifferentialDiagnoses);

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

  const handleTimeframeChange = async (time: Timeframe) => {
    if (!generatedImageUrl || time === activeTimeframe) return;
    
    setActiveTimeframe(time);
    
    if (time === 'ORIGINAL') {
      setViewMode('GENERATED');
      return;
    }

    setViewMode('PROGRESSION');
    // If we haven't generated this progression yet, do it now
    setStatus(AppStatus.LOADING);
    try {
      const progression = await generateProgressionPreview(
         generatedImageUrl, 
         "image/png", 
         time, 
         structures.map(s => s.name).join(', ') || prompt
      );
      setProgressionUrl(progression);
      setStatus(AppStatus.SUCCESS);
    } catch(e) {
      console.error(e);
      setError("Failed to generate progression preview.");
      setStatus(AppStatus.ERROR);
      setActiveTimeframe('ORIGINAL');
      setViewMode('GENERATED');
    }
  };

  const handleGenerateReport = async () => {
    if (!generatedImageUrl || !originalImage) return;
    setIsAnalyzing(true);
    try {
      const reportData = await generateRadiologyReport(generatedImageUrl, "image/png", prompt);
      // Attach the generated image to the report for visual export
      setReport({ ...reportData, imageUrl: generatedImageUrl });
    } catch (e) {
      console.error(e);
      setError("Failed to generate report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateSurgicalPlan = async () => {
     if (!generatedImageUrl) return;
     setIsAnalyzing(true);
     try {
       // Create context from structures or prompt
       const findings = structures.length > 0 
           ? structures.map(s => s.name + ': ' + s.description).join('. ')
           : prompt;

       const plan = await generateSurgicalPlan(generatedImageUrl, "image/png", findings);
       setSurgicalPlan(plan);
     } catch(e) {
       console.error(e);
       setError("Failed to generate surgical plan.");
     } finally {
       setIsAnalyzing(false);
     }
  };

  const handleRefineResearch = async (manualTerm: string) => {
    setIsAnalyzing(true);
    try {
      const [trials, resources, drugs, papers] = await Promise.all([
        fetchClinicalTrials(manualTerm),
        fetchMedlinePlusResources(manualTerm),
        fetchOpenFDADrugs(manualTerm),
        fetchPubMedPapers(manualTerm)
      ]);

      setResearch(prev => prev ? ({
        ...prev,
        searchQuery: manualTerm,
        clinicalTrials: trials,
        patientResources: resources,
        drugLabels: drugs,
        pubMedPapers: papers
      }) : null);

    } catch(e) {
      console.error("Refinement failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePerformResearch = async () => {
    if (structures.length === 0 && !prompt) return;
    setIsAnalyzing(true);
    try {
      // Gather initial context
      const topics = structures.length > 0 ? structures.map(s => s.name).slice(0, 3).join(', ') : prompt;
      
      const researchData = await performMedicalResearch(topics);
      
      const searchTerm = researchData.searchQuery || researchData.topic || topics.split(',')[0];
      
      const [trials, resources, drugs, papers] = await Promise.all([
        fetchClinicalTrials(searchTerm),
        fetchMedlinePlusResources(searchTerm),
        fetchOpenFDADrugs(searchTerm),
        fetchPubMedPapers(searchTerm)
      ]);
      
      setResearch({
        ...researchData,
        searchQuery: searchTerm, 
        clinicalTrials: trials,
        patientResources: resources,
        drugLabels: drugs,
        pubMedPapers: papers
      });

    } catch(e) {
      console.error(e);
      setError("Failed to retrieve medical research.");
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

  const handleAskAboutStructure = (name: string) => {
    setInitialChatMessage(`What can you tell me about the ${name} visible in this scan?`);
    setShowChat(true);
  };

  // Window/Level Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'WINDOW_LEVEL') {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        b: adjustments.brightness,
        c: adjustments.contrast
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeTool === 'WINDOW_LEVEL' && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setAdjustments(prev => ({
        ...prev,
        contrast: Math.min(Math.max(dragStartRef.current!.c + dx * 0.5, 0), 200),
        brightness: Math.min(Math.max(dragStartRef.current!.b - dy * 0.5, 0), 200)
      }));
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  // Voice Command Parsing
  const handleVoiceTranscript = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('invert')) { setAdjustments(prev => ({ ...prev, invert: !prev.invert })); return; }
    if (lower.includes('grayscale')) { setAdjustments(prev => ({ ...prev, grayscale: !prev.grayscale })); return; }
    if (lower.includes('reset')) { setAdjustments({ brightness: 100, contrast: 100, invert: false, grayscale: false }); return; }
    if (lower.includes('report')) { handleGenerateReport(); return; }
    if (lower.includes('labels')) { setShowSmartLabels(true); return; }
    if (lower.includes('hide')) { setShowSmartLabels(false); return; }
    
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

  const getActiveDisplayImage = () => {
    if (viewMode === 'HEALTHY' && healthyImageUrl) return healthyImageUrl;
    if (viewMode === 'PROGRESSION' && progressionUrl) return progressionUrl;
    return generatedImageUrl || '';
  };

  // Build Context for Chat
  const getChatContext = () => {
    let context = "";
    if (report) {
       context += `RADIOLOGY REPORT CONTEXT:\nFindings: ${report.findings.join(', ')}\nImpression: ${report.impression}\n\n`;
    }
    if (research) {
       context += `RESEARCH CONTEXT:\nTopic: ${research.topic}\nSummary: ${research.summary}\nProtocols: ${research.treatmentProtocols.join(', ')}\n`;
    }
    if (differentialDiagnoses.length > 0) {
       context += `DIFFERENTIAL DIAGNOSIS:\n${differentialDiagnoses.map(d => `${d.condition} (${d.probability}%)`).join(', ')}`;
    }
    return context;
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden font-sans print:bg-white print:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-900/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-teal-900/10 blur-[120px] rounded-full" />
      </div>

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
          
          <div className="lg:col-span-4 space-y-6 print:hidden">
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
                  setResearch(null);
                }} 
                selectedImage={originalImage}
                onLoadDemo={handleLoadDemo} 
              />
            </div>

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

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
                <button
                  onClick={() => setMode(AppMode.SCAN_2D)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === AppMode.SCAN_2D || mode === AppMode.SYNC_COMPARE ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
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

              {mode !== AppMode.HOLO_3D && (
                <div className="space-y-2 pt-2 border-t border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Quick Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_STYLES.map((style) => (
                      <button
                        key={style.label}
                        onClick={() => applyStyle(style)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-purple-500/20 p-5 shadow-xl">
               <DifferentialPanel diagnoses={differentialDiagnoses} isLoading={isAnalyzing} />
            </div>
            
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
               <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                03. Visualization Output
              </h2>
              
              <div className="flex items-center gap-2">
                {generatedImageUrl && mode !== AppMode.HOLO_3D && (
                   <>
                     <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button 
                           onClick={() => setViewMode('GENERATED')}
                           className={`px-3 py-1.5 rounded text-xs font-bold uppercase ${viewMode === 'GENERATED' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                           Pathology
                        </button>
                        <button 
                           onClick={handlePatientEducationMode}
                           className={`px-3 py-1.5 rounded text-xs font-bold uppercase ${viewMode === 'HEALTHY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                           Healthy Ref
                        </button>
                     </div>
                     
                     <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   </>
                )}
                
                {mode !== AppMode.HOLO_3D && (
                  <button 
                    onClick={() => setMode(mode === AppMode.SCAN_2D ? AppMode.SYNC_COMPARE : AppMode.SCAN_2D)}
                    disabled={!originalImage || !generatedImageUrl}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase ${mode === AppMode.SYNC_COMPARE ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-indigo-500/50'}`}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                     Compare
                  </button>
                )}

                <button 
                   onClick={() => setShowSmartLabels(!showSmartLabels)}
                   disabled={!structures.length}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase ${showSmartLabels ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500/50'}`}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   Labels (L)
                </button>
                <button 
                   onClick={() => setIsAnnotating(true)}
                   disabled={!generatedImageUrl}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-xs font-bold uppercase"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   Draw (D)
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                <button 
                  onClick={handleGenerateSurgicalPlan}
                  disabled={!generatedImageUrl}
                  className="px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-900/20 text-teal-400 hover:bg-teal-900/40 text-xs font-bold uppercase flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   Surgery
                </button>
                <button 
                   onClick={handleGenerateReport}
                   disabled={!generatedImageUrl}
                   className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold uppercase flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   Report
                </button>
                <button 
                   onClick={handlePerformResearch}
                   disabled={!generatedImageUrl}
                   className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 text-xs font-bold uppercase flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   PubMed
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in-down print:hidden">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {mode !== AppMode.HOLO_3D && generatedImageUrl && !isAnnotating && mode !== AppMode.SYNC_COMPARE && (
              <ImageControls 
                 adjustments={adjustments} 
                 setAdjustments={setAdjustments} 
                 activeTool={activeTool}
                 setActiveTool={setActiveTool}
              />
            )}

            <div 
               className={`
                 relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 
                 ${mode === AppMode.HOLO_3D ? 'aspect-video' : 'aspect-square md:aspect-[4/3]'} 
                 group print:border-none print:shadow-none
                 ${activeTool === 'WINDOW_LEVEL' ? 'cursor-crosshair' : ''}
               `}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
            >
              {status === AppStatus.LOADING && <ScanningOverlay />}
              
              {isAnnotating && generatedImageUrl ? (
                <AnnotationCanvas 
                  imageUrl={getActiveDisplayImage()}
                  onSave={(annotatedUrl) => {
                     setGeneratedImageUrl(annotatedUrl);
                     setIsAnnotating(false);
                  }}
                  onCancel={() => setIsAnnotating(false)}
                />
              ) : mode === AppMode.HOLO_3D && generatedVideoUrl ? (
                <HoloViewer videoUrl={generatedVideoUrl} />
              ) : mode === AppMode.SYNC_COMPARE && originalImage && generatedImageUrl ? (
                <SynchronizedCompare 
                   imageLeft={originalImage.previewUrl}
                   imageRight={getActiveDisplayImage()}
                   labelLeft="Input Source"
                   labelRight="MediGen Analysis"
                />
              ) : generatedImageUrl && originalImage ? (
                <>
                  <div className="absolute inset-0 z-10">
                     <ImageCompare 
                        beforeImage={originalImage.previewUrl} 
                        afterImage={getActiveDisplayImage()} 
                        adjustments={adjustments}
                     />
                  </div>

                  {showSmartLabels && (
                    <SmartLabelOverlay 
                       structures={structures} 
                       imageUrl={generatedImageUrl} 
                       focusedIndex={focusedStructureIndex}
                    />
                  )}
                  
                  {activeTool === 'MAGNIFIER' && (
                    <div className="absolute inset-0 z-30 pointer-events-none">
                       <Magnifier imgUrl={getActiveDisplayImage()} />
                    </div>
                  )}

                  {activeTool === 'HEATMAP' && heatmapUrl && (
                    <div className="absolute inset-0 z-20 mix-blend-screen pointer-events-none opacity-80 animate-pulse">
                      <img src={heatmapUrl} className="w-full h-full object-contain" alt="Heatmap" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 print:hidden">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm uppercase tracking-widest font-bold">Awaiting Input Scan</p>
                </div>
              )}
            </div>

            {mode === AppMode.SCAN_2D && generatedImageUrl && (
               <TimelineSlider 
                 activeTimeframe={activeTimeframe} 
                 onChange={handleTimeframeChange}
                 isLoading={status === AppStatus.LOADING}
               />
            )}

            {generatedImageUrl && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                 <StructureAnalysis 
                   structures={structures} 
                   isLoading={isAnalyzing} 
                   onHoverStructure={setFocusedStructureIndex}
                   onAskAbout={handleAskAboutStructure}
                 />
                 
                 <div className="relative">
                   <button 
                     onClick={() => setShowChat(!showChat)}
                     className="w-full bg-slate-900/50 border border-cyan-500/30 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors"
                   >
                      <span className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-cyan-400 font-bold text-sm tracking-wide">AI Diagnostic Assistant</span>
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${showChat ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                   </button>
                   
                   {showChat && (
                     <div className="absolute bottom-full left-0 right-0 mb-4 animate-fade-in-down z-30">
                       <MedicalChat 
                          generatedImageBase64={generatedImageUrl} 
                          mimeType="image/png" 
                          initialMessage={initialChatMessage}
                          // Pass context from Research and Reports
                          context={getChatContext()}
                       />
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {report && <RadiologyReport report={report} onClose={() => setReport(null)} />}
      {surgicalPlan && <SurgicalPlan plan={surgicalPlan} onClose={() => setSurgicalPlan(null)} />}
      {research && <ResearchPanel research={research} onClose={() => setResearch(null)} onRefineSearch={handleRefineResearch} isLoading={isAnalyzing} />}
      
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest print:hidden">
         MediGen AI v2.5 • Powered by Google Gemini Flash & Veo • FDA/HIPAA Compliance Mode: TEST
      </footer>
    </div>
  );
};

export default App;
