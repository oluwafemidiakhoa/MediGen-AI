
export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  invert: boolean;
  grayscale: boolean;
}

export enum AppMode {
  SCAN_2D = 'SCAN_2D',
  HOLO_3D = 'HOLO_3D'
}

export type AnnotationToolType = 'PEN' | 'TEXT' | 'ERASER';
export type BrushShape = 'ROUND' | 'SQUARE';
export type LineStyle = 'SOLID' | 'DASHED' | 'DOTTED';

export interface AnnotationStyle {
  color: string;
  lineWidth: number;
  fontSize: number;
  brushShape: BrushShape;
  lineStyle: LineStyle;
}

export interface AnnotationLayer {
  id: string;
  name: string;
  isVisible: boolean;
}

export interface Annotation {
  id: string;
  layerId: string;
  tool: AnnotationToolType;
  points: { x: number; y: number }[];
  text?: string;
  textPosition?: { x: number; y: number };
  style: AnnotationStyle;
}

export interface BoundingBox2D {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AnatomicalStructure {
  name: string;
  description: string;
  medicalRelevance: string;
  confidence: number;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-100 scale
}

export interface RadiologyReport {
  patientId: string;
  modality: string;
  date: string;
  clinicalHistory: string;
  findings: string[];
  impression: string;
  recommendations: string[];
}

export interface SurgicalPlan {
  procedureName: string;
  anesthesiaType: string;
  patientPositioning: string;
  steps: string[];
  risks: string[];
}

export interface MedicalResearch {
  topic: string;
  summary: string;
  citations: {
    title: string;
    source: string;
    url: string;
  }[];
  treatmentProtocols: string[];
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number; // 0-100
  reasoning: string;
  color: string; // Hex for UI
}

export type Timeframe = 'ORIGINAL' | '3_MONTHS' | '6_MONTHS' | '1_YEAR';
