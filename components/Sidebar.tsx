
import React, { useMemo, useState, useEffect } from 'react';
import { PageData, ViewCategory } from '../types';
import { formatPageRanges } from '../utils/pdfUtils';
import { 
    ClipboardDocumentIcon, 
    DocumentChartBarIcon, 
    ArrowDownTrayIcon, 
    DocumentIcon, 
    SwatchIcon, 
    MoonIcon,
    ChevronDownIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  pages: PageData[];
  fileName: string | null;
  activeCategory: ViewCategory;
  onCategoryChange: (category: ViewCategory) => void;
  stats: {
    doubleColorSheets: number[];
    doubleBWSheets: number[];
    mixedColorPages: number[];
    mixedBWPages: number[];
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    pages, 
    fileName, 
    activeCategory, 
    onCategoryChange,
    stats 
}) => {
  
  const displayData = useMemo(() => {
    return {
      'all': {
        count: pages.length,
        range: `1-${pages.length}`,
        label: 'All Pages',
        type: 'bw' as const, // Neutral
        desc: 'Showing all pages in the document.'
      },
      'mixed-color': {
        count: stats.mixedColorPages.length,
        range: formatPageRanges(stats.mixedColorPages),
        label: 'Single Side Color',
        type: 'color' as const,
        desc: 'Individual Color pages from mixed sheets (e.g. Page 5 is Color, Page 6 is B&W). Print these as Single Side.'
      },
      'mixed-bw': {
        count: stats.mixedBWPages.length,
        range: formatPageRanges(stats.mixedBWPages),
        label: 'Single Side B&W',
        type: 'bw' as const,
        desc: 'Individual B&W pages from mixed sheets. Print these as Single Side.'
      },
      'double-color': {
        count: stats.doubleColorSheets.length,
        range: formatPageRanges(stats.doubleColorSheets),
        label: 'Double Side Color',
        type: 'color' as const,
        desc: 'Perfect Color Sheets (Both Odd & Even are Color). Safe to print Double Sided.'
      },
      'double-bw': {
        count: stats.doubleBWSheets.length,
        range: formatPageRanges(stats.doubleBWSheets),
        label: 'Double Side B&W',
        type: 'bw' as const,
        desc: 'Perfect B&W Sheets (Both Odd & Even are B&W). Safe to print Double Sided.'
      }
    };
  }, [pages.length, stats]);

  const exportToCSV = () => {
    const csvRows = [
      ['Page Number', 'Detected', 'Manual Override', 'Final Status', 'Total Pixels', 'Color Pixels']
    ];

    pages.forEach(page => {
      const isDetectedColor = page.isColorDetected;
      const userForce = page.isColorUserForced;
      const finalIsColor = userForce !== null ? userForce : isDetectedColor;
      const overrideStr = userForce === true ? 'Forced Color' : userForce === false ? 'Forced B&W' : '';

      csvRows.push([
        page.pageNumber.toString(),
        isDetectedColor ? 'Color' : 'B&W',
        overrideStr,
        finalIsColor ? 'Color' : 'B&W',
        page.pixelCount.toString(),
        page.colorPixelCount.toString()
      ]);
    });

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-analysis-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeData = displayData[activeCategory];

  return (
    <div className="w-full lg:w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl lg:shadow-none z-20">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50">
        
        {/* Metadata Section */}
        {fileName && (
            <div className="mb-6">
                <div className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="bg-indigo-50 p-2 rounded text-indigo-600 flex-shrink-0">
                        <DocumentIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate" title={fileName}>
                            {fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {pages.length} Pages • PDF
                        </p>
                    </div>
                </div>
            </div>
        )}

        <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4">
            <DocumentChartBarIcon className="w-5 h-5 mr-2 text-indigo-600" />
            Smart Split
        </h2>
        
        {/* Category Selector Dropdown */}
        <div className="relative mb-2">
            <select 
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value as ViewCategory)}
                className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-sm transition-shadow cursor-pointer"
            >
                <option value="all">Show All Pages</option>
                <option value="mixed-color">Single Side Color</option>
                <option value="mixed-bw">Single Side BnW</option>
                <option value="double-color">Double Side Color</option>
                <option value="double-bw">Double Side BnW</option>
            </select>
            <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
        </div>
        
        <p className="text-xs text-gray-500 leading-relaxed px-1 mt-2 min-h-[40px]">
           {activeData.desc}
        </p>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scroll bg-gray-50/50">
        <EditableResultCard 
            key={activeCategory} // Force re-render when category changes
            title={activeData.label}
            count={activeData.count}
            initialRange={activeData.range}
            type={activeData.type}
        />

        {/* Export Button */}
        <div className="mt-6 pt-2">
            <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
            >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Export Results (CSV)
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component for Editable Range ---

interface EditableResultCardProps {
    title: string;
    count: number;
    initialRange: string;
    type: 'color' | 'bw';
}

const EditableResultCard: React.FC<EditableResultCardProps> = ({ title, count, initialRange, type }) => {
    const [text, setText] = useState(initialRange);
    const [copied, setCopied] = useState(false);

    // Update text if the underlying analysis changes (e.g. user toggles a page in grid)
    useEffect(() => {
        setText(initialRange);
    }, [initialRange]);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setText(initialRange);
    };

    const isColor = type === 'color';
    const borderColor = isColor ? 'border-l-emerald-500' : 'border-l-slate-500';
    const bgColor = isColor ? 'bg-emerald-50' : 'bg-slate-50';
    const textColor = isColor ? 'text-emerald-900' : 'text-slate-900';
    const btnColor = isColor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800';
    const ringColor = isColor ? 'focus:ring-emerald-500' : 'focus:ring-slate-500';

    const Icon = isColor ? SwatchIcon : MoonIcon;

    return (
        <div className={`rounded-lg border shadow-sm p-4 ${bgColor} border-gray-200 ${borderColor} border-l-4 transition-all`}>
            <div className="flex justify-between items-center mb-3">
                <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center ${textColor}`}>
                    <Icon className="w-4 h-4 mr-2" />
                    {title}
                </h3>
                <span className="bg-white/90 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-gray-200 shadow-sm">
                    {count}
                </span>
            </div>

            <div className="relative group">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={`w-full h-32 p-3 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${ringColor} resize-none shadow-inner bg-white text-gray-800 leading-relaxed custom-scroll`}
                    placeholder="No pages detected in this category"
                />
                
                {/* Reset Button (Visible if text changed) */}
                {text !== initialRange && (
                    <button 
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md shadow-sm transition-colors"
                        title="Reset to calculated range"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <p className="text-[10px] text-gray-500 mt-1.5 mb-3 text-right">
                Edit range manually above if needed.
            </p>

            <button 
                onClick={handleCopy}
                disabled={!text}
                className={`flex items-center justify-center w-full py-2.5 px-3 rounded-md text-sm font-bold transition-all shadow-sm text-white disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
            >
                {copied ? (
                    <span className="flex items-center">Copied!</span>
                ) : (
                    <>
                        <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                        Copy Range
                    </>
                )}
            </button>
        </div>
    );
};
