
import React, { useEffect, useCallback } from 'react';
import { PageData } from '../types';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

interface ImageViewerModalProps {
  page: PageData;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleStatus: (pageNumber: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  page,
  onClose,
  onNext,
  onPrev,
  onToggleStatus,
  hasPrev,
  hasNext
}) => {
  const isColor = page.isColorUserForced !== null ? page.isColorUserForced : page.isColorDetected;

  // Handle Keyboard Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    if (e.key === 'ArrowRight' && hasNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-fade-in text-white selection:bg-indigo-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10 z-30">
        <button 
          onClick={onClose}
          className="flex items-center text-gray-300 hover:text-white transition-colors group"
        >
          <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 mr-3 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </div>
          <span className="font-medium text-lg hidden sm:inline">Back to Grid</span>
        </button>

        <div className="flex items-center gap-4">
            <span className="text-gray-400 font-mono text-sm sm:text-base">Page {page.pageNumber}</span>
            <button
                onClick={() => onToggleStatus(page.pageNumber)}
                className={`
                    px-4 py-1.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center
                    ${isColor 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20' 
                        : 'bg-slate-600 text-white hover:bg-slate-500 shadow-slate-500/20'}
                `}
            >
                <span className={`w-2 h-2 rounded-full mr-2 ${isColor ? 'bg-white' : 'bg-gray-400'}`}></span>
                {isColor ? 'COLOR' : 'B&W'}
                <span className="ml-2 opacity-75 text-xs font-normal border-l border-white/30 pl-2 hidden sm:inline">
                    Click to Toggle
                </span>
            </button>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <XMarkIcon className="w-8 h-8 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden group/container">
        
        {/* Previous Navigation Hint (Overlay) */}
        {hasPrev && (
            <div 
                onClick={onPrev}
                className="absolute left-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-r from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 cursor-pointer hidden sm:block"
                title="Previous Page"
            />
        )}

        {/* Previous Button (Prominent) */}
        {hasPrev && (
            <button 
                onClick={onPrev}
                className="absolute left-4 sm:left-8 p-4 rounded-full bg-zinc-800/50 hover:bg-indigo-600 text-white backdrop-blur-md shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-indigo-500/30 border border-white/10 z-20 group/btn"
                aria-label="Previous Page"
            >
                <ChevronLeftIcon className="w-8 h-8 group-hover/btn:-translate-x-1 transition-transform" />
            </button>
        )}

        {/* Image Display */}
        <div className="relative w-full h-full max-w-7xl p-4 sm:p-8 flex items-center justify-center z-0">
            {page.thumbnailUrl ? (
                <img 
                    src={page.thumbnailUrl} 
                    alt={`Page ${page.pageNumber}`}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm ring-1 ring-white/10" 
                />
            ) : (
                <div className="flex flex-col items-center text-gray-500 animate-pulse">
                    <span className="text-xl font-light tracking-wide">Loading Preview...</span>
                </div>
            )}
        </div>

        {/* Next Navigation Hint (Overlay) */}
        {hasNext && (
            <div 
                onClick={onNext}
                className="absolute right-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-l from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 cursor-pointer hidden sm:block"
                title="Next Page"
            />
        )}

        {/* Next Button (Prominent) */}
        {hasNext && (
            <button 
                onClick={onNext}
                className="absolute right-4 sm:right-8 p-4 rounded-full bg-zinc-800/50 hover:bg-indigo-600 text-white backdrop-blur-md shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-indigo-500/30 border border-white/10 z-20 group/btn"
                aria-label="Next Page"
            >
                <ChevronRightIcon className="w-8 h-8 group-hover/btn:translate-x-1 transition-transform" />
            </button>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="py-4 text-center text-gray-500 text-sm bg-black/40 border-t border-white/5 z-30">
        <span className="hidden sm:inline">Use Arrow keys to navigate • </span>
        <span className="font-medium text-gray-400">Esc</span> to close
      </div>
    </div>
  );
};
