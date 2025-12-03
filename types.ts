
export interface PageData {
  pageNumber: number;
  thumbnailUrl: string; // Blob URL for display
  isColorDetected: boolean; // What the algorithm found
  isColorUserForced: boolean | null; // null = no override, true/false = override
  pixelCount: number; // Total pixels analyzed
  colorPixelCount: number; // Pixels exceeding color threshold
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING_PDF = 'LOADING_PDF',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface RangeResult {
  label: string;
  rangeString: string;
  count: number;
  type: 'color' | 'bw';
}

export type ViewCategory = 'all' | 'mixed-color' | 'mixed-bw' | 'double-color' | 'double-bw';
