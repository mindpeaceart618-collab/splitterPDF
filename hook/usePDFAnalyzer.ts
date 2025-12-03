import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageData, AnalysisStatus } from '../types';
import { analyzeImagePixelData } from '../utils/pdfUtils';

export const usePDFAnalyzer = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [pages, setPages] = useState<PageData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to cancel ongoing analysis if needed
  const abortRef = useRef<boolean>(false);

  const analyzeFile = useCallback(async (file: File) => {
    try {
      abortRef.current = false;
      setStatus(AnalysisStatus.LOADING_PDF);
      setError(null);
      setPages([]);
      setFileName(file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      const numPages = pdf.numPages;
      setProgress({ current: 0, total: numPages });
      setStatus(AnalysisStatus.ANALYZING);

      const newPages: PageData[] = [];

      // Process pages sequentially to update UI progress and avoid browser freeze
      for (let i = 1; i <= numPages; i++) {
        if (abortRef.current) break;

        const page = await pdf.getPage(i);
        
        // Render to an off-screen canvas
        // Scale 0.5 is usually sufficient for color detection and saves memory
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error('Could not create canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // PDF.js v5+ types require 'canvas' property in RenderParameters.
        // We pass the canvas element and cast to any to ensure compatibility.
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas,
        } as any).promise;

        // 1. Analyze Pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Fine-tuned Thresholds:
        // Variance 32: Better sensitivity for light highlighters/signatures while avoiding JPEG artifacts.
        // Coverage 0.002 (0.2%): Reduces false positives from tiny specks or dust.
        const analysis = analyzeImagePixelData(imageData.data, 32, 0.002);

        // 2. Generate Thumbnail (Blob URL)
        // We use a lower quality JPEG for thumbnails to save memory
        const blob = await new Promise<Blob | null>(resolve => 
          canvas.toBlob(resolve, 'image/jpeg', 0.7)
        );
        
        const thumbnailUrl = blob ? URL.createObjectURL(blob) : '';

        newPages.push({
          pageNumber: i,
          thumbnailUrl,
          isColorDetected: analysis.isColor,
          isColorUserForced: null,
          pixelCount: analysis.totalPixels,
          colorPixelCount: analysis.colorPixels
        });

        // Update progress state
        setProgress({ current: i, total: numPages });
        // Update pages list incrementally so user sees them appearing
        setPages(prev => [...prev, {
            pageNumber: i,
            thumbnailUrl,
            isColorDetected: analysis.isColor,
            isColorUserForced: null,
            pixelCount: analysis.totalPixels,
            colorPixelCount: analysis.colorPixels
        }]);
      }

      setStatus(AnalysisStatus.COMPLETE);
    } catch (err: any) {
      console.error("PDF Analysis Error:", err);
      setError(err.message || "Failed to analyze PDF");
      setStatus(AnalysisStatus.ERROR);
    }
  }, []);

  const togglePageStatus = useCallback((pageNumber: number) => {
    setPages(prevPages => 
      prevPages.map(p => {
        if (p.pageNumber !== pageNumber) return p;
        
        // Logic: 
        // If currently Color (either detected or forced), switch to B&W.
        // If currently B&W, switch to Color.
        
        const isCurrentlyColor = p.isColorUserForced !== null 
          ? p.isColorUserForced 
          : p.isColorDetected;

        return {
          ...p,
          isColorUserForced: !isCurrentlyColor // Flip the status via override
        };
      })
    );
  }, []);

  const batchUpdatePageStatus = useCallback((pageNumbers: number[], isColor: boolean) => {
    setPages(prevPages => {
      const idsToUpdate = new Set(pageNumbers);
      return prevPages.map(p => {
        if (idsToUpdate.has(p.pageNumber)) {
          return { ...p, isColorUserForced: isColor };
        }
        return p;
      });
    });
  }, []);

  const resetAnalysis = useCallback(() => {
    abortRef.current = true;
    // Cleanup blob URLs to avoid memory leaks
    pages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
    setPages([]);
    setFileName(null);
    setStatus(AnalysisStatus.IDLE);
    setProgress({ current: 0, total: 0 });
    setError(null);
  }, [pages]);

  return {
    status,
    progress,
    pages,
    fileName,
    error,
    analyzeFile,
    togglePageStatus,
    batchUpdatePageStatus,
    resetAnalysis
  };
};