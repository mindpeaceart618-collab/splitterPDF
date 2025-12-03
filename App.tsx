
import React, { useRef, useState, useMemo } from 'react';
import { usePDFAnalyzer } from './hooks/usePDFAnalyzer';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { Sidebar } from './components/Sidebar';
import { ImageViewerModal } from './components/ImageViewerModal';
import { AnalysisStatus, ViewCategory } from './types';
import { calculateSmartSplitStats } from './utils/pdfUtils';
import { ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// --- AD NETWORK CONFIGURATION ---
// Change this value to 'google' or 'adsterra' to switch the displayed ad placeholders
const SELECTED_AD_NETWORK: 'google' | 'adsterra' = 'google';

const AdPlaceholder: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const networkName = SELECTED_AD_NETWORK === 'google' ? 'Google AdSense' : 'Adsterra';
  const bgColor = SELECTED_AD_NETWORK === 'google' ? 'bg-gray-100' : 'bg-red-50';
  const borderColor = SELECTED_AD_NETWORK === 'google' ? 'border-gray-300' : 'border-red-200';
  const textColor = SELECTED_AD_NETWORK === 'google' ? 'text-gray-400' : 'text-red-400';

  return (
    <div className={`w-full max-w-[728px] h-[90px] ${bgColor} border-2 border-dashed ${borderColor} rounded-lg flex flex-col items-center justify-center mx-auto ${position === 'top' ? 'mb-8' : 'mt-8'} ${textColor} text-sm transition-all`}>
      <span className="font-semibold uppercase tracking-wider">{networkName} Banner</span>
      <span className="text-xs">Ad Space ({position}) - 728x90</span>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    status, 
    progress, 
    pages,
    fileName,
    analyzeFile, 
    togglePageStatus,
    batchUpdatePageStatus,
    resetAnalysis 
  } = usePDFAnalyzer();
  
  const [zoomedPageNumber, setZoomedPageNumber] = useState<number | null>(null);
  const [viewCategory, setViewCategory] = useState<ViewCategory>('mixed-color');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Smart Split Calculation (Lifted from Sidebar) ---
  const smartStats = useMemo(() => {
    // Basic Page Status Map
    const simplifiedPages = pages.map(p => ({
      pageNumber: p.pageNumber,
      isColor: p.isColorUserForced !== null ? p.isColorUserForced : p.isColorDetected
    }));
    return calculateSmartSplitStats(simplifiedPages, pages.length);
  }, [pages]);

  // --- Grid Filtering Logic ---
  const filteredPages = useMemo(() => {
    if (viewCategory === 'all') return pages;

    let targetPageNumbers: number[] = [];
    
    switch (viewCategory) {
        case 'mixed-color':
            targetPageNumbers = smartStats.mixedColorPages;
            break;
        case 'mixed-bw':
            targetPageNumbers = smartStats.mixedBWPages;
            break;
        case 'double-color':
            targetPageNumbers = smartStats.doubleColorSheets;
            break;
        case 'double-bw':
            targetPageNumbers = smartStats.doubleBWSheets;
            break;
    }

    const targetSet = new Set(targetPageNumbers);
    return pages.filter(p => targetSet.has(p.pageNumber));
  }, [pages, viewCategory, smartStats]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      analyzeFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Zoom Navigation Logic
  const handleNextZoom = () => {
    // Find index in filtered pages to navigate visually
    const currentIndex = filteredPages.findIndex(p => p.pageNumber === zoomedPageNumber);
    if (currentIndex !== -1 && currentIndex < filteredPages.length - 1) {
        setZoomedPageNumber(filteredPages[currentIndex + 1].pageNumber);
    }
  };

  const handlePrevZoom = () => {
    const currentIndex = filteredPages.findIndex(p => p.pageNumber === zoomedPageNumber);
    if (currentIndex > 0) {
        setZoomedPageNumber(filteredPages[currentIndex - 1].pageNumber);
    }
  };

  const currentZoomedPage = zoomedPageNumber ? pages.find(p => p.pageNumber === zoomedPageNumber) : null;
  const hasNextZoom = zoomedPageNumber !== null && filteredPages.findIndex(p => p.pageNumber === zoomedPageNumber) < filteredPages.length - 1;
  const hasPrevZoom = zoomedPageNumber !== null && filteredPages.findIndex(p => p.pageNumber === zoomedPageNumber) > 0;

  const renderContent = () => {
    // 1. Initial State: Upload
    if (status === AnalysisStatus.IDLE) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-64px)] overflow-y-auto custom-scroll text-center p-8 bg-gray-50">
          
          {/* Top Ad Banner */}
          <AdPlaceholder position="top" />

          <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full z-10">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowUpTrayIcon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Upload PDF</h1>
            <p className="text-gray-500 mb-8">
              Select a PDF file to automatically analyze color coverage and calculate split ranges.
              Processing is done locally in your browser.
            </p>
            <button 
              onClick={handleUploadClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 w-full"
            >
              Choose PDF File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="application/pdf" 
              className="hidden" 
            />
          </div>

          {/* Bottom Ad Banner */}
          <AdPlaceholder position="bottom" />

        </div>
      );
    }

    // 2. Loading PDF Binary State (Before Analysis Starts)
    if (status === AnalysisStatus.LOADING_PDF) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[80vh]">
          <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Loading Document...</h2>
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Parsing PDF structure...</p>
          </div>
        </div>
      );
    }

    // 3. Error State
    if (status === AnalysisStatus.ERROR) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
          <div className="bg-red-50 text-red-800 p-8 rounded-lg shadow max-w-md text-center">
            <h3 className="text-lg font-bold mb-2">Something went wrong</h3>
            <p className="mb-4">Failed to analyze the PDF file. Please try a valid PDF.</p>
            <button 
              onClick={resetAnalysis}
              className="bg-white border border-red-200 hover:bg-red-100 text-red-700 px-4 py-2 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // 4. Analysis & Complete State
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Main Content - Scrollable Grid */}
        <main className="flex-1 overflow-y-auto bg-gray-100 custom-scroll relative">
           <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
             <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  Page Analysis
                  {status === AnalysisStatus.ANALYZING && (
                    <span className="ml-3 text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5 animate-pulse"></span>
                      Processing {progress.current}/{progress.total}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Viewing: <span className="font-semibold text-indigo-600">{filteredPages.length} pages</span>. Hover to Zoom. Shift+Click for range.
                </p>
             </div>
             <button 
               onClick={resetAnalysis}
               className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
             >
               <ArrowPathIcon className="w-4 h-4 mr-1" />
               Upload New File
             </button>
           </div>
           
           <ThumbnailGrid 
             pages={filteredPages} 
             totalCount={viewCategory === 'all' ? progress.total : undefined} // Only show placeholders in 'All' view
             onTogglePage={togglePageStatus}
             onBatchUpdate={batchUpdatePageStatus}
             onZoom={setZoomedPageNumber}
           />
        </main>

        {/* Sidebar - Sticky/Fixed */}
        <aside className="h-64 lg:h-auto border-t lg:border-t-0 flex-shrink-0 relative z-40">
           <Sidebar 
             pages={pages} 
             fileName={fileName} 
             activeCategory={viewCategory}
             onCategoryChange={setViewCategory}
             stats={smartStats}
           />
        </aside>

        {/* Image Viewer Modal */}
        {currentZoomedPage && (
            <ImageViewerModal 
                page={currentZoomedPage}
                onClose={() => setZoomedPageNumber(null)}
                onNext={handleNextZoom}
                onPrev={handlePrevZoom}
                onToggleStatus={togglePageStatus}
                hasNext={hasNextZoom}
                hasPrev={hasPrevZoom}
            />
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-50 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded">
             <ArrowUpTrayIcon className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Smart<span className="text-indigo-600">PDF</span>Splitter
          </span>
        </div>
      </header>

      {/* Main Area */}
      {renderContent()}
    </div>
  );
};

export default App;
