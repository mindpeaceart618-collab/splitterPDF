
import React, { useState, useRef } from 'react';
import { PageData } from '../types';
import { CheckCircleIcon, XCircleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface ThumbnailGridProps {
  pages: PageData[];
  onTogglePage: (pageNumber: number) => void;
  onBatchUpdate: (pageNumbers: number[], isColor: boolean) => void;
  totalCount?: number;
  onZoom: (pageNumber: number) => void;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({ 
  pages, 
  onTogglePage, 
  onBatchUpdate, 
  totalCount,
  onZoom
}) => {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const lastSelectedPageRef = useRef<number | null>(null);

  // The 'pages' prop is now already filtered by the parent App component based on Sidebar selection.
  const displayedPages = pages;

  const handlePageClick = (pageNumber: number, event: React.MouseEvent) => {
    if (event.shiftKey) {
       document.getSelection()?.removeAllRanges();
    }

    // 1. Shift + Click: Range Selection
    if (event.shiftKey && lastSelectedPageRef.current !== null) {
      const currentIndex = displayedPages.findIndex(p => p.pageNumber === pageNumber);
      const lastIndex = displayedPages.findIndex(p => p.pageNumber === lastSelectedPageRef.current!);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        const newSelection = new Set(selectedPages);
        for (let i = start; i <= end; i++) {
          newSelection.add(displayedPages[i].pageNumber);
        }
        setSelectedPages(newSelection);
        lastSelectedPageRef.current = pageNumber;
        return;
      }
    }

    // 2. Ctrl/Cmd + Click: Toggle Selection
    if (event.ctrlKey || event.metaKey) {
      const newSelection = new Set(selectedPages);
      if (newSelection.has(pageNumber)) {
        newSelection.delete(pageNumber);
      } else {
        newSelection.add(pageNumber);
      }
      setSelectedPages(newSelection);
      lastSelectedPageRef.current = pageNumber;
      return;
    }

    // 3. Normal Click: Toggle Status & Clear Selection
    onTogglePage(pageNumber);
    if (selectedPages.size > 0) {
      setSelectedPages(new Set());
    }
    lastSelectedPageRef.current = pageNumber;
  };

  const handleSelectAllInView = () => {
    const newSelection = new Set<number>();
    displayedPages.forEach(p => newSelection.add(p.pageNumber));
    setSelectedPages(newSelection);
  };

  const handleBatchUpdate = (isColor: boolean) => {
    onBatchUpdate(Array.from(selectedPages), isColor);
    setSelectedPages(new Set());
    lastSelectedPageRef.current = null;
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
    lastSelectedPageRef.current = null;
  };

  // Generate placeholders logic
  const showPlaceholders = totalCount !== undefined && totalCount > displayedPages.length;
  const placeholders = [];
  if (showPlaceholders && totalCount) {
    for (let i = displayedPages.length + 1; i <= totalCount; i++) {
      placeholders.push(i);
    }
  }

  return (
    <div className="pb-24 select-none">
      {/* Sticky Toolbar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-wrap gap-4 text-sm sticky top-[61px] z-20 shadow-sm items-center justify-between">
        
        {/* Helper Text */}
        <div className="flex bg-gray-50 px-3 py-1.5 rounded-lg text-gray-500">
             <span>Select multiple: <b className="text-gray-700">Ctrl</b>+Click or <b className="text-gray-700">Shift</b>+Click</span>
        </div>

        {/* Selection Tools */}
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSelectAllInView}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors"
            >
                Select Visible ({displayedPages.length})
            </button>
            {selectedPages.size > 0 && (
            <button 
                onClick={clearSelection}
                className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
                Clear
            </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {/* Render Analyzed Pages */}
        {displayedPages.map((page) => {
          const isColor = page.isColorUserForced !== null 
            ? page.isColorUserForced 
            : page.isColorDetected;
          
          const isSelected = selectedPages.has(page.pageNumber);

          return (
            <div 
              key={page.pageNumber}
              className={`
                relative group transition-all duration-200 
                border-2 rounded-lg overflow-hidden
                ${isSelected 
                    ? 'ring-4 ring-indigo-500 ring-offset-2 border-indigo-600 z-10 bg-indigo-50 shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-[1.02]' 
                    : isColor 
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm hover:shadow-md' 
                        : 'border-slate-300 bg-white hover:border-slate-400 shadow-sm hover:shadow-md'
                }
              `}
            >
              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-2 left-2 z-20 text-indigo-600 bg-white rounded-full shadow-md animate-bounce-in">
                   <CheckCircleIcon className="w-6 h-6" />
                </div>
              )}

              {/* Status Badge */}
              <div className={`
                absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-bold shadow-sm backdrop-blur-sm pointer-events-none
                ${isColor ? 'bg-emerald-500/90 text-white' : 'bg-slate-600/90 text-white'}
              `}>
                {isColor ? 'COLOR' : 'B&W'}
              </div>

              {/* User Override Indicator */}
              {page.isColorUserForced !== null && !isSelected && (
                <div className="absolute top-2 left-2 z-10 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white shadow-sm" title="Manual Override"></div>
              )}

              {/* Thumbnail Image Container */}
              <div 
                onClick={(e) => handlePageClick(page.pageNumber, e)}
                className="aspect-[1/1.414] w-full flex items-center justify-center overflow-hidden cursor-pointer relative bg-transparent"
              >
                 {page.thumbnailUrl ? (
                    <img 
                      src={page.thumbnailUrl} 
                      alt={`Page ${page.pageNumber}`} 
                      className={`object-contain w-full h-full transition-opacity duration-300 ${isColor ? '' : 'grayscale'} ${isSelected ? 'opacity-90' : ''}`}
                      loading="lazy"
                    />
                 ) : (
                   <div className="animate-pulse bg-gray-200 w-full h-full" />
                 )}

                 {/* Hover Overlay with Zoom Button */}
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Don't trigger selection/toggle
                            onZoom(page.pageNumber);
                        }}
                        className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:text-indigo-600"
                        title="Zoom Page"
                    >
                        <ArrowsPointingOutIcon className="w-6 h-6" />
                    </button>
                 </div>

                 {/* Detailed Stats Overlay (Hover) */}
                 <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 flex flex-col gap-0.5 border-t border-white/10">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-400">Detected:</span>
                       <span className={page.isColorDetected ? 'text-emerald-300 font-medium' : 'text-slate-300 font-medium'}>
                         {page.isColorDetected ? 'Color' : 'B&W'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Coverage:</span>
                        <span className="font-mono">{((page.colorPixelCount / Math.max(page.pixelCount, 1)) * 100).toFixed(3)}%</span>
                    </div>
                    <div className="text-gray-500 text-[9px] mt-0.5 text-right font-mono">
                         {page.colorPixelCount.toLocaleString()} px
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div 
                onClick={(e) => handlePageClick(page.pageNumber, e)}
                className={`
                    cursor-pointer px-2 py-1.5 text-center text-sm font-medium border-t flex justify-between items-center transition-colors
                    ${isSelected 
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                        : isColor 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                    }
              `}>
                <span className="mx-auto">Page {page.pageNumber}</span>
              </div>
            </div>
          );
        })}

        {/* Render Placeholders (Only if explicitly enabled via totalCount prop) */}
        {placeholders.map((pageNum) => (
          <div 
            key={`placeholder-${pageNum}`}
            className="relative border-2 border-slate-100 rounded-lg overflow-hidden bg-slate-50 opacity-80"
          >
            <div className="aspect-[1/1.414] w-full flex flex-col items-center justify-center p-4">
               <div className="w-full h-full flex flex-col gap-3 animate-pulse">
                  <div className="h-1/3 bg-slate-200/50 rounded-sm w-full"></div>
                  <div className="h-2 bg-slate-200/50 rounded-sm w-5/6"></div>
                  <div className="h-2 bg-slate-200/50 rounded-sm w-full"></div>
                  <div className="flex-1"></div>
               </div>
            </div>
            <div className="px-2 py-1.5 text-center text-sm font-medium border-t border-slate-100 bg-slate-100/30 text-slate-400">
              Page {pageNum}
            </div>
          </div>
        ))}

        {/* Empty State for Filters */}
        {displayedPages.length === 0 && !showPlaceholders && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                <FunnelIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>No pages match the current view.</p>
            </div>
        )}
      </div>

      {/* Floating Action Bar (Selection Active) */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 transition-all duration-300 ${selectedPages.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <span className="font-bold border-r border-gray-600 pr-4">{selectedPages.size} Selected</span>
          
          <button 
            onClick={() => handleBatchUpdate(true)}
            className="flex items-center hover:text-emerald-400 font-medium transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
            Mark Color
          </button>
          
          <button 
            onClick={() => handleBatchUpdate(false)}
            className="flex items-center hover:text-slate-300 font-medium transition-colors"
          >
             <span className="w-3 h-3 rounded-full bg-slate-400 mr-2"></span>
            Mark B&W
          </button>
          
          <button 
             onClick={clearSelection}
             className="ml-2 p-1 hover:bg-gray-700 rounded-full"
          >
            <XCircleIcon className="w-6 h-6 text-gray-500 hover:text-white" />
          </button>
      </div>
    </div>
  );
};
